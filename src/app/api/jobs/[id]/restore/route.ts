import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OutputType } from "@/types";

const VALID_TYPES = new Set<OutputType>(["blog", "twitter_thread", "linkedin", "newsletter"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { type?: string; version?: number };
  const type = body.type as OutputType;
  const version = body.version;

  if (!VALID_TYPES.has(type) || typeof version !== "number") {
    return Response.json({ error: "Invalid type or version" }, { status: 400 });
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: source } = await supabase
    .from("outputs")
    .select("content")
    .eq("job_id", id)
    .eq("type", type)
    .eq("version", version)
    .single();
  if (!source) return Response.json({ error: "Version not found" }, { status: 404 });

  const { data: latest } = await supabase
    .from("outputs")
    .select("version")
    .eq("job_id", id)
    .eq("type", type)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latest?.version ?? 1) + 1;
  await supabase
    .from("outputs")
    .insert({ job_id: id, type, content: source.content, version: nextVersion });

  return Response.json({ content: source.content, version: nextVersion });
}
