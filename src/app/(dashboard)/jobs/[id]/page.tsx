"use client";

import { use, useEffect, useState, useCallback } from "react";
import { FileText, Hash, Briefcase, Mail, Copy, Check, ArrowLeft, Loader2, Square, Download } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import type { Job, Output } from "@/types";

const TABS = [
  { type: "blog" as const, icon: FileText, label: "Blog Post" },
  { type: "twitter_thread" as const, icon: Hash, label: "Twitter" },
  { type: "linkedin" as const, icon: Briefcase, label: "LinkedIn" },
  { type: "newsletter" as const, icon: Mail, label: "Newsletter" },
];

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

const TONE_LABELS: Record<string, string> = {
  professional: "💼 Professional",
  casual: "☕ Casual",
  storytelling: "📖 Storytelling",
  educational: "🎓 Educational",
  humorous: "😄 Humorous",
};

function getTabClass(active: boolean, has: boolean): string {
  if (active) return "bg-violet-600 text-white shadow-lg shadow-violet-900/40";
  if (has) return "text-white/50 hover:text-white hover:bg-white/5";
  return "text-white/20 cursor-not-allowed";
}

function getStatusBadge(status: string) {
  if (status === "completed") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  if (status === "failed") return "bg-red-500/10 text-red-400 border border-red-500/20";
  if (status === "cancelled") return "bg-white/5 text-white/30 border border-white/10";
  return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
}

function CopyButton({ text }: Readonly<{ text: string }>) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 hover:text-white text-xs transition-all hover:bg-white/5">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function parseTweets(content: string): string[] {
  // Try splitting on blank lines — each tweet block starts with "N/"
  const blocks = content.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const numbered = blocks.filter((b) => /^\d+\//.test(b));
  if (numbered.length >= 2) return numbered;
  // Fallback: split inline on the numbering pattern
  return content.split(/(?=\n\d+\/)/).map((t) => t.trim()).filter(Boolean);
}

