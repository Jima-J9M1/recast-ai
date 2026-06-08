import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutUrl, POLAR_PRODUCTS } from "@/lib/polar";
import { ChangePlanButton } from "@/components/ChangePlanButton";

const plans = [
  {
    name: "Starter",
    price: 19,
    key: "starter" as const,
    features: [
      "10 videos per month",
      "All 5 content formats",
      "Custom prompts",
      "Version history",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: 49,
    key: "pro" as const,
    features: [
      "Unlimited videos",
      "All 5 content formats",
      "Custom prompts",
      "Version history",
      "RSS auto-import (5 channels)",
      "Batch processing (20 URLs)",
      "Priority support",
    ],
    highlight: true,
  },
];

export default async function UpgradePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("plan, polar_subscription_id")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "pro") redirect("/dashboard");

  const currentPlan = profile?.plan ?? "free";
  const hasActiveSub = !!profile?.polar_subscription_id;

  let starterUrl = "#";
  let proUrl = "#";

  if (!hasActiveSub) {
    try {
      const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?plan_updated=true`;
      [starterUrl, proUrl] = await Promise.all([
        createCheckoutUrl(POLAR_PRODUCTS.starter, user.id, user.email!, successUrl),
        createCheckoutUrl(POLAR_PRODUCTS.pro, user.id, user.email!, successUrl),
      ]);
    } catch {
      // Polar not configured — show plans without checkout links
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Upgrade your plan</h1>
        <p className="text-white/50 mt-1">Unlock more videos and premium features</p>
      </div>

      {hasActiveSub && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm text-violet-300">
          You have an active subscription. Clicking &ldquo;Upgrade&rdquo; will switch your plan immediately — no new checkout needed.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const checkoutUrl = plan.key === "starter" ? starterUrl : proUrl;

          return (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 flex flex-col ${
                plan.highlight
                  ? "bg-purple-600/20 border border-purple-500/40"
                  : "glass"
              }`}
            >
              {plan.highlight && (
                <span className="text-xs text-purple-300 font-semibold mb-3 uppercase tracking-widest">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="my-4">
                <span className="text-4xl font-black text-white">${plan.price}</span>
                <span className="text-white/40">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {(() => {
                if (isCurrent) {
                  return (
                    <div className="w-full py-3 rounded-full text-center text-sm font-semibold border border-white/20 text-white/40 cursor-not-allowed">
                      Current plan
                    </div>
                  );
                }
                if (hasActiveSub) {
                  return (
                    <ChangePlanButton
                      targetPlan={plan.key}
                      label={`Upgrade to ${plan.name}`}
                      highlight={plan.highlight}
                    />
                  );
                }
                return (
                  <a
                    href={checkoutUrl}
                    className={`w-full py-3 rounded-full text-center text-sm font-semibold transition-all block ${
                      plan.highlight
                        ? "bg-purple-600 text-white hover:bg-purple-500"
                        : "border border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    <Zap className="w-4 h-4 inline mr-1" />
                    Upgrade to {plan.name}
                  </a>
                );
              })()}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-sm text-white/40 hover:text-white transition-colors">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
