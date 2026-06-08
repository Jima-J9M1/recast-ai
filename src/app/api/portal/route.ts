import { createClient } from "@/lib/supabase/server";
import { polar } from "@/lib/polar";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("polar_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.polar_customer_id) {
    return Response.json({ error: "No active subscription found" }, { status: 400 });
  }

  try {
    const session = await polar.customerSessions.create({
      customerId: profile.polar_customer_id,
    });
    if (!session.customerPortalUrl) {
      return Response.json({ error: "Billing portal URL not returned by Polar" }, { status: 500 });
    }
    return Response.json({ url: session.customerPortalUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[portal] Polar customerSessions.create failed:", message);
    return Response.json({ error: `Billing portal error: ${message}` }, { status: 500 });
  }
}