function TwitterThreadView({ content }: Readonly<{ content: string }>) {
  const tweets = parseTweets(content);
  if (tweets.length < 2) {
    return (
      <pre className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-sans">
        {content}
      </pre>
    );
  }
  return (
    <div className="space-y-3">
      {tweets.map((tweet, i) => {
        const charCount = tweet.length;
        const over = charCount > 280;
        return (
          <div key={i} className="rounded-xl bg-white/2.5 border border-white/6 p-4">
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{tweet}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className={`text-xs tabular-nums ${over ? "text-red-400" : "text-white/25"}`}>
                {charCount} / 280{over ? " · over limit" : ""}
              </span>
              <CopyButton text={tweet} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DownloadButton({ text, filename }: Readonly<{ text: string; filename: string }>) {
  function download() {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button onClick={download} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 hover:text-white text-xs transition-all hover:bg-white/5">
      <Download className="w-3.5 h-3.5" /> Export
    </button>
  );
}

export default function JobPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [activeTab, setActiveTab] = useState<Output["type"]>("blog");
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);

  const loadOutputs = useCallback(async (jobId: string) => {
    const supabase = createClient();
    const { data } = await supabase.from("outputs").select("*").eq("job_id", jobId);
    setOutputs(data ?? []);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const { data } = await supabase.from("jobs").select("*").eq("id", id).single();
      if (data) {
        setJob(data);
        if (data.status === "completed") await loadOutputs(id);
      }
      setLoading(false);
    }

    init();

    const interval = setInterval(async () => {
      const { data } = await supabase.from("jobs").select("*").eq("id", id).single();
      if (!data) return;
      setJob(data);
      if (data.status === "completed") {
        await loadOutputs(id);
        clearInterval(interval);
      } else if (TERMINAL_STATUSES.has(data.status)) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, loadOutputs]);

  async function handleStop() {
    setStopping(true);
    await fetch(`/api/jobs/${id}/cancel`, { method: "POST" });
    setStopping(false);
  }

  const activeOutput = outputs.find((o) => o.type === activeTab);
  const wordCount = activeOutput ? activeOutput.content.split(/\s+/).filter(Boolean).length : 0;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return <div className="p-8 text-white/40">Job not found.</div>;
  }

  const isProcessing = !TERMINAL_STATUSES.has(job.status);

  return (
    <div className="p-8 max-w-4xl animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start gap-3 mb-8">
        <Link href="/dashboard" className="flex items-center gap-1 text-white/30 hover:text-white transition-colors text-sm mt-0.5 shrink-0">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-white truncate">
            {job.title ?? job.source_url ?? "Untitled"}
          </h1>
          {job.source_url && (
            <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-white/30 hover:text-violet-400 transition-colors truncate block mt-0.5">
              {job.source_url}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {job.tone && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/8">
              {TONE_LABELS[job.tone] ?? job.tone}
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusBadge(job.status)}`}>
            {job.status}
          </span>
        </div>
      </div>

      {/* Processing */}
      {isProcessing && (
        <div className="glass rounded-2xl p-12 text-center mb-6">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-violet-900/30 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            </div>
          </div>
          <p className="text-white font-semibold text-lg mb-1">
            {job.status === "transcribing" ? "Fetching transcript…" : "Generating content…"}
          </p>
          <p className="text-white/30 text-sm mb-6">
            {job.status === "transcribing" ? "Reading the video captions" : "Writing your blog, thread, LinkedIn post & newsletter"}
          </p>
          <button
            onClick={handleStop}
            disabled={stopping}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-white/40 hover:text-red-400 text-sm transition-all disabled:opacity-40"
          >
            <Square className="w-3.5 h-3.5" />
            {stopping ? "Stopping…" : "Stop job"}
          </button>
        </div>
      )}

      {/* Failed */}
      {job.status === "failed" && (
        <div className="glass rounded-2xl p-8 border border-red-500/15 mb-6">
          <p className="text-red-300 font-semibold mb-2">Processing failed</p>
          {job.error_message && (
            <p className="text-red-400/60 text-xs font-mono bg-red-500/5 rounded-lg px-3 py-2 mb-3 break-all">
              {job.error_message}
            </p>
          )}
          <p className="text-white/40 text-sm mb-4">This can happen if the video has no captions or is age-restricted.</p>
          <Link href="/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 text-white text-sm hover:bg-white/12 transition-colors">
            Try another video
          </Link>
        </div>
      )}

      {/* Cancelled */}
      {job.status === "cancelled" && (
        <div className="glass rounded-2xl p-8 border border-white/8 mb-6">
          <p className="text-white/50 font-semibold mb-1">Job cancelled</p>
          <p className="text-white/25 text-sm mb-4">Processing was stopped before it completed.</p>
          <Link href="/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 text-white text-sm hover:bg-white/12 transition-colors">
            Start a new job
          </Link>
        </div>
      )}

      {/* Completed outputs */}
      {job.status === "completed" && outputs.length > 0 && (
        <div>
          {/* Tabs */}
          <div className="flex gap-1.5 mb-5 p-1 glass rounded-xl w-fit">
            {TABS.map((tab) => {
              const has = outputs.some((o) => o.type === tab.type);
              const active = activeTab === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  disabled={!has}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${getTabClass(active, has)}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content card */}
          {activeOutput && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/5">
                <span className="text-xs text-white/30">{wordCount.toLocaleString()} words</span>
                <div className="flex items-center gap-2">
                  <CopyButton text={activeOutput.content} />
                  <DownloadButton
                    text={activeOutput.content}
                    filename={`${activeTab}-${id.slice(0, 8)}.md`}
                  />
                </div>
              </div>
              <div className="p-7 overflow-auto max-h-[65vh]">
                {activeTab === "twitter_thread" ? (
                  <TwitterThreadView content={activeOutput.content} />
                ) : (
                  <div className="prose-dark">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeOutput.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
