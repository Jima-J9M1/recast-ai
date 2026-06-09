import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar } from "@/lib/polar";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { resume?: boolean };
  const cancelAtPeriodEnd = !body.resume;

  const { data: profile } = await supabase
    .from("users")
    .select("polar_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.polar_subscription_id) {
    return Response.json({ error: "No active subscription found" }, { status: 400 });
  }

  try {
    await polar.subscriptions.update({
      id: profile.polar_subscription_id,
      subscriptionUpdate: { cancelAtPeriodEnd },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cancel-plan] Polar subscriptions.update failed:", message);
    return Response.json({ error: `Could not update subscription: ${message}` }, { status: 500 });
  }

  return Response.json({ success: true, cancelAtPeriodEnd });
}
