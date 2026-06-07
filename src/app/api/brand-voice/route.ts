import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface BrandVoice {
  persona: string;
  audience: string;
  style_notes: string;
  key_phrases: string;
  avoid_phrases: string;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("users")
    .select("brand_voice")
    .eq("id", user.id)
    .single();

  return Response.json({ brand_voice: (data?.brand_voice as BrandVoice) ?? null });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Partial<BrandVoice>;

  const brand_voice: BrandVoice = {
    persona:       (body.persona ?? "").trim(),
    audience:      (body.audience ?? "").trim(),
    style_notes:   (body.style_notes ?? "").trim(),
    key_phrases:   (body.key_phrases ?? "").trim(),
    avoid_phrases: (body.avoid_phrases ?? "").trim(),
  };

  const { error } = await supabase
    .from("users")
    .update({ brand_voice })
    .eq("id", user.id);

  if (error) return Response.json({ error: "Failed to save" }, { status: 500 });

  return Response.json({ success: true });
}
