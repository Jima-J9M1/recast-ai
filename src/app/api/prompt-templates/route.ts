import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OutputType } from "@/types";

const VALID_FORMATS = new Set<OutputType>(["blog", "twitter_thread", "linkedin", "newsletter"]);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("prompt_templates")
    .select("format, prompt, updated_at")
    .eq("user_id", user.id);

  return Response.json({ templates: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Pro-only gate
  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();
  if (profile?.plan !== "pro" && profile?.plan !== "starter") {
    return Response.json({ error: "Custom prompts require a Starter or Pro plan." }, { status: 403 });
  }

  const body = await request.json() as { format?: string; prompt?: string | null };
  const { format, prompt } = body;

  if (!format || !VALID_FORMATS.has(format as OutputType)) {
    return Response.json({ error: "Invalid format" }, { status: 400 });
  }

  // null prompt = delete (reset to default)
  if (prompt === null || prompt === undefined || prompt.trim() === "") {
    await supabase
      .from("prompt_templates")
      .delete()
      .eq("user_id", user.id)
      .eq("format", format);
    return Response.json({ success: true, reset: true });
  }

  if (!prompt.includes("{transcript}")) {
    return Response.json(
      { error: "Prompt must include the {transcript} variable." },
      { status: 400 }
    );
  }

  await supabase
    .from("prompt_templates")
    .upsert(
      { user_id: user.id, format, prompt: prompt.trim(), updated_at: new Date().toISOString() },
      { onConflict: "user_id,format" }
    );

  return Response.json({ success: true });
}
