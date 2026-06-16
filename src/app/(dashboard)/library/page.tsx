"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, FileText, Hash, Briefcase, Mail, Layers, Copy, Check, ExternalLink, AtSign, Loader2 } from "lucide-react";
import Link from "next/link";
import type { OutputType } from "@/types";

interface LibraryOutput {
  id: string;
  type: OutputType;
  content: string;
  version: number;
  created_at: string;
  starred: boolean;
  job_id: string;
  job_title: string | null;
  job_source_url: string | null;
}

const FORMAT_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  blog:           { icon: FileText,  label: "Blog Post",      color: "text-blue-400"   },
  twitter_thread: { icon: Hash,      label: "Twitter",        color: "text-sky-400"    },
  linkedin:       { icon: Briefcase, label: "LinkedIn",       color: "text-blue-500"   },
  newsletter:     { icon: Mail,      label: "Newsletter",     color: "text-amber-400" },
  email_sequence: { icon: AtSign,    label: "Email Sequence", color: "text-emerald-400"},
  extras:         { icon: Layers,    label: "Extras",         color: "text-white/40"   },
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all",           label: "All formats" },
  { value: "blog",          label: "Blog Post" },
  { value: "twitter_thread",label: "Twitter" },
  { value: "linkedin",      label: "LinkedIn" },
  { value: "newsletter",    label: "Newsletter" },
  { value: "email_sequence",label: "Email Sequence" },
];

function CopyButton({ text }: Readonly<{ text: string }>) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={() => void copy()} className="flex items-center gap-1 px-2.5 py-1 rounded-lg glass text-white/40 hover:text-white text-xs transition-all hover:bg-white/5">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function LibraryPage() {
  const [outputs, setOutputs]       = useState<LibraryOutput[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/library");
    if (res.ok) {
      const json = await res.json() as { outputs: LibraryOutput[] };
      setOutputs(json.outputs);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function unstar(outputId: string) {
    const res = await fetch(`/api/outputs/${outputId}/star`, { method: "POST" });
    if (res.ok) setOutputs((prev) => prev.filter((o) => o.id !== outputId));
  }

  const filtered = filter === "all" ? outputs : outputs.filter((o) => o.type === filter);

  return (
    <div className="p-8 max-w-4xl animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Library</h1>
          <p className="text-white/40 mt-1">Your saved outputs across all jobs.</p>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400">
          <Star className="w-4 h-4 fill-amber-400" />
          <span className="text-sm font-semibold">{outputs.length} saved</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.value
                ? "bg-amber-600/20 text-amber-300 border border-amber-500/30"
                : "glass text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-900/30 flex items-center justify-center mb-5">
            <Star className="w-7 h-7 text-amber-400" />
          </div>
          <p className="text-white font-semibold text-lg mb-2">
            {outputs.length === 0 ? "Your library is empty" : "No saved outputs here"}
          </p>
          <p className="text-white/40 text-sm max-w-xs">
            {outputs.length === 0
              ? "Open any generated job and hit the ★ on an output you want to keep. It'll live here."
              : "Nothing saved under this filter yet. Try a different format."}
          </p>
          {outputs.length === 0 && (
            <Link href="/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 transition-all shadow-lg shadow-amber-900/30 mt-6">
              <Star className="w-4 h-4" /> Generate something to save
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((output) => {
            const meta = FORMAT_META[output.type] ?? FORMAT_META.extras;
            const preview = output.content.slice(0, 280).replace(/[#*`>]/g, "").trim();
            return (
              <div key={output.id} className="glass rounded-2xl p-5 group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <meta.icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      {output.version > 1 && (
                        <span className="text-xs text-white/25">v{output.version}</span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5 truncate">
                      {output.job_title ?? output.job_source_url ?? "Untitled job"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <CopyButton text={output.content} />
                    <Link href={`/jobs/${output.job_id}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg glass text-white/40 hover:text-white text-xs transition-all hover:bg-white/5">
                      <ExternalLink className="w-3 h-3" /> Open
                    </Link>
                    <button
                      onClick={() => void unstar(output.id)}
                      title="Remove from library"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg glass text-amber-400/60 hover:text-white text-xs transition-all hover:bg-red-500/10"
                    >
                      <Star className="w-3 h-3 fill-amber-400" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-white/50 leading-relaxed line-clamp-3 pl-11">{preview}{output.content.length > 280 ? "…" : ""}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
