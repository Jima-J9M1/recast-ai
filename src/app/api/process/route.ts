import { NextRequest, after } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { createClient } from "@/lib/supabase/server";
import { generateContent, generateTitle } from "@/lib/openai";
import { PLAN_LIMITS } from "@/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url } = body as { url: string };

  if (!url || typeof url !== "string") {
    return Response.json({ error: "Missing URL" }, { status: 400 });
  }

  // Load user profile & check usage limit
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabase.from("users").select("plan").eq("id", user.id).single(),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .single(),
  ]);

  const plan = (profile?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan];
  const used = usage?.count ?? 0;

  if (limit !== null && used >= limit) {
    return Response.json(
      { error: `You've reached your ${limit} video limit for this month. Upgrade to continue.` },
      { status: 429 }
    );
  }

  // Create job record
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      source_type: "youtube",
      source_url: url,
      status: "transcribing",
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }

  // after() keeps the serverless function alive past the response on Vercel
  after(() => processJob(job.id, url, user.id, currentMonth));

  return Response.json({ jobId: job.id });
}

async function processJob(
  jobId: string,
  url: string,
  userId: string,
  currentMonth: string
) {
  // Use service role client for background work
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  try {
    // Fetch transcript
    const transcriptItems = await YoutubeTranscript.fetchTranscript(url);
    const transcript = transcriptItems.map((t) => t.text).join(" ");

    if (!transcript || transcript.trim().length < 50) {
      throw new Error("Transcript too short or unavailable");
    }

    // Update status to generating
    await supabase
      .from("jobs")
      .update({ status: "generating", transcript })
      .eq("id", jobId);

    // Generate in two waves to stay within Groq's free-tier TPM limit.
    // Wave 1: title (fast 8B model) + blog + twitter
    const [title, blog, twitter] = await Promise.all([
      generateTitle(transcript),
      generateContent(transcript, "blog"),
      generateContent(transcript, "twitter_thread"),
    ]);

    // Wave 2: linkedin + newsletter
    const [linkedin, newsletter] = await Promise.all([
      generateContent(transcript, "linkedin"),
      generateContent(transcript, "newsletter"),
    ]);

    // Update job title
    await supabase.from("jobs").update({ title }).eq("id", jobId);

    // Save outputs
    await supabase.from("outputs").insert([
      { job_id: jobId, type: "blog", content: blog },
      { job_id: jobId, type: "twitter_thread", content: twitter },
      { job_id: jobId, type: "linkedin", content: linkedin },
      { job_id: jobId, type: "newsletter", content: newsletter },
    ]);

    // Mark completed
    await supabase
      .from("jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", jobId);

    // Increment usage counter
    await supabase.rpc("increment_usage", { p_user_id: userId, p_month: currentMonth });
  } catch (err) {
    await supabase
      .from("jobs")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", jobId);
  }
}
