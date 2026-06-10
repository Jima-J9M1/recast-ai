import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("team_id, plan")
    .eq("id", user.id)
    .single();

  if (!profile?.team_id) return Response.json({ team: null, members: [], plan: profile?.plan ?? "free" });

  const [{ data: team }, { data: members }] = await Promise.all([
    supabase.from("teams").select("id, name, owner_id").eq("id", profile.team_id).single(),
    supabase
      .from("team_members")
      .select("user_id, role, joined_at, users(email, full_name)")
      .eq("team_id", profile.team_id),
  ]);

  return Response.json({ team, members: members ?? [], plan: profile.plan });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("plan, team_id").eq("id", user.id).single();
  if (profile?.plan !== "pro") {
    return Response.json({ error: "Team workspace requires a Pro plan." }, { status: 403 });
  }
  if (profile?.team_id) {
    return Response.json({ error: "You are already in a team." }, { status: 400 });
  }

  const body = await request.json() as { name?: string };
  const name = body.name?.trim();
  if (!name) return Response.json({ error: "Team name is required." }, { status: 400 });

  const { data: team, error } = await supabase
    .from("teams")
    .insert({ name, owner_id: user.id })
    .select("id, name, owner_id")
    .single();

  if (error || !team) return Response.json({ error: "Failed to create team." }, { status: 500 });

  await Promise.all([
    supabase.from("team_members").insert({ team_id: team.id, user_id: user.id, role: "owner" }),
    supabase.from("users").update({ team_id: team.id }).eq("id", user.id),
  ]);

  return Response.json({ team }, { status: 201 });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team } = await supabase.from("teams").select("id").eq("owner_id", user.id).single();
  if (!team) return Response.json({ error: "No team to delete." }, { status: 404 });

  // Clear team_id from all members first, then delete the team
  await supabase.from("users").update({ team_id: null }).eq("team_id", team.id);
  await supabase.from("teams").delete().eq("id", team.id);

  return Response.json({ ok: true });
}
