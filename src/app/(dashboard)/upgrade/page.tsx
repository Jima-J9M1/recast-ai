import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Zap, ArrowRight, Rss, Users, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutUrl, POLAR_PRODUCTS } from "@/lib/polar";

const plans = [
  {
    name: "Starter",
    price: 19,
    key: "starter" as const,
    description: "For creators who publish consistently",
    highlight: false,
    features: [
      "25 videos per month",
      "All 4 content formats",
      "Audio upload up to 25 MB",
      "Brand voice + custom prompts",
      "Content history & versioning",
      "3 RSS auto-import feeds",
      "Batch process 10 URLs",
      "SEO mode",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: 49,
    key: "pro" as const,
    description: "For teams and power users",
    highlight: true,
    features: [
      "Unlimited videos",
      "All 4 content formats",
      "Audio upload up to 25 MB",
      "Brand voice + custom prompts",
      "Content history & versioning",
      "10 RSS auto-import feeds",
      "Batch process 50 URLs",
      "SEO mode",
      "Team workspace (up to 10 members)",
      "Webhooks & API access",
      "Priority support",
    ],
  },
];

const highlights = [
  { icon: Rss,    label: "Auto-import channels", desc: "New videos processed hands-free" },
  { icon: Layers, label: "Batch processing",      desc: "Up to 50 URLs at once on Pro" },
  { icon: Users,  label: "Team workspace",        desc: "Shared credits, role-based access" },
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

  if (profile?.polar_subscription_id) redirect("/billing");
  if (profile?.plan === "pro") redirect("/billing");

  let starterUrl = "#";
  let proUrl = "#";
  try {
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?plan_updated=true`;
    [starterUrl, proUrl] = await Promise.all([
      createCheckoutUrl(POLAR_PRODUCTS.starter, user.id, user.email!, successUrl),
      createCheckoutUrl(POLAR_PRODUCTS.pro, user.id, user.email!, successUrl),
    ]);
  } catch {
    // Polar not configured
  }

  const checkoutUrls = { starter: starterUrl, pro: proUrl };

  return (
    <div className="p-8 max-w-3xl animate-fade-in-up">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-2">Upgrade</p>
        <h1 className="text-3xl font-bold text-white mb-3">More output, less effort</h1>
        <p className="text-white/50 max-w-lg">
          You&apos;re on the free plan — 3 videos/month. Upgrade to unlock more videos, auto-import feeds, and team features.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {highlights.map((h) => (
          <div key={h.label} className="glass rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-amber-900/40 flex items-center justify-center mb-3">
              <h.icon className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-white mb-0.5">{h.label}</p>
            <p className="text-xs text-white/40">{h.desc}</p>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-7 flex flex-col ${
              plan.highlight
                ? "bg-amber-600/10 border border-amber-500/30"
                : "glass"
            }`}
          >
            {plan.highlight && (
              <span className="text-xs text-amber-400 font-semibold mb-3 uppercase tracking-widest">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
            <p className="text-white/40 text-sm mt-0.5 mb-5">{plan.description}</p>
            <div className="mb-7">
              <span className="text-5xl font-black text-white">${plan.price}</span>
              <span className="text-white/40 text-sm">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                  <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-amber-400" : "text-emerald-400"}`} />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={checkoutUrls[plan.key]}
              className={`w-full py-3.5 rounded-xl text-center text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                plan.highlight
                  ? "bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-900/30"
                  : "border border-white/15 text-white hover:bg-white/5"
              }`}
            >
              <Zap className="w-4 h-4" />
              Get {plan.name} — ${plan.price}/mo
            </a>
          </div>
        ))}
      </div>

      {/* Reassurance */}
      <div className="glass rounded-2xl p-5 flex items-center gap-4 mb-6">
        <div className="flex-1">
          <p className="text-sm text-white/60">
            <span className="text-white font-medium">Cancel anytime.</span> No contracts, no lock-in. Downgrade or cancel from your billing page in one click.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 shrink-0" />
      </div>

      <div className="text-center">
        <Link href="/dashboard" className="text-sm text-white/30 hover:text-white/60 transition-colors">
          ← Stay on free plan
        </Link>
      </div>
    </div>
  );
}
