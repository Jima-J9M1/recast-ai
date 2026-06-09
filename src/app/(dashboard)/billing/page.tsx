import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Calendar, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { polar } from "@/lib/polar";
import { PLAN_LIMITS } from "@/types";
import { ChangePlanButton } from "@/components/ChangePlanButton";
import { CancelPlanButton } from "@/components/CancelPlanButton";

type Plan = "free" | "starter" | "pro";

function PlanBadge({ plan }: Readonly<{ plan: string }>) {
  const cls =
    plan === "pro"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
      : plan === "starter"
      ? "bg-violet-500/15 text-violet-300 border-violet-500/25"
      : "bg-white/5 text-white/40 border-white/10";
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide ${cls}`}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const active = status === "active" || status === "trialing";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
      active ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
    }`}>
      {status.replace("_", " ")}
    </span>
  );
}

function fmt(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabase.from("users").select("plan, polar_subscription_id").eq("id", user.id).single(),
    supabase.from("usage").select("count").eq("user_id", user.id).eq("month", currentMonth).single(),
  ]);

  if (!profile?.polar_subscription_id) redirect("/settings");

  const plan = (profile.plan ?? "free") as Plan;
  const limit = PLAN_LIMITS[plan];
  const usedThisMonth = usage?.count ?? 0;
  const usagePct = limit === null ? 0 : Math.min(100, (usedThisMonth / limit) * 100);

  const [year, month] = currentMonth.split("-").map(Number);
  const nextReset = fmt(new Date(year, month, 1));

  let subscription: Awaited<ReturnType<typeof polar.subscriptions.get>> | null = null;
  let subError = "";
  try {
    subscription = await polar.subscriptions.get({ id: profile.polar_subscription_id });
  } catch (err) {
    subError = err instanceof Error ? err.message : "Could not load subscription details.";
  }

  const periodStart = subscription ? fmt(subscription.currentPeriodStart) : "—";
  const periodEnd = subscription ? fmt(subscription.currentPeriodEnd) : "—";
  const priceStr = subscription
    ? `$${(subscription.amount / 100).toFixed(0)}/${subscription.recurringInterval === "year" ? "yr" : "mo"}`
    : plan === "starter" ? "$19/mo" : plan === "pro" ? "$49/mo" : "";

  return (
    <div className="p-8 max-w-2xl animate-fade-in-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-white/40 mt-1">Manage your subscription and view usage.</p>
      </div>

      {/* Subscription details */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Subscription</h2>
        </div>

        {subError ? (
          <p className="text-sm text-red-400">{subError}</p>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <PlanBadge plan={plan} />
              {subscription && <StatusBadge status={subscription.status} />}
              <span className="text-white/50 text-sm">{priceStr}</span>
            </div>

            {subscription && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                  <p className="text-xs text-white/30 mb-1">Period start</p>
                  <p className="text-sm font-semibold text-white">{periodStart}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                  <p className="text-xs text-white/30 mb-1">
                    {subscription.cancelAtPeriodEnd ? "Cancels on" : "Next charge"}
                  </p>
                  <p className={`text-sm font-semibold ${subscription.cancelAtPeriodEnd ? "text-amber-400" : "text-white"}`}>
                    {periodEnd}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Usage this month */}
      {limit !== null && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-white/40" />
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Usage this month</h2>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/50">Videos processed</span>
              <span className="text-sm font-semibold text-white">
                {usedThisMonth} / {limit}
                <span className="text-white/30 font-normal ml-2">({Math.max(0, limit - usedThisMonth)} left)</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePct >= 90 ? "bg-red-500" : usagePct >= 70 ? "bg-amber-500" : "bg-violet-500"
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="text-xs text-white/25 mt-2">Resets {nextReset}</p>
          </div>
        </div>
      )}

      {/* Manage plan */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Manage plan</h2>
        </div>

        {plan === "starter" && (
          <ChangePlanButton targetPlan="pro" label="Upgrade to Pro — $49/mo" highlight />
        )}
        {plan === "pro" && (
          <ChangePlanButton targetPlan="starter" label="Downgrade to Starter — $19/mo" highlight={false} />
        )}

        {subscription && (
          <CancelPlanButton
            cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
            periodEndDate={periodEnd}
          />
        )}
      </div>

      <div>
        <Link href="/settings" className="text-sm text-white/40 hover:text-white transition-colors">
          ← Back to settings
        </Link>
      </div>
    </div>
  );
}
