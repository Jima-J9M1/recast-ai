import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Zap, FileText, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/types";

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
      .limit(5),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .single(),
  ]);

  const plan = profile?.plan ?? "free";
  const usedThisMonth = usage?.count ?? 0;
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  const remaining = limit === null ? "∞" : Math.max(0, limit - usedThisMonth);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-white/50 mt-1">Ready to repurpose some content?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <Zap className="w-4 h-4" />
            Used this month
          </div>
          <p className="text-3xl font-bold text-white">{usedThisMonth}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <FileText className="w-4 h-4" />
            Remaining
          </div>
          <p className="text-3xl font-bold text-white">{remaining}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <Clock className="w-4 h-4" />
            Total jobs
          </div>
          <p className="text-3xl font-bold text-white">{jobs?.length ?? 0}</p>
        </div>
      </div>

      {/* Usage warning */}
      {limit !== null && usedThisMonth >= limit && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-yellow-300 text-sm">
            You&apos;ve used all your {limit} free videos this month.{" "}
            <Link href="/upgrade" className="underline font-semibold">
              Upgrade to continue
            </Link>
          </p>
        </div>
      )}

      {/* CTA */}
      <Link
        href="/new"
        className="flex items-center gap-3 p-5 glass rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all mb-8 group"
      >
        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
          <PlusCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-white">Create new content</p>
          <p className="text-sm text-white/50">Paste a YouTube URL to get started</p>
        </div>
      </Link>

      {/* Recent jobs */}
      {jobs && jobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent</h2>
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center gap-4 p-4 glass rounded-xl hover:bg-white/5 transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    job.status === "completed"
                      ? "bg-green-400"
                      : job.status === "failed"
                      ? "bg-red-400"
                      : "bg-yellow-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {job.title ?? job.source_url ?? "Untitled"}
                  </p>
                  <p className="text-xs text-white/40">
                    {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    job.status === "completed"
                      ? "bg-green-500/10 text-green-400"
                      : job.status === "failed"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {job.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(!jobs || jobs.length === 0) && (
        <div className="text-center py-16 text-white/30">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No content yet. Create your first one above!</p>
        </div>
      )}
    </div>
  );
}
