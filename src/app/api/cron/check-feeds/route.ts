import { NextRequest } from "next/server";
import { generateAndSave } from "@/lib/processor";
import type { ToneStyle } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: feeds } = await supabase
    .from("feeds")
    .select("*")
    .eq("active", true);

  if (!feeds || feeds.length === 0) {
    return Response.json({ processed: 0 });
  }

  let processed = 0;

  await Promise.all(
    feeds.map((feed: FeedRow) => checkFeed(feed).then((created) => { if (created) processed++; }))
  );

  return Response.json({ processed });
}

interface FeedRow {
  id: string;
  user_id: string;
  channel_id: string;
  rss_url: string;
  last_video_id: string | null;
  tone: string;
  language: string;
  seo_mode: boolean;
}

async function checkFeed(feed: FeedRow): Promise<boolean> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const res = await fetch(feed.rss_url, { headers: { "User-Agent": "RecastAI/1.0" } });
    if (!res.ok) return false;

    const xml = await res.text();
    const videoIdMatch = xml.match(/<yt:videoId>([\w-]+)<\/yt:videoId>/);
    const latestVideoId = videoIdMatch?.[1];
    if (!latestVideoId) return false;
    if (latestVideoId === feed.last_video_id) return false;

    const videoUrl = `https://www.youtube.com/watch?v=${latestVideoId}`;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const { data: job } = await supabase
      .from("jobs")
      .insert({
        user_id: feed.user_id,
        source_type: "youtube",
        source_url: videoUrl,
        status: "transcribing",
        tone: feed.tone,
        language: feed.language,
        seo_mode: feed.seo_mode,
      })
      .select("id")
      .single();

    if (!job) return false;

    await supabase.from("feeds").update({ last_video_id: latestVideoId }).eq("id", feed.id);

    const apiKey = process.env.SUPADATA_API_KEY;
    if (!apiKey) throw new TypeError("SUPADATA_API_KEY not configured");

    const transcriptRes = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(videoUrl)}`,
      { headers: { "x-api-key": apiKey } }
    );
    if (!transcriptRes.ok) throw new Error(`Supadata ${transcriptRes.status}`);

    const data = await transcriptRes.json() as Record<string, unknown>;
    let transcript: string;

    if (Array.isArray(data.content)) {
      transcript = (data.content as Array<{ text?: string }>).map((c) => c.text ?? "").join(" ");
    } else if (typeof data.content === "string") {
      transcript = data.content;
    } else {
      throw new TypeError("Unexpected Supadata format");
    }

    if (transcript.trim().length < 50) throw new Error("Transcript too short");

    await supabase.from("jobs").update({ status: "generating", transcript }).eq("id", job.id);
    await generateAndSave(job.id, transcript, feed.tone as ToneStyle, feed.language, feed.seo_mode, feed.user_id, currentMonth);

    return true;
  } catch (err) {
    console.error(`[feeds] Error processing feed ${feed.id}:`, err instanceof Error ? err.message : err);
    return false;
  }
}
