import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { token?: string };
  const token = body.token?.trim();
  if (!token) return Response.json({ error: "Token required." }, { status: 400 });

  // Check if already in a team
  const { data: profile } = await supabase.from("users").select("team_id").eq("id", user.id).single();
  if (profile?.team_id) return Response.json({ error: "You are already in a team." }, { status: 400 });

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: invite } = await service
    .from("team_invites")
    .select("id, team_id, expires_at, accepted_at, teams(name)")
    .eq("token", token)
    .single();

  if (!invite) return Response.json({ error: "Invalid invite link." }, { status: 404 });
  if (invite.accepted_at) return Response.json({ error: "This invite has already been used." }, { status: 400 });
  if (new Date(invite.expires_at) < new Date()) return Response.json({ error: "This invite has expired." }, { status: 400 });

  await Promise.all([
    service.from("team_members").insert({ team_id: invite.team_id, user_id: user.id, role: "member", joined_at: new Date().toISOString() }),
    service.from("users").update({ team_id: invite.team_id }).eq("id", user.id),
    service.from("team_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id),
  ]);

  const teamName = (invite.teams as { name?: string } | null)?.name ?? "the team";
  return Response.json({ ok: true, teamName });
}
