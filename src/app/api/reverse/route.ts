import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReverseContent } from "@/lib/openai";
import { PLAN_LIMITS, LANGUAGES, type ToneStyle, type Language } from "@/types";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

const VALID_TONES = new Set<ToneStyle>([
  "professional", "casual", "storytelling", "educational", "humorous",
]);
const VALID_LANGUAGES = new Set<Language>(LANGUAGES.map((l) => l.code));

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { text?: string; tone?: string; language?: string };

  const text = body.text?.trim();
  if (!text || text.length < 50) {
    return Response.json({ error: "Please provide at least 50 characters of text." }, { status: 400 });
  }

  const tone: ToneStyle = VALID_TONES.has(body.tone as ToneStyle)
    ? (body.tone as ToneStyle)
    : "professional";

  const language: Language = VALID_LANGUAGES.has(body.language as Language)
    ? (body.language as Language)
    : "English";

  // Rate limit: 5 per minute
  const { allowed } = await checkRateLimit(user.id, "reverse");
  if (!allowed) return rateLimitResponse();

  // Plan + usage check (counts as 1 credit)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabase.from("users").select("plan").eq("id", user.id).single(),
    supabase.from("usage").select("count").eq("user_id", user.id).eq("month", currentMonth).single(),
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

  // Generate all 4 outputs in parallel
  const [videoScript, videoHooks, thumbnailIdeas, tweetThread] = await Promise.all([
    generateReverseContent(text, "video_script", tone, language),
    generateReverseContent(text, "video_hooks", tone, language),
    generateReverseContent(text, "thumbnail_ideas", tone, language),
    generateReverseContent(text, "tweet_thread", tone, language),
  ]);

  // Increment usage
  await supabase.rpc("increment_usage", { p_user_id: user.id, p_month: currentMonth });

  return Response.json({ videoScript, videoHooks, thumbnailIdeas, tweetThread });
}
