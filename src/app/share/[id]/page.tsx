import { notFound } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { FileText, Hash, Briefcase, Mail, Zap } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

const TABS = [
  { type: "blog",           icon: FileText,  label: "Blog Post"    },
  { type: "twitter_thread", icon: Hash,      label: "Twitter"      },
  { type: "linkedin",       icon: Briefcase, label: "LinkedIn"     },
  { type: "newsletter",     icon: Mail,      label: "Newsletter"   },
] as const;

interface Output { type: string; content: string; version: number }

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = getServiceClient();
  const { data: job } = await supabase.from("jobs").select("title").eq("id", id).single();
  return {
    title: job?.title ? `${job.title} — RecastAI` : "Shared content — RecastAI",
    description: "Content generated from a YouTube video using RecastAI",
  };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServiceClient();

  const [{ data: job }, { data: rawOutputs }] = await Promise.all([
    supabase.from("jobs").select("id, title, source_url, status").eq("id", id).single(),
    supabase.from("outputs").select("type, content, version").eq("job_id", id).in("type", ["blog", "twitter_thread", "linkedin", "newsletter"]),
  ]);

  if (!job || job.status !== "completed") notFound();

  // Keep only latest version per type
  const outputs: Record<string, string> = {};
  const sorted = (rawOutputs ?? []).sort((a: Output, b: Output) => b.version - a.version);
  for (const o of sorted as Output[]) {
    if (!outputs[o.type]) outputs[o.type] = o.content;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/40">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">RecastAI</span>
        </Link>
        <Link
          href="/signup"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 transition-all shadow-lg shadow-amber-900/30"
        >
          Create yours free →
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-2">Shared content</p>
          <h1 className="text-2xl font-bold text-white mb-2">{job.title ?? "Generated content"}</h1>
          {job.source_url && (
            <a
              href={job.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/30 hover:text-white/60 transition-colors truncate block max-w-md"
            >
              {job.source_url}
            </a>
          )}
        </div>

        {/* Content tabs */}
        <div className="space-y-6">
          {TABS.map(({ type, icon: Icon, label }) => {
            const content = outputs[type];
            if (!content) return null;
            return (
              <div key={type} className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
                  <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm font-semibold text-white/70">{label}</span>
                </div>
                <div className="p-6 prose-dark">
                  <pre className="whitespace-pre-wrap text-sm text-white/75 leading-relaxed font-sans">{content}</pre>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 glass rounded-2xl p-8 text-center">
          <p className="text-lg font-bold text-white mb-2">Turn your videos into content like this</p>
          <p className="text-white/40 text-sm mb-6">Paste a YouTube URL and get a blog post, Twitter thread, LinkedIn post, and newsletter in 30 seconds.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 transition-all shadow-lg shadow-amber-900/30"
          >
            <Zap className="w-4 h-4" /> Start free — no credit card
          </Link>
        </div>
      </main>
    </div>
  );
}
