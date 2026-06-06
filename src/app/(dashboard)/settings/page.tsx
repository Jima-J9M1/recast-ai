import { redirect } from "next/navigation";
import Link from "next/link";
import { TrendingUp, FileText, Hash, Briefcase, Mail, CheckCircle2, XCircle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, PLAN_PRICES } from "@/types";
import { ProfileForm } from "@/components/ProfileForm";
import { ManageSubscriptionButton } from "@/components/ManageSubscriptionButton";

interface UserStats {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  blog_count: number;
  twitter_count: number;
  linkedin_count: number;
  newsletter_count: number;
}

function PlanBadge({ plan }: Readonly<{ plan: string }>) {
  const cls =
    plan === "pro" ? "bg-amber-500/15 text-amber-400 border-amber-500/25" :
    plan === "starter" ? "bg-violet-500/15 text-violet-300 border-violet-500/25" :
    "bg-white/5 text-white/40 border-white/10";
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide ${cls}`}>
      {plan}
    </span>
  );
}

function StatCard({ label, value, sub }: Readonly<{ label: string; value: number | string; sub?: string }>) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [{ data: profile }, { data: usage }, { data: statsRaw }, { data: monthJobs }] = await Promise.all([
    supabase.from("users").select("plan, full_name, email, polar_customer_id").eq("id", user.id).single(),
    supabase.from("usage").select("count").eq("user_id", user.id).eq("month", currentMonth).single(),
    supabase.rpc("get_user_stats", { p_user_id: user.id }),
    supabase.from("jobs").select("status").eq("user_id", user.id).eq("created_at", currentMonth),
  ]);

  const plan = (profile?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan];
  const usedThisMonth = usage?.count ?? 0;
  const remaining = limit === null ? null : Math.max(0, limit - usedThisMonth);
  const usagePct = limit === null ? 0 : Math.min(100, (usedThisMonth / limit) * 100);
  const hasPolarSub = !!profile?.polar_customer_id;

  // Next reset date: 1st of next month
  const [year, month] = currentMonth.split("-").map(Number);
  const nextReset = new Date(year, month, 1); // JS month is 0-indexed, so +1 handled automatically
  const nextResetStr = nextReset.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const stats = statsRaw as unknown as UserStats | null;

  // This month completed/failed from jobs table
  const thisMonthJobs = monthJobs ?? [];
  const thisMonthCompleted = thisMonthJobs.filter((j) => j.status === "completed").length;
  const thisMonthFailed = thisMonthJobs.filter((j) => j.status === "failed").length;

  const outputFormats = [
    { label: "Blog", icon: FileText, count: stats?.blog_count ?? 0 },
    { label: "Twitter", icon: Hash, count: stats?.twitter_count ?? 0 },
    { label: "LinkedIn", icon: Briefcase, count: stats?.linkedin_count ?? 0 },
    { label: "Newsletter", icon: Mail, count: stats?.newsletter_count ?? 0 },
  ];

  return (
    <div className="p-8 max-w-2xl animate-fade-in-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 mt-1">Manage your profile, plan, and usage.</p>
      </div>

      {/* Section 1 — Profile */}
      <ProfileForm
        initialName={profile?.full_name ?? ""}
        email={profile?.email ?? user.email ?? ""}
      />

      {/* Section 2 — Plan & Billing */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-5">Plan & Billing</h2>

        <div className="flex items-center gap-3 mb-5">
          <PlanBadge plan={plan} />
          <span className="text-white/40 text-sm">
            {plan === "pro"
              ? `$${PLAN_PRICES.pro.monthly}/mo — unlimited videos`
              : plan === "starter"
              ? `$${PLAN_PRICES.starter.monthly}/mo — ${PLAN_LIMITS.starter} videos/month`
              : "Free — 1 video/month"}
          </span>
        </div>

        {/* Usage bar */}
        {limit !== null && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/50">Monthly usage</span>
              <span className="text-sm font-semibold text-white">
                {usedThisMonth} / {limit}
                {remaining !== null && (
                  <span className="text-white/30 font-normal ml-2">({remaining} remaining)</span>
                )}
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
            <p className="text-xs text-white/25 mt-2">Resets {nextResetStr}</p>
          </div>
        )}

        {plan === "free" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/40">
              Upgrade to Starter for 10 videos/month, or Pro for unlimited.
            </p>
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/30 w-fit"
            >
              <TrendingUp className="w-4 h-4" /> View upgrade options
            </Link>
          </div>
        )}

        {plan === "starter" && !hasPolarSub && (
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/30 w-fit"
          >
            <Zap className="w-4 h-4" /> Upgrade to Pro
          </Link>
        )}

        {hasPolarSub && <ManageSubscriptionButton />}
      </div>

      {/* Section 3 — Usage Stats */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-5">Usage Stats</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* This month */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">This month</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-sm">
                <Zap className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="text-white/60">Processed</span>
                <span className="ml-auto font-semibold text-white">{usedThisMonth}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-white/60">Completed</span>
                <span className="ml-auto font-semibold text-white">{thisMonthCompleted}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-white/60">Failed</span>
                <span className="ml-auto font-semibold text-white">{thisMonthFailed}</span>
              </div>
            </div>
          </div>

          {/* All time */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">All time</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-sm">
                <Zap className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="text-white/60">Total jobs</span>
                <span className="ml-auto font-semibold text-white">{stats?.total_jobs ?? 0}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-white/60">Completed</span>
                <span className="ml-auto font-semibold text-white">{stats?.completed_jobs ?? 0}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-white/60">Failed</span>
                <span className="ml-auto font-semibold text-white">{stats?.failed_jobs ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Outputs by format */}
        <div>
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Outputs generated (all time)</p>
          <div className="grid grid-cols-4 gap-3">
            {outputFormats.map((f) => (
              <StatCard key={f.label} label={f.label} value={f.count} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
