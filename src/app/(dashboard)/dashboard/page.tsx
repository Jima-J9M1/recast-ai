import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Zap, FileText, Clock, TrendingUp, ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/types";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getUsageBarColor(pct: number): string {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-violet-500";
}

function JobStatusIcon({ status }: Readonly<{ status: string }>) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "failed" || status === "cancelled") return <XCircle className="w-4 h-4 text-red-400" />;
  return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [{ data: profile }, { data: jobs }, { data: usage }] = await Promise.all([
    supabase.from("users").select("plan, full_name").eq("id", user.id).single(),
    supabase
      .from("jobs")
      .select("id, title, status, created_at, source_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .single(),
  ]);

  const plan = (profile?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const usedThisMonth = usage?.count ?? 0;
  const limit = PLAN_LIMITS[plan];
  const remaining = limit === null ? null : Math.max(0, limit - usedThisMonth);
  const usagePct = limit === null ? 0 : Math.min(100, (usedThisMonth / limit) * 100);
  const usageBarColor = getUsageBarColor(usagePct);
  const totalJobs = jobs?.length ?? 0;
  const completedJobs = jobs?.filter(j => j.status === "completed").length ?? 0;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const greeting = getGreeting(new Date().getHours());

  return (
    <div className="p-8 max-w-5xl animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-white/40 text-sm mb-1">{greeting}</p>
          <h1 className="text-2xl font-bold text-white">{firstName} 👋</h1>
        </div>
        <Link
          href="/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-all shadow-lg shadow-violet-900/30"
        >
          <PlusCircle className="w-4 h-4" />
          New content
        </Link>
      </div>

      {/* Onboarding checklist — only for new free users */}
      <OnboardingChecklist completedJobs={completedJobs} plan={plan} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/40 uppercase tracking-wider">Used</span>
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-3xl font-black text-white">{usedThisMonth}</p>
          <p className="text-xs text-white/30 mt-1">this month</p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/40 uppercase tracking-wider">Remaining</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{remaining ?? "∞"}</p>
          <p className="text-xs text-white/30 mt-1">{plan} plan</p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/40 uppercase tracking-wider">Completed</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white">{completedJobs}</p>
          <p className="text-xs text-white/30 mt-1">of {totalJobs} jobs</p>
        </div>
      </div>

      {/* 1 credit remaining — high-urgency banner */}
      {remaining === 1 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-amber-300 text-sm font-semibold">1 video left this month</p>
              <p className="text-amber-300/60 text-xs mt-0.5 truncate">
                Upgrade to Starter — 10 videos/month for $19
              </p>
            </div>
          </div>
          <Link
            href="/upgrade"
            className="shrink-0 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-semibold transition-all"
          >
            Upgrade →
          </Link>
        </div>
      )}

      {/* Usage bar */}
      {limit !== null && (
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/60">Monthly usage</span>
            <span className="text-sm font-semibold text-white">{usedThisMonth} / {limit}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${usageBarColor}`} style={{ width: `${usagePct}%` }} />
          </div>
          {usagePct >= 90 && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-amber-400">Running low on credits</p>
              <Link href="/upgrade" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Upgrade
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Limit hit */}
      {limit !== null && usedThisMonth >= limit && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <p className="text-amber-300 text-sm">You&apos;ve used all {limit} videos this month.</p>
          <Link href="/upgrade" className="text-sm font-semibold text-amber-300 underline">Upgrade →</Link>
        </div>
      )}

      {/* Recent jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Recent jobs</h2>
          {jobs && jobs.length > 0 && (
            <Link href="/history" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="space-y-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center gap-4 p-4 glass rounded-xl hover:bg-white/4 transition-all group"
              >
                <div className="shrink-0"><JobStatusIcon status={job.status} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
                    {job.title ?? job.source_url ?? "Untitled"}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center border border-dashed border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-white/50 font-medium mb-1">No content yet</p>
            <p className="text-white/30 text-sm mb-6">Paste a YouTube URL and watch the magic happen.</p>
            <Link
              href="/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Create your first content
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
