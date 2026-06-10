import { createClient } from "@supabase/supabase-js";
import type { Plan } from "@/types";

export interface TeamBilling {
  billingUserId: string;
  plan: Plan;
  teamId: string | null;
  isTeamMember: boolean;
}

export async function getTeamBilling(userId: string): Promise<TeamBilling> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: user } = await supabase
    .from("users")
    .select("plan, team_id")
    .eq("id", userId)
    .single();

  if (!user?.team_id) {
    return { billingUserId: userId, plan: (user?.plan ?? "free") as Plan, teamId: null, isTeamMember: false };
  }

  const { data: team } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", user.team_id)
    .single();

  if (!team) {
    return { billingUserId: userId, plan: (user?.plan ?? "free") as Plan, teamId: user.team_id, isTeamMember: true };
  }

  const { data: owner } = await supabase
    .from("users")
    .select("plan")
    .eq("id", team.owner_id)
    .single();

  return {
    billingUserId: team.owner_id,
    plan: (owner?.plan ?? "pro") as Plan,
    teamId: user.team_id,
    isTeamMember: true,
  };
}
