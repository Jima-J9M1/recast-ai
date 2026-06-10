import { NextRequest, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndSave } from "@/lib/processor";
import { BATCH_LIMITS, PLAN_LIMITS, LANGUAGES, type ToneStyle, type Language, type Plan } from "@/types";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getTeamBilling } from "@/lib/team";

const VALID_TONES = new Set<ToneStyle>([
  "professional", "casual", "storytelling", "educational", "humorous",
]);
const VALID_LANGUAGES = new Set<Language>(LANGUAGES.map((l) => l.code));
const YT_PATTERN = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    urls?: unknown; tone?: string; language?: string; languages?: unknown; seo_mode?: boolean;
  };

  const rawUrls = Array.isArray(body.urls) ? body.urls : [];
  const urls = rawUrls.filter((u): u is string => typeof u === "string" && YT_PATTERN.test(u.trim()));

  if (urls.length === 0) {
    return Response.json({ error: "No valid YouTube URLs provided" }, { status: 400 });
  }

  const tone: ToneStyle = VALID_TONES.has(body.tone as ToneStyle) ? (body.tone as ToneStyle) : "professional";
  const primaryLanguage: Language = VALID_LANGUAGES.has(body.language as Language) ? (body.language as Language) : "English";
  const seoMode = body.seo_mode === true;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { billingUserId, plan: billingPlan } = await getTeamBilling(user.id);
  const { data: usage } = await supabase
    .from("usage").select("count").eq("user_id", billingUserId).eq("month", currentMonth).single();

  const plan = billingPlan as Plan;
  const batchLimit = BATCH_LIMITS[plan];

  if (batchLimit === 0) {
    return Response.json(
      { error: "Batch processing requires a Starter or Pro plan." },
      { status: 403 }
    );
  }

  // Multi-language: Pro only. Validate and cap at 3 languages total.
  const rawLangs = Array.isArray(body.languages) ? body.languages : [primaryLanguage];
  const requestedLangs: Language[] = rawLangs
    .filter((l): l is Language => VALID_LANGUAGES.has(l as Language))
    .slice(0, 3);
  const effectiveLangs = plan === "pro" && requestedLangs.length > 0 ? requestedLangs : [primaryLanguage];

  const monthlyLimit = PLAN_LIMITS[plan];
  const usedCount = usage?.count ?? 0;
  const remainingCredits = monthlyLimit === null ? urls.length * effectiveLangs.length : Math.max(0, monthlyLimit - usedCount);

  if (remainingCredits === 0) {
    return Response.json(
      { error: "You've reached your monthly limit. Upgrade to continue." },
      { status: 429 }
    );
  }

  const { allowed } = await checkRateLimit(user.id, "batch", 3, 60);
  if (!allowed) return rateLimitResponse();

  // Cap URLs so total jobs don't exceed remaining credits
  const maxUrls = Math.min(batchLimit, Math.floor(remainingCredits / effectiveLangs.length));
  const toProcess = urls.slice(0, maxUrls);

  // Create one job per URL × language combination
  const pairs: { url: string; language: Language }[] = toProcess.flatMap((url) =>
    effectiveLangs.map((lang) => ({ url, language: lang }))
  );

  const results = await Promise.all(
    pairs.map(({ url, language }) =>
      supabase
        .from("jobs")
        .insert({ user_id: user.id, source_type: "youtube", source_url: url.trim(), status: "transcribing", tone, language, seo_mode: seoMode })
        .select("id")
        .single()
    )
  );

  const jobIds = results.flatMap(({ data }) => (data ? [data.id as string] : []));

  if (jobIds.length === 0) {
    return Response.json({ error: "Failed to create jobs" }, { status: 500 });
  }

  after(() => processBatch(jobIds, pairs, tone, seoMode, billingUserId, currentMonth));

  return Response.json({ jobIds, queued: jobIds.length, skipped: urls.length - toProcess.length });
}

async function processBatch(
  jobIds: string[],
  pairs: { url: string; language: Language }[],
  tone: ToneStyle,
  seoMode: boolean,
  userId: string,
  currentMonth: string
) {
  // Sequential to avoid Groq rate-limit errors (each job makes ~6 API calls)
  for (let i = 0; i < jobIds.length; i++) {
    await processOne(jobIds[i], pairs[i].url, tone, pairs[i].language, seoMode, userId, currentMonth);
  }
}

async function processOne(
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
    const apiKey = process.env.SUPADATA_API_KEY;
    if (!apiKey) throw new TypeError("SUPADATA_API_KEY not configured");

    const res = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(url)}`,
      { headers: { "x-api-key": apiKey } }
    );
    if (!res.ok) throw new Error(`Supadata ${res.status}`);

    const data = await res.json() as Record<string, unknown>;
    let transcript: string;

    if (Array.isArray(data.content)) {
      transcript = (data.content as Array<{ text?: string }>).map((c) => c.text ?? "").join(" ");
    } else if (typeof data.content === "string") {
      transcript = data.content;
    } else {
      throw new TypeError("Unexpected Supadata format");
    }

    if (transcript.trim().length < 50) throw new Error("Transcript too short");

    await supabase.from("jobs").update({ status: "generating", transcript }).eq("id", jobId);
    await generateAndSave(jobId, transcript, tone, language, seoMode, userId, currentMonth);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("jobs").update({ status: "failed", error_message: message }).eq("id", jobId);
  }
}
