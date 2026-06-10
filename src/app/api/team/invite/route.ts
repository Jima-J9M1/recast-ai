import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team } = await supabase.from("teams").select("id").eq("owner_id", user.id).single();
  if (!team) return Response.json({ error: "You must own a team to create invites." }, { status: 403 });

  // Count current members
  const { data: members } = await supabase.from("team_members").select("user_id").eq("team_id", team.id);
  if ((members?.length ?? 0) >= 10) {
    return Response.json({ error: "Max 10 members per team." }, { status: 400 });
  }

  // Invalidate old unused invites and create a fresh one
  const token = crypto.randomUUID();
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await service.from("team_invites")
    .update({ expires_at: new Date().toISOString() })
    .eq("team_id", team.id)
    .is("accepted_at", null);

  await service.from("team_invites").insert({
    team_id: team.id,
    token,
    created_by: user.id,
  });

  return Response.json({ token });
}
