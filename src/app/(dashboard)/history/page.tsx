import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, CheckCircle2, XCircle, Loader2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Suspense } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { HistoryFilters } from "@/components/HistoryFilters";

const PAGE_SIZE = 20;

const TONE_LABELS: Record<string, string> = {
  professional: "💼", casual: "☕", storytelling: "📖", educational: "🎓", humorous: "😄",
};

function statusBadgeClass(status: string): string {
  if (status === "completed") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (status === "failed" || status === "cancelled") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}

function StatusIcon({ status }: Readonly<{ status: string }>) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (status === "failed" || status === "cancelled") return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  return <Loader2 className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />;
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusBadgeClass(status)}`}>{status}</span>
  );
}

interface SearchParams {
  q?: string;
  status?: string;
  tone?: string;
  language?: string;
  page?: string;
}

interface Filters {
  q: string;
  statusFilter: string;
  toneFilter: string;
  languageFilter: string;
}

function pageUrl(p: number, filters: Filters): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.statusFilter) sp.set("status", filters.statusFilter);
  if (filters.toneFilter) sp.set("tone", filters.toneFilter);
  if (filters.languageFilter) sp.set("language", filters.languageFilter);
  sp.set("page", String(p));
  return `/history?${sp.toString()}`;
}

async function fetchJobs(supabase: SupabaseClient, userId: string, filters: Filters, page: number) {
  const { q, statusFilter, toneFilter, languageFilter } = filters;
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("jobs")
    .select("id, title, status, tone, language, created_at, source_url, source_type", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (q) query = query.or(`title.ilike.%${q}%,source_url.ilike.%${q}%`);
  if (toneFilter) query = query.eq("tone", toneFilter);
  if (languageFilter) query = query.eq("language", languageFilter);

  if (statusFilter === "transcribing,generating") {
    query = query.in("status", ["transcribing", "generating", "pending"]);
  } else if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const result = await query;
  return { data: result.data, count: result.count };
}

interface JobRow {
  id: string;
  title: string | null;
  status: string;
  tone: string;
  language: string;
  created_at: string;
  source_url: string | null;
  source_type: string;
}

export default async function HistoryPage({ searchParams }: Readonly<{ searchParams: Promise<SearchParams> }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const filters: Filters = {
    q: params.q?.trim() ?? "",
    statusFilter: params.status ?? "",
    toneFilter: params.tone ?? "",
    languageFilter: params.language ?? "",
  };
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));

  const { data: jobs, count } = await fetchJobs(supabase, user.id, filters, page);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const hasFilters = filters.q || filters.statusFilter || filters.toneFilter || filters.languageFilter;
  const jobCount = count ?? 0;
  const plural = jobCount === 1 ? "" : "s";

  return (
    <div className="p-8 max-w-4xl animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">History</h1>
          <p className="text-white/40 mt-1">
            {jobCount} job{plural} total{hasFilters ? " matching filters" : ""}
          </p>
        </div>
        <Link
          href="/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-all shadow-lg shadow-violet-900/30"
        >
          <PlusCircle className="w-4 h-4" /> New content
        </Link>
      </div>

      <Suspense fallback={<div className="h-24 glass rounded-xl animate-pulse mb-6" />}>
        <HistoryFilters />
      </Suspense>

      {jobs && jobs.length > 0 ? (
        <JobList jobs={jobs} page={page} totalPages={totalPages} count={count} filters={filters} />
      ) : (
        <EmptyState hasFilters={Boolean(hasFilters)} />
      )}
    </div>
  );
}

function JobList({ jobs, page, totalPages, count, filters }: Readonly<{
  jobs: JobRow[];
  page: number;
  totalPages: number;
  count: number | null;
  filters: Filters;
}>) {
  return (
    <>
      <div className="space-y-2">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="flex items-center gap-4 p-4 glass rounded-xl hover:bg-white/4 transition-all group"
          >
            <StatusIcon status={job.status} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
                {job.title ?? job.source_url ?? "Untitled"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-white/20 shrink-0" />
                <p className="text-xs text-white/30">
                  {new Date(job.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                {job.source_url && (
                  <p className="text-xs text-white/20 truncate max-w-[200px]">{job.source_url}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {job.tone && TONE_LABELS[job.tone] && (
                <span className="text-sm" title={job.tone}>{TONE_LABELS[job.tone]}</span>
              )}
              {job.language === "English" ? null : (
                <span className="text-xs text-white/30">{job.language}</span>
              )}
              <StatusBadge status={job.status} />
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
          <Link
            href={pageUrl(page - 1, filters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${
              page <= 1 ? "text-white/20 pointer-events-none" : "glass text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Link>
          <p className="text-xs text-white/30">Page {page} of {totalPages} · {count} results</p>
          <Link
            href={pageUrl(page + 1, filters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${
              page >= totalPages ? "text-white/20 pointer-events-none" : "glass text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </>
  );
}

function EmptyState({ hasFilters }: Readonly<{ hasFilters: boolean }>) {
  return (
    <div className="glass rounded-2xl p-16 text-center border border-dashed border-white/10">
      <p className="text-white/40 font-medium mb-1">
        {hasFilters ? "No jobs match your filters" : "No content yet"}
      </p>
      <p className="text-white/25 text-sm mb-6">
        {hasFilters ? "Try adjusting your search or filters." : "Paste a YouTube URL and watch the magic happen."}
      </p>
      {hasFilters ? null : (
        <Link href="/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-all">
          <PlusCircle className="w-4 h-4" /> Create your first content
        </Link>
      )}
    </div>
  );
}
