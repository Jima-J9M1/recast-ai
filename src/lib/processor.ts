import {
  generateContent,
  generateTitle,
  generateExtras,
  buildBrandVoiceNote,
  applyBrandVoice,
  SEO_BLOG_PROMPT,
  type BrandVoice,
} from "@/lib/openai";
import { scoreJobOutputs } from "@/lib/scorer";
import type { ToneStyle } from "@/types";

export async function generateAndSave(
  jobId: string,
  transcript: string,
  tone: ToneStyle,
  language: string,
  seoMode: boolean,
  userId: string,
  currentMonth: string
): Promise<void> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: templates }, { data: userData }] = await Promise.all([
    supabase.from("prompt_templates").select("format, prompt").eq("user_id", userId),
    supabase.from("users").select("brand_voice").eq("id", userId).single(),
  ]);

  const customPrompts = Object.fromEntries(
    (templates ?? []).map((t: { format: string; prompt: string }) => [t.format, t.prompt])
  ) as Partial<Record<string, string>>;
  const bvNote = buildBrandVoiceNote((userData?.brand_voice as BrandVoice) ?? null);

  const blogPrompt = seoMode
    ? SEO_BLOG_PROMPT + bvNote
    : applyBrandVoice("blog", customPrompts["blog"], bvNote);

  const [title, blog, twitter] = await Promise.all([
    generateTitle(transcript),
    generateContent(transcript, "blog", tone, blogPrompt, language),
    generateContent(transcript, "twitter_thread", tone, applyBrandVoice("twitter_thread", customPrompts["twitter_thread"], bvNote), language),
  ]);

  const [linkedin, newsletter, emailSeq, extras] = await Promise.all([
    generateContent(transcript, "linkedin", tone, applyBrandVoice("linkedin", customPrompts["linkedin"], bvNote), language),
    generateContent(transcript, "newsletter", tone, applyBrandVoice("newsletter", customPrompts["newsletter"], bvNote), language),
    generateContent(transcript, "email_sequence", tone, applyBrandVoice("email_sequence", customPrompts["email_sequence"], bvNote), language),
    generateExtras(transcript),
  ]);

  await supabase.from("jobs").update({ title }).eq("id", jobId);
  await supabase.from("outputs").insert([
    { job_id: jobId, type: "blog",           content: blog,      version: 1 },
    { job_id: jobId, type: "twitter_thread", content: twitter,   version: 1 },
    { job_id: jobId, type: "linkedin",       content: linkedin,  version: 1 },
    { job_id: jobId, type: "newsletter",     content: newsletter, version: 1 },
    { job_id: jobId, type: "email_sequence", content: emailSeq,  version: 1 },
    { job_id: jobId, type: "extras",         content: extras,    version: 1 },
  ]);
  await supabase.from("jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", jobId);
  await supabase.rpc("increment_usage", { p_user_id: userId, p_month: currentMonth });

  // Fire webhooks + scoring (best-effort, non-blocking)
  void fireWebhooks(userId, jobId, title ?? "");
  void scoreJobOutputs(jobId);
}

async function fireWebhooks(userId: string, jobId: string, title: string) {
  const { createClient: svc } = await import("@supabase/supabase-js");
  const supabase = svc(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: hooks } = await supabase
    .from("webhooks")
    .select("url, secret")
    .eq("user_id", userId)
    .eq("active", true);

  if (!hooks || hooks.length === 0) return;

  const payload = JSON.stringify({ event: "job.completed", job_id: jobId, title, timestamp: new Date().toISOString() });

  await Promise.allSettled(
    hooks.map(async (hook: { url: string; secret: string | null }) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (hook.secret) headers["X-RecastAI-Secret"] = hook.secret;
      await fetch(hook.url, { method: "POST", headers, body: payload, signal: AbortSignal.timeout(8000) });
    })
  );
}
