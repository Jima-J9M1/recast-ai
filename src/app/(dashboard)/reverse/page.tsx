"use client";

import { useState } from "react";
import { FileVideo, Sparkles, Copy, Check, Download, Loader2, Repeat2, Clapperboard, Zap, Image, Hash } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LANGUAGES, type ToneStyle, type Language } from "@/types";

const TONES: { value: ToneStyle; label: string }[] = [
  { value: "professional", label: "💼 Professional" },
  { value: "casual",       label: "☕ Casual" },
  { value: "storytelling", label: "📖 Storytelling" },
  { value: "educational",  label: "🎓 Educational" },
  { value: "humorous",     label: "😄 Humorous" },
];

type ResultTab = "script" | "hooks" | "thumbnails" | "thread";

const TABS: { key: ResultTab; label: string; icon: React.ElementType }[] = [
  { key: "script",     label: "Video Script",      icon: Clapperboard },
  { key: "hooks",      label: "Short-form Hooks",  icon: Zap },
  { key: "thumbnails", label: "Thumbnail Ideas",   icon: Image },
  { key: "thread",     label: "Tweet Thread",      icon: Hash },
];

interface Results {
  videoScript: string;
  videoHooks: string;
  thumbnailIdeas: string;
  tweetThread: string;
}

function CopyButton({ text }: Readonly<{ text: string }>) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 hover:text-white text-xs transition-all hover:bg-white/5"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
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
    <button
      onClick={download}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 hover:text-white text-xs transition-all hover:bg-white/5"
    >
      <Download className="w-3.5 h-3.5" /> Export
    </button>
  );
}

function getContent(results: Results, tab: ResultTab): string {
  if (tab === "script")     return results.videoScript;
  if (tab === "hooks")      return results.videoHooks;
  if (tab === "thumbnails") return results.thumbnailIdeas;
  return results.tweetThread;
}

function getFilename(tab: ResultTab): string {
  const names: Record<ResultTab, string> = {
    script:     "video-script.md",
    hooks:      "short-form-hooks.md",
    thumbnails: "thumbnail-ideas.md",
    thread:     "tweet-thread.md",
  };
  return names[tab];
}

export default function ReversePage() {
  const [text, setText]           = useState("");
  const [tone, setTone]           = useState<ToneStyle>("professional");
  const [language, setLanguage]   = useState<Language>("English");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [results, setResults]     = useState<Results | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("script");

  async function handleGenerate() {
    if (text.trim().length < 50) {
      setError("Please paste at least 50 characters of text.");
      return;
    }
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tone, language }),
      });
      const json = await res.json() as Results & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Generation failed. Please try again.");
      } else {
        setResults(json);
        setActiveTab("script");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const activeContent = results ? getContent(results, activeTab) : "";
  const wordCount = activeContent.split(/\s+/).filter(Boolean).length;

  return (
    <div className="p-8 max-w-4xl animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
            <Repeat2 className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reverse Repurposing</h1>
        </div>
        <p className="text-white/40 text-sm ml-12">
          Paste any text — blog post, newsletter, article — and get a full YouTube script, short-form hooks, thumbnail ideas, and a tweet thread.
        </p>
      </div>

      {/* Input section */}
      <div className="glass rounded-2xl p-6 mb-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <FileVideo className="w-4 h-4 text-white/40" />
          <span className="text-sm font-semibold text-white/60 uppercase tracking-wider">Your content</span>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your blog post, newsletter, article, or any long-form text here…"
          rows={10}
          className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] resize-none transition-all"
        />

        <div className="flex items-center gap-3 flex-wrap">
          {/* Tone */}
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as ToneStyle)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
            ))}
          </select>

          {/* Language */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-zinc-900">{l.flag} {l.code}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-3">
            {text.trim().length > 0 && (
              <span className="text-xs text-white/25">
                {text.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            )}
            <button
              onClick={() => void handleGenerate()}
              disabled={loading || text.trim().length < 50}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                : <><Sparkles className="w-4 h-4" /> Generate Video Content</>}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-amber-900/30 flex items-center justify-center">
              <Repeat2 className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-white font-semibold text-lg mb-1">Generating 4 outputs…</p>
          <p className="text-white/30 text-sm">Script, hooks, thumbnails, and tweet thread</p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div>
          {/* Tabs */}
          <div className="flex gap-1.5 mb-5 p-1 glass rounded-xl w-fit">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-900/40"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content card */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/5">
              <span className="text-xs text-white/30">{wordCount.toLocaleString()} words</span>
              <div className="flex items-center gap-2">
                <CopyButton text={activeContent} />
                <DownloadButton text={activeContent} filename={getFilename(activeTab)} />
              </div>
            </div>
            <div className="p-7 overflow-auto max-h-[65vh]">
              <div className="prose-dark">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeContent}</ReactMarkdown>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/20 mt-4 text-center">
            Switch tabs above to see all 4 outputs. Use Copy or Export to save each one.
          </p>
        </div>
      )}
    </div>
  );
}
