import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar, POLAR_PRODUCTS } from "@/lib/polar";

const VALID_PLANS = new Set(["starter", "pro"] as const);
type TargetPlan = "starter" | "pro";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { plan?: string };
  const targetPlan = body.plan as TargetPlan;

  if (!VALID_PLANS.has(targetPlan)) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plan, polar_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.polar_subscription_id) {
    return Response.json({ error: "No active subscription found" }, { status: 400 });
  }

  if (profile.plan === targetPlan) {
    return Response.json({ error: "Already on this plan" }, { status: 400 });
  }

  try {
    await polar.subscriptions.update({
      id: profile.polar_subscription_id,
      subscriptionUpdate: { productId: POLAR_PRODUCTS[targetPlan] },
    });
    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[change-plan] Polar subscriptions.update failed:", message);
    return Response.json({ error: `Could not change plan: ${message}` }, { status: 500 });
  }
}
