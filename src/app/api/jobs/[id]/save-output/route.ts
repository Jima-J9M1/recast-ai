import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ContentFormat } from "@/lib/openai";

const VALID_FORMATS = new Set<ContentFormat>(["blog", "twitter_thread", "linkedin", "newsletter"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { format?: string; content?: string };
  const format = body.format as ContentFormat;
  if (!VALID_FORMATS.has(format)) {
    return Response.json({ error: "Invalid format" }, { status: 400 });
  }
  if (!body.content?.trim()) {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!job) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: latest } = await supabase
    .from("outputs")
    .select("version")
    .eq("job_id", id)
    .eq("type", format)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latest?.version ?? 1) + 1;

  await supabase
    .from("outputs")
    .insert({ job_id: id, type: format, content: body.content, version: nextVersion });

  return Response.json({ version: nextVersion });
}
