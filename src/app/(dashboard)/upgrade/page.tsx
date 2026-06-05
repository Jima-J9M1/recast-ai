import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutUrl, POLAR_PRODUCTS } from "@/lib/polar";

const plans = [
  {
    name: "Starter",
    price: 19,
    key: "starter" as const,
    features: ["10 videos per month", "All 4 content formats", "Content history", "Email support"],
  },
  {
    name: "Pro",
    price: 49,
    key: "pro" as const,
    features: ["Unlimited videos", "All 4 content formats", "Content history", "Priority support"],
    highlight: true,
  },
];

export default async function UpgradePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "pro") {
    redirect("/dashboard");
  }

  let starterUrl = "#";
  let proUrl = "#";

  try {
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`;
    starterUrl = await createCheckoutUrl(
      POLAR_PRODUCTS.starter,
      user.id,
      user.email!,
      successUrl
    );
    proUrl = await createCheckoutUrl(
      POLAR_PRODUCTS.pro,
      user.id,
      user.email!,
      successUrl
    );
  } catch {
    // Polar not configured yet — show plans without checkout links
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Upgrade your plan</h1>
        <p className="text-white/50 mt-1">Unlock more videos and features</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const checkoutUrl = plan.key === "starter" ? starterUrl : proUrl;
          const isCurrent = profile?.plan === plan.key;

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
              {isCurrent ? (
                <div className="w-full py-3 rounded-full text-center text-sm font-semibold border border-white/20 text-white/40 cursor-not-allowed">
                  Current plan
                </div>
              ) : (
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
              )}
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
