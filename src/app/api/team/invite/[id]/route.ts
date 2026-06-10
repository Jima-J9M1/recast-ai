import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as svcClient } from "@supabase/supabase-js";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = svcClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Only team owner can revoke invites
  const { data: team } = await admin.from("teams").select("id").eq("owner_id", user.id).single();
  if (!team) return Response.json({ error: "Forbidden." }, { status: 403 });

  await admin.from("team_invites").delete().eq("id", id).eq("team_id", team.id);
  return Response.json({ ok: true });
}
