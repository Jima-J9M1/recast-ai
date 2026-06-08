import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FEED_LIMITS, LANGUAGES, type ToneStyle, type Language, type Plan } from "@/types";

const VALID_TONES = new Set<ToneStyle>([
  "professional", "casual", "storytelling", "educational", "humorous",
]);
const VALID_LANGUAGES = new Set<Language>(LANGUAGES.map((l) => l.code));

async function resolveChannelId(input: string): Promise<{ channelId: string; rssUrl: string } | null> {
  const trimmed = input.trim();

  const idMatch = trimmed.match(/(?:youtube\.com\/channel\/|^)(UC[\w-]{22})(?:[/?#]|$)/);
  if (idMatch) {
    const channelId = idMatch[1]!;
    return { channelId, rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}` };
  }

  let pageUrl = trimmed;
  if (!pageUrl.startsWith("http")) {
    pageUrl = trimmed.startsWith("@") ? `https://www.youtube.com/${trimmed}` : `https://www.youtube.com/@${trimmed}`;
  }

  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RecastAI/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const canonical = html.match(/rel="canonical"\s+href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]+)"/);
    if (canonical?.[1]) {
      const channelId = canonical[1];
      return { channelId, rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}` };
    }
    const externalId = html.match(/"externalChannelId":"(UC[\w-]+)"/);
    if (externalId?.[1]) {
      const channelId = externalId[1];
      return { channelId, rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}` };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: feeds } = await supabase
    .from("feeds")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return Response.json({ feeds: feeds ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    channel_url?: string; tone?: string; language?: string; seo_mode?: boolean;
  };

  if (!body.channel_url || typeof body.channel_url !== "string") {
    return Response.json({ error: "channel_url is required" }, { status: 400 });
  }

  const tone: ToneStyle = VALID_TONES.has(body.tone as ToneStyle) ? (body.tone as ToneStyle) : "professional";
  const language: Language = VALID_LANGUAGES.has(body.language as Language) ? (body.language as Language) : "English";
  const seoMode = body.seo_mode === true;

  const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single();
  const plan = (profile?.plan ?? "free") as Plan;
  const feedLimit = FEED_LIMITS[plan];

  if (feedLimit === 0) {
    return Response.json(
      { error: "RSS auto-import requires a Starter or Pro plan." },
      { status: 403 }
    );
  }

  const { count } = await supabase.from("feeds").select("id", { count: "exact", head: true }).eq("user_id", user.id);

  if ((count ?? 0) >= feedLimit) {
    return Response.json(
      { error: `Your plan allows ${feedLimit} feed${feedLimit === 1 ? "" : "s"}. Upgrade to add more.` },
      { status: 403 }
    );
  }

  const resolved = await resolveChannelId(body.channel_url);
  if (!resolved) {
    return Response.json({ error: "Could not resolve YouTube channel. Try using the channel URL with /channel/UC..." }, { status: 422 });
  }

  const { data: feed, error } = await supabase
    .from("feeds")
    .insert({
      user_id: user.id,
      channel_id: resolved.channelId,
      rss_url: resolved.rssUrl,
      tone,
      language,
      seo_mode: seoMode,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "You already have a feed for this channel." }, { status: 409 });
    }
    return Response.json({ error: "Failed to create feed" }, { status: 500 });
  }

  return Response.json({ feed }, { status: 201 });
}
