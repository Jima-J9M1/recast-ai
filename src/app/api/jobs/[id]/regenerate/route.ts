import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContent, DEFAULT_PROMPTS, buildBrandVoiceNote, type BrandVoice, type ContentFormat } from "@/lib/openai";
import type { ToneStyle } from "@/types";

const VALID_FORMATS = new Set<ContentFormat>(["blog", "twitter_thread", "linkedin", "newsletter"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { format?: string; instruction?: string };
  const format = body.format as ContentFormat;
  if (!VALID_FORMATS.has(format)) {
    return Response.json({ error: "Invalid format" }, { status: 400 });
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("transcript, tone, language, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!job) return Response.json({ error: "Not found" }, { status: 404 });
  if (job.status !== "completed") return Response.json({ error: "Job not completed" }, { status: 400 });
  if (!job.transcript) return Response.json({ error: "No transcript available" }, { status: 400 });

  const [{ data: template }, { data: userData }] = await Promise.all([
    supabase.from("prompt_templates").select("prompt").eq("user_id", user.id).eq("format", format).maybeSingle(),
    supabase.from("users").select("brand_voice").eq("id", user.id).single(),
  ]);

  const bvNote = buildBrandVoiceNote((userData?.brand_voice as BrandVoice) ?? null);
  let customPrompt: string | undefined = template?.prompt;

  if (bvNote) {
    customPrompt = (customPrompt ?? DEFAULT_PROMPTS[format]) + bvNote;
  }

  const instruction = body.instruction?.trim();
  if (instruction) {
    const base = customPrompt ?? DEFAULT_PROMPTS[format];
    customPrompt = `${base}\n\nAdditional instruction from user: ${instruction}`;
  }

  const content = await generateContent(
    job.transcript,
    format,
    (job.tone as ToneStyle) ?? "professional",
    customPrompt,
    job.language ?? "English"
  );

  await supabase
    .from("outputs")
    .update({ content })
    .eq("job_id", id)
    .eq("type", format);

  return Response.json({ content });
}
