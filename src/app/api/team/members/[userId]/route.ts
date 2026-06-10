import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: targetId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Only the team owner can remove members (and can't remove themselves)
  const { data: team } = await supabase.from("teams").select("id").eq("owner_id", user.id).single();
  if (!team) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (targetId === user.id) return Response.json({ error: "Cannot remove yourself. Delete the team instead." }, { status: 400 });

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await Promise.all([
    service.from("team_members").delete().eq("team_id", team.id).eq("user_id", targetId),
    service.from("users").update({ team_id: null }).eq("id", targetId),
  ]);

  return Response.json({ ok: true });
}
