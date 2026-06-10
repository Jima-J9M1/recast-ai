import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("webhooks")
    .select("id, url, secret, active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return Response.json({ webhooks: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { url?: string; secret?: string };
  const url = body.url?.trim();

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return Response.json({ error: "A valid HTTPS URL is required." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("webhooks")
    .select("id")
    .eq("user_id", user.id);

  if ((existing?.length ?? 0) >= 5) {
    return Response.json({ error: "Max 5 webhooks per account." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("webhooks")
    .insert({ user_id: user.id, url, secret: body.secret?.trim() || null })
    .select("id, url, secret, active, created_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ webhook: data }, { status: 201 });
}
