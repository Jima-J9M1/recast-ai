"use client";

import { use, useEffect, useState } from "react";
import { FileText, Twitter, Linkedin, Mail, Copy, Check, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Job, Output } from "@/types";

const OUTPUT_TABS = [
  { type: "blog" as const, icon: FileText, label: "Blog Post" },
  { type: "twitter_thread" as const, icon: Twitter, label: "Twitter Thread" },
  { type: "linkedin" as const, icon: Linkedin, label: "LinkedIn" },
  { type: "newsletter" as const, icon: Mail, label: "Newsletter" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [activeTab, setActiveTab] = useState<Output["type"]>("blog");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (jobData) {
        setJob(jobData);

        if (jobData.status === "completed") {
          const { data: outputData } = await supabase
            .from("outputs")
            .select("*")
            .eq("job_id", id);
          setOutputs(outputData ?? []);
        }
      }
      setLoading(false);
    }

    load();

    // Poll if job is still processing
    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (jobData) {
        setJob(jobData);
        if (jobData.status === "completed") {
          const { data: outputData } = await supabase
            .from("outputs")
            .select("*")
            .eq("job_id", id);
          setOutputs(outputData ?? []);
          clearInterval(interval);
        } else if (jobData.status === "failed") {
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  const activeOutput = outputs.find((o) => o.type === activeTab);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8">
        <p className="text-white/50">Job not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-white/40 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="text-lg font-semibold text-white truncate">
          {job.title ?? job.source_url ?? "Untitled"}
        </h1>
        <span
          className={`ml-auto text-xs px-2 py-1 rounded-full shrink-0 ${
            job.status === "completed"
              ? "bg-green-500/10 text-green-400"
              : job.status === "failed"
              ? "bg-red-500/10 text-red-400"
              : "bg-yellow-500/10 text-yellow-400"
          }`}
        >
          {job.status}
        </span>
      </div>

      {/* Processing state */}
      {(job.status === "pending" || job.status === "transcribing" || job.status === "generating") && (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">
            {job.status === "transcribing" ? "Fetching transcript..." : "Generating content..."}
          </p>
          <p className="text-white/40 text-sm mt-2">This usually takes 15-30 seconds</p>
        </div>
      )}

      {/* Failed state */}
      {job.status === "failed" && (
        <div className="glass rounded-2xl p-8 border border-red-500/20">
          <p className="text-red-300 font-semibold mb-2">Processing failed</p>
          <p className="text-white/50 text-sm">
            This can happen if the video doesn&apos;t have captions. Try another video.
          </p>
          <Link
            href="/new"
            className="inline-block mt-4 px-4 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
          >
            Try again
          </Link>
        </div>
      )}

      {/* Completed state */}
      {job.status === "completed" && outputs.length > 0 && (
        <div>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {OUTPUT_TABS.map((tab) => {
              const hasOutput = outputs.some((o) => o.type === tab.type);
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.type
                      ? "bg-purple-600 text-white"
                      : hasOutput
                      ? "glass text-white/70 hover:text-white"
                      : "glass text-white/30 cursor-not-allowed"
                  }`}
                  disabled={!hasOutput}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Output content */}
          {activeOutput && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <span className="text-sm text-white/50">
                  {OUTPUT_TABS.find((t) => t.type === activeTab)?.label}
                </span>
                <CopyButton text={activeOutput.content} />
              </div>
              <div className="p-6">
                <pre className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-sans">
                  {activeOutput.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
