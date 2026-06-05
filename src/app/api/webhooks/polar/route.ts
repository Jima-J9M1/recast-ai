import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

// Use service-role client — webhook runs outside user session
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function planFromProductId(productId: string): "starter" | "pro" | null {
  if (productId === process.env.POLAR_STARTER_PRODUCT_ID) return "starter";
  if (productId === process.env.POLAR_PRO_PRODUCT_ID) return "pro";
  return null;
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onSubscriptionActive: async (payload) => {
    const userId = payload.data.metadata?.userId as string | undefined;
    const productId = payload.data.productId;
    const plan = planFromProductId(productId);

    if (!userId || !plan) return;

    await supabaseAdmin
      .from("users")
      .update({
        plan,
        polar_customer_id: payload.data.customerId,
        polar_subscription_id: payload.data.id,
      })
      .eq("id", userId);
  },

  onSubscriptionCanceled: async (payload) => {
    const subId = payload.data.id;
    await supabaseAdmin
      .from("users")
      .update({ plan: "free", polar_subscription_id: null })
      .eq("polar_subscription_id", subId);
  },

  onSubscriptionRevoked: async (payload) => {
    const subId = payload.data.id;
    await supabaseAdmin
      .from("users")
      .update({ plan: "free", polar_subscription_id: null })
      .eq("polar_subscription_id", subId);
  },

  onSubscriptionUpdated: async (payload) => {
    const productId = payload.data.productId;
    const plan = planFromProductId(productId);
    const subId = payload.data.id;

    if (!plan) return;

    await supabaseAdmin
      .from("users")
      .update({ plan })
      .eq("polar_subscription_id", subId);
  },
});
