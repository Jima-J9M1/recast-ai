import { NextRequest, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndSave } from "@/lib/processor";
import { PLAN_LIMITS, LANGUAGES, type ToneStyle, type Language } from "@/types";
import { getTeamBilling } from "@/lib/team";

const VALID_TONES = new Set<ToneStyle>(["professional", "casual", "storytelling", "educational", "humorous"]);
const VALID_LANGUAGES = new Set<Language>(LANGUAGES.map((l) => l.code));
const ALLOWED_TYPES = new Set([
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
  "audio/mp4", "audio/x-m4a", "audio/m4a",
  "audio/ogg", "audio/webm", "audio/flac", "audio/x-flac",
]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

async function transcribeAudio(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq Whisper ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json() as { text?: string };
  const text = data.text?.trim() ?? "";

  if (text.length < 30) throw new Error("Transcript too short — audio may be silent or unsupported.");
  return text;
}

async function processAudioJob(
  jobId: string,
  audioBuffer: Buffer,
  filename: string,
  mimeType: string,
  tone: ToneStyle,
  language: string,
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
    console.log(`[job:${jobId}] transcribing audio: ${filename}`);
    const transcript = await transcribeAudio(audioBuffer, filename, mimeType);
    console.log(`[job:${jobId}] transcript: ${transcript.length} chars`);

    await supabase.from("jobs").update({ status: "generating", transcript }).eq("id", jobId);

    await generateAndSave(jobId, transcript, tone, language, seoMode, userId, currentMonth);

    console.log(`[job:${jobId}] completed`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[job:${jobId}] FAILED:`, message);
    await supabase.from("jobs").update({ status: "failed", error_message: message }).eq("id", jobId);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: "Unsupported file type. Use MP3, M4A, WAV, OGG, WebM, or FLAC." },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File too large. Maximum size is 4 MB." }, { status: 413 });
  }

  const tone: ToneStyle = VALID_TONES.has(formData.get("tone") as ToneStyle)
    ? (formData.get("tone") as ToneStyle)
    : "professional";

  const language: Language = VALID_LANGUAGES.has(formData.get("language") as Language)
    ? (formData.get("language") as Language)
    : "English";

  const seoMode = formData.get("seo_mode") === "true";

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { billingUserId, plan } = await getTeamBilling(user.id);
  const { data: usage } = await supabase
    .from("usage").select("count").eq("user_id", billingUserId).eq("month", currentMonth).single();

  const limit = PLAN_LIMITS[plan];
  const used = usage?.count ?? 0;

  if (limit !== null && used >= limit) {
    return Response.json(
      { error: `You've reached your ${limit} job limit for this month. Upgrade to continue.` },
      { status: 429 }
    );
  }

  const title = file.name.replace(/\.[^.]+$/, "");

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({ user_id: user.id, source_type: "upload", source_url: null, status: "transcribing", tone, language, seo_mode: seoMode, title })
    .select("id")
    .single();

  if (jobError || !job) {
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }

  const audioBuffer = Buffer.from(await file.arrayBuffer());
  after(() => processAudioJob(job.id, audioBuffer, file.name, file.type, tone, language, seoMode, billingUserId, currentMonth));

  return Response.json({ jobId: job.id });
}
