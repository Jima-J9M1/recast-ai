import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("webhooks").delete().eq("id", id).eq("user_id", user.id);
  return Response.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { active?: boolean };
  const { data } = await supabase
    .from("webhooks")
    .update({ active: body.active })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, url, secret, active, created_at")
    .single();

  return Response.json({ webhook: data });
}
