import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as svcClient } from "@supabase/supabase-js";

function adminClient() {
  return svcClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("team_id, plan")
    .eq("id", user.id)
    .single();

  if (!profile?.team_id) {
    return Response.json({ team: null, members: [], plan: profile?.plan ?? "free", pending_invites: [] });
  }

  const admin = adminClient();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [{ data: team }, { data: members }, { data: invites }, { data: usageRows }] = await Promise.all([
    admin.from("teams").select("id, name, owner_id").eq("id", profile.team_id).single(),
    admin.from("team_members").select("user_id, role, joined_at, users(email, full_name)").eq("team_id", profile.team_id),
    admin.from("team_invites")
      .select("id, token, created_at, expires_at")
      .eq("team_id", profile.team_id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
    admin.from("usage").select("user_id, count").eq("month", currentMonth),
  ]);

  const memberIds = new Set((members ?? []).map((m: { user_id: string }) => m.user_id));
  const usageMap = Object.fromEntries(
    (usageRows ?? [])
      .filter((u: { user_id: string }) => memberIds.has(u.user_id))
      .map((u: { user_id: string; count: number }) => [u.user_id, u.count])
  );

  const membersWithUsage = (members ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    jobs_this_month: (usageMap[m.user_id as string] ?? 0) as number,
  }));

  return Response.json({
    team,
    members: membersWithUsage,
    plan: profile.plan,
    pending_invites: invites ?? [],
    seat_limit: 10,
  });
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

  const admin = adminClient();
  const { data: team, error } = await admin
    .from("teams")
    .insert({ name, owner_id: user.id })
    .select("id, name, owner_id")
    .single();

  if (error || !team) return Response.json({ error: "Failed to create team." }, { status: 500 });

  await Promise.all([
    admin.from("team_members").insert({ team_id: team.id, user_id: user.id, role: "owner", joined_at: new Date().toISOString() }),
    admin.from("users").update({ team_id: team.id }).eq("id", user.id),
  ]);

  return Response.json({ team }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { name?: string };
  const name = body.name?.trim();
  if (!name) return Response.json({ error: "Team name is required." }, { status: 400 });

  const admin = adminClient();
  const { data: team } = await admin.from("teams").select("id").eq("owner_id", user.id).single();
  if (!team) return Response.json({ error: "Forbidden." }, { status: 403 });

  await admin.from("teams").update({ name }).eq("id", team.id);
  return Response.json({ ok: true, name });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = adminClient();
  const { data: team } = await admin.from("teams").select("id").eq("owner_id", user.id).single();
  if (!team) return Response.json({ error: "No team to delete." }, { status: 404 });

  await admin.from("users").update({ team_id: null }).eq("team_id", team.id);
  await admin.from("team_members").delete().eq("team_id", team.id);
  await admin.from("teams").delete().eq("id", team.id);

  return Response.json({ ok: true });
}
