import { NextRequest, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndSave } from "@/lib/processor";
import { PLAN_LIMITS, LANGUAGES, type ToneStyle, type Language } from "@/types";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getTeamBilling } from "@/lib/team";
import { friendlyJobError } from "@/lib/errors";

const VALID_TONES = new Set<ToneStyle>([
  "professional", "casual", "storytelling", "educational", "humorous",
]);

const VALID_LANGUAGES = new Set<Language>(LANGUAGES.map((l) => l.code));

async function fetchYoutubeTranscript(url: string): Promise<string> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new TypeError("SUPADATA_API_KEY not configured");

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(url)}`,
    { headers: { "x-api-key": apiKey } }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supadata ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json() as Record<string, unknown>;
  console.log(`[transcript] Supadata keys:`, Object.keys(data));

  let text: string;
  if (Array.isArray(data.content)) {
    text = (data.content as Array<{ text?: string }>)
      .map((c) => c.text ?? "")
      .join(" ");
  } else if (typeof data.content === "string") {
    text = data.content;
  } else {
    throw new TypeError(`Unexpected Supadata format: ${JSON.stringify(data).slice(0, 200)}`);
  }

  if (text.trim().length < 50) {
    throw new Error(`Transcript too short (${text.length} chars)`);
  }

  return text;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { url?: string; tone?: string; language?: string; seo_mode?: boolean };
  const { url } = body;

  if (!url || typeof url !== "string") {
    return Response.json({ error: "Missing URL" }, { status: 400 });
  }

  const tone: ToneStyle = VALID_TONES.has(body.tone as ToneStyle)
    ? (body.tone as ToneStyle)
    : "professional";

  const language: Language = VALID_LANGUAGES.has(body.language as Language)
    ? (body.language as Language)
    : "English";

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { billingUserId, plan } = await getTeamBilling(user.id);
  const { data: usage } = await supabase
    .from("usage").select("count").eq("user_id", billingUserId).eq("month", currentMonth).single();

  const limit = PLAN_LIMITS[plan];
  const used = usage?.count ?? 0;

  if (limit !== null && used >= limit) {
    return Response.json(
      { error: `You've reached your ${limit} video limit for this month. Upgrade to continue.` },
      { status: 429 }
    );
  }

  const { allowed } = await checkRateLimit(user.id, "process");
  if (!allowed) return rateLimitResponse();

  const seoMode = body.seo_mode === true;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({ user_id: user.id, source_type: "youtube", source_url: url, status: "transcribing", tone, language, seo_mode: seoMode })
    .select("id")
    .single();

  if (jobError || !job) {
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }

  after(() => processJob(job.id, url, tone, language, seoMode, billingUserId, currentMonth));

  return Response.json({ jobId: job.id });
}

async function processJob(
  jobId: string,
  url: string,
  tone: ToneStyle,
  language: Language,
  seoMode: boolean,
  userId: string,
  currentMonth: string
) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log(`[job:${jobId}] starting — tone: ${tone} lang: ${language}`);

    const transcript = await fetchYoutubeTranscript(url);
    console.log(`[job:${jobId}] transcript: ${transcript.length} chars`);

    const { data: check } = await supabase.from("jobs").select("status").eq("id", jobId).single();
    if (check?.status === "cancelled") return;

    await supabase.from("jobs").update({ status: "generating", transcript }).eq("id", jobId);

    await generateAndSave(jobId, transcript, tone, language, seoMode, userId, currentMonth);

    console.log(`[job:${jobId}] completed`);
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unknown error";
    console.error(`[job:${jobId}] FAILED:`, raw);
    await supabase.from("jobs").update({ status: "failed", error_message: friendlyJobError(raw) }).eq("id", jobId);
  }
}
