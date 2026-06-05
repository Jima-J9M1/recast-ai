import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, status, created_at, source_url, source_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-white/50 mt-1">All your processed content</p>
      </div>

      {jobs && jobs.length > 0 ? (
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
                <p className="text-xs text-white/40 mt-0.5">
                  {new Date(job.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full shrink-0 ${
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
      ) : (
        <div className="text-center py-20 text-white/30">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No history yet. Create your first content!</p>
          <Link
            href="/new"
            className="inline-block mt-4 px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition-colors"
          >
            Create content
          </Link>
        </div>
      )}
    </div>
  );
}
