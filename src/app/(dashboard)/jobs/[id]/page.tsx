"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { FileText, Hash, Briefcase, Mail, Copy, Check, ArrowLeft, Loader2, Square, Download, RefreshCw, Sparkles, X, Layers, History, RotateCcw, Save, MessageSquare, SendHorizonal, Star, AtSign, Pencil, Link2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import type { Job, Output } from "@/types";

const TABS = [
  { type: "blog" as const,           icon: FileText,  label: "Blog Post"     },
  { type: "twitter_thread" as const, icon: Hash,      label: "Twitter"       },
  { type: "linkedin" as const,       icon: Briefcase, label: "LinkedIn"      },
  { type: "newsletter" as const,     icon: Mail,      label: "Newsletter"    },
  { type: "email_sequence" as const, icon: AtSign,    label: "Email Sequence" },
  { type: "extras" as const,         icon: Layers,    label: "Extras"        },
];

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

const TONE_LABELS: Record<string, string> = {
  professional: "💼 Professional",
  casual:       "☕ Casual",
  storytelling: "📖 Storytelling",
  educational:  "🎓 Educational",
  humorous:     "😄 Humorous",
};

function getTabClass(active: boolean, has: boolean): string {
  if (active) return "bg-amber-600 text-white shadow-lg shadow-amber-900/40";
  if (has)    return "text-white/50 hover:text-white hover:bg-white/5";
  return "text-white/20 cursor-not-allowed";
}

function getStatusBadge(status: string) {
  if (status === "completed") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  if (status === "failed")    return "bg-red-500/10 text-red-400 border border-red-500/20";
  if (status === "cancelled") return "bg-white/5 text-white/30 border border-white/10";
  return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
}

const wordCount = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

const readTime = (text: string): string => {
  const mins = Math.max(1, Math.round(wordCount(text) / 230));
  return mins === 1 ? "1 min read" : `${mins} min read`;
};

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

function CopyMarkdownButton({ text }: Readonly<{ text: string }>) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/40 hover:text-white text-xs transition-all hover:bg-white/5" title="Copy as Markdown">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="font-mono font-bold text-[10px]">MD</span>}
      {copied ? "Copied!" : "Markdown"}
    </button>
  );
}

function ShareButton({ jobId }: Readonly<{ jobId: string }>) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${location.origin}/share/${jobId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <button onClick={share} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/40 hover:text-white text-xs transition-all hover:bg-white/5">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}

function BlogMeta({ text }: Readonly<{ text: string }>) {
  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(wc / 230));
  return (
    <p className="text-xs text-white/25 mb-4 tabular-nums">
      {wc} words · {mins === 1 ? "1 min read" : `${mins} min read`}
    </p>
  );
}

function LinkedInCharCount({ content }: Readonly<{ content: string }>) {
  const len = content.length;
  const over = len > 3000;
  return (
    <p className={`text-xs mb-4 tabular-nums ${over ? "text-red-400" : "text-white/25"}`}>
      {len} / 3,000 chars{over ? " · may be cut off in feed" : ""}
    </p>
  );
}

function QuickPublishBar({ tab, content }: Readonly<{ tab: Output["type"]; content: string }>) {
  if (tab === "twitter_thread") {
    const firstTweet = content.split(/\n\n/)[0]?.replace(/^1\/\s*/, "").trim() ?? "";
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(firstTweet.slice(0, 270))}`;
    return (
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/40 hover:text-sky-400 text-xs transition-all hover:bg-white/5 hover:border-sky-500/20"
      >
        <span className="font-bold text-[11px]">𝕏</span> Tweet first hook
      </a>
    );
  }
  if (tab === "linkedin") {
    return (
      <a
        href="https://www.linkedin.com/post/new"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => { void navigator.clipboard.writeText(content); }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/40 hover:text-blue-400 text-xs transition-all hover:bg-white/5"
        title="Copies post then opens LinkedIn"
      >
        <span className="font-bold text-[11px]">in</span> Open in LinkedIn
      </a>
    );
  }
  return null;
}

function parseTweets(content: string): string[] {
  const blocks = content.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const numbered = blocks.filter((b) => /^\d+\//.test(b));
  if (numbered.length >= 2) return numbered;
  return content.split(/(?=\n\d+\/)/).map((t) => t.trim()).filter(Boolean);
}

function TwitterThreadView({ content }: Readonly<{ content: string }>) {
  const tweets = parseTweets(content);
  if (tweets.length < 2) {
    return <pre className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-sans">{content}</pre>;
  }
  return (
    <div className="space-y-3">
      {tweets.map((tweet) => {
        const over = tweet.length > 280;
        return (
          <div key={tweet.slice(0, 40)} className="rounded-xl bg-white/2.5 border border-white/6 p-4">
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{tweet}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className={`text-xs tabular-nums ${over ? "text-red-400" : "text-white/25"}`}>
                {tweet.length} / 280{over ? " · over limit" : ""}
              </span>
              <CopyButton text={tweet} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function parseSeoMeta(content: string): { keyword: string; metaDesc: string } | null {
  const kwMatch   = /^\*\*SEO keyword:\*\*\s*(.+)/m.exec(content);
  const metaMatch = /^\*\*Meta description:\*\*\s*(.+)/m.exec(content);
  if (!kwMatch || !metaMatch) return null;
  return { keyword: kwMatch[1].trim(), metaDesc: metaMatch[1].trim() };
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

interface VersionPickerProps {
  readonly versions: Output[];
  readonly currentVersion: number;
  readonly onSelect: (v: number) => void;
  readonly onRestore: (v: number) => void;
  readonly restoring: boolean;
}

function VersionPicker({ versions, currentVersion, onSelect, onRestore, restoring }: VersionPickerProps) {
  const [open, setOpen] = useState(false);
  const latestVersion = Math.max(...versions.map((v) => v.version));
  const isLatest = currentVersion === latestVersion;

  if (versions.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
          open ? "bg-amber-600/20 text-amber-300 border border-amber-500/30" : "glass text-white/50 hover:text-white hover:bg-white/5"
        }`}
      >
        <History className="w-3.5 h-3.5" />
        v{currentVersion}
        {!isLatest && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-20 w-52 glass rounded-xl border border-white/10 shadow-xl overflow-hidden">
          <p className="text-xs text-white/30 px-3 pt-3 pb-1.5 font-medium uppercase tracking-wider">Version history</p>
          {[...versions].sort((a, b) => b.version - a.version).map((v) => {
            const isViewing  = v.version === currentVersion;
            const isNewest   = v.version === latestVersion;
            return (
              <div
                key={v.version}
                className={`flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors ${isViewing ? "bg-amber-600/10" : ""}`}
              >
                <button
                  onClick={() => { onSelect(v.version); setOpen(false); }}
                  className="flex items-center gap-2 text-sm text-left flex-1 min-w-0"
                >
                  <span className={`font-medium ${isViewing ? "text-amber-300" : "text-white/70"}`}>
                    v{v.version}
                  </span>
                  {isNewest && <span className="text-xs text-white/30">latest</span>}
                  {isViewing && !isNewest && <span className="text-xs text-amber-400">viewing</span>}
                </button>
                {!isNewest && (
                  <button
                    onClick={() => { onRestore(v.version); setOpen(false); }}
                    disabled={restoring}
                    className="flex items-center gap-1 text-xs text-white/30 hover:text-amber-300 transition-colors disabled:opacity-40 shrink-0"
                    title="Restore this version"
                  >
                    <RotateCcw className="w-3 h-3" /> Restore
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Star Button ───────────────────────────────────────────────────────────────

interface StarButtonProps {
  readonly outputId: string;
  readonly starred: boolean;
  readonly onToggle: (id: string, starred: boolean) => void;
}

function StarButton({ outputId, starred, onToggle }: StarButtonProps) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/outputs/${outputId}/star`, { method: "POST" });
    if (res.ok) {
      const { starred: next } = await res.json() as { starred: boolean };
      onToggle(outputId, next);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={() => void toggle()}
      disabled={loading}
      title={starred ? "Remove from library" : "Save to library"}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-40 ${
        starred
          ? "bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25"
          : "glass text-white/40 hover:text-amber-400 hover:bg-white/5"
      }`}
    >
      <Star className={`w-3.5 h-3.5 ${starred ? "fill-amber-400" : ""}`} />
      {starred ? "Saved" : "Save"}
    </button>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  readonly jobId: string;
}

function ChatPanel({ jobId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (res.ok && data.reply) {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([...next, { role: "assistant", content: data.error ?? "Something went wrong." }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Failed to send. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass rounded-2xl flex flex-col" style={{ height: "65vh" }}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5 shrink-0">
        <MessageSquare className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-white/70">Chat with transcript</span>
        <span className="text-xs text-white/25 ml-auto">Ask anything about this content</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-400/60" />
            </div>
            <p className="text-sm text-white/30">Ask anything about the transcript</p>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {["Summarize the key points", "What are the main takeaways?", "Find the best quotes"].map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => setInput(hint)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-white/40 hover:text-white/70 hover:bg-white/8 transition-all"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-amber-600 text-white rounded-br-sm"
                : "bg-white/5 border border-white/8 text-white/80 rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/8 px-4 py-2.5 focus-within:border-amber-500/40 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder="Ask about the content…"
            disabled={sending}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!input.trim() || sending}
            className="shrink-0 w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center hover:bg-amber-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <SendHorizonal className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}


export default function JobPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const [job, setJob]           = useState<Job | null>(null);
  const [outputs, setOutputs]   = useState<Output[]>([]);
  const [activeTab, setActiveTab] = useState<Output["type"]>("blog");
  const [viewingVersions, setViewingVersions] = useState<Partial<Record<string, number>>>({});
  const [loading, setLoading]   = useState(true);
  const [stopping, setStopping] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [restoring, setRestoring]       = useState(false);
  const [refineOpen, setRefineOpen]         = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewing, setPreviewing]         = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [editMode, setEditMode]             = useState(false);
  const [editedContent, setEditedContent]   = useState("");
  const [editSaving, setEditSaving]         = useState(false);
  const [showChat, setShowChat]             = useState(false);
  const [starredIds, setStarredIds]         = useState<Set<string>>(new Set());
  const [outputLoadError, setOutputLoadError] = useState(false);
  const loadingRef  = useRef(false);
  const loadedRef   = useRef(false);
  const failCountRef = useRef(0);

  const loadOutputs = useCallback(async (jobId: string): Promise<boolean> => {
    if (loadedRef.current) return true;
    if (loadingRef.current) return false;
    loadingRef.current = true;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("outputs")
        .select("*")
        .eq("job_id", jobId)
        .order("version", { ascending: true });
      if (!error) {
        const loaded = (data ?? []) as Output[];
        if (loaded.length > 0) {
          setOutputs(loaded);
          setStarredIds(new Set(loaded.filter((o) => o.starred).map((o) => o.id)));
          setOutputLoadError(false);
          loadedRef.current = true;
          failCountRef.current = 0;
          return true;
        }
      }
      failCountRef.current += 1;
      if (failCountRef.current >= 5) setOutputLoadError(true);
      return false;
    } finally {
      loadingRef.current = false;
    }
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
        const ok = await loadOutputs(id);
        if (ok || failCountRef.current >= 5) clearInterval(interval);
      } else if (TERMINAL_STATUSES.has(data.status)) {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, loadOutputs]);

  const tabVersions = outputs
    .filter((o) => o.type === activeTab)
    .sort((a, b) => b.version - a.version);
  const latestVersion = tabVersions[0]?.version ?? 1;
  const currentVersion = viewingVersions[activeTab] ?? latestVersion;
  const activeOutput = tabVersions.find((o) => o.version === currentVersion) ?? tabVersions[0];

  function switchTab(tab: Output["type"]) {
    setActiveTab(tab);
    setEditMode(false);
    setRefineOpen(false);
    setRefineInstruction("");
    setPreviewContent(null);
  }

  function discardPreview() {
    setPreviewContent(null);
    setRefineInstruction("");
  }

  const handlePreviewRefine = useCallback(async (instruction: string) => {
    setPreviewing(true);
    setRefineOpen(false);
    try {
      const res = await fetch(`/api/jobs/${id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: activeTab, instruction, preview: true }),
      });
      if (res.ok) {
        const { content } = await res.json() as { content: string };
        setPreviewContent(content);
      }
    } finally {
      setPreviewing(false);
    }
  }, [id, activeTab]);

  const handleSavePreview = useCallback(async () => {
    if (!previewContent) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${id}/save-output`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: activeTab, content: previewContent }),
      });
      if (res.ok) {
        const { version } = await res.json() as { version: number };
        const newOutput: Output = {
          id: crypto.randomUUID(),
          job_id: id,
          type: activeTab,
          content: previewContent,
          version,
          created_at: new Date().toISOString(),
        };
        setOutputs((prev) => [...prev, newOutput]);
        setViewingVersions((prev) => ({ ...prev, [activeTab]: version }));
        setPreviewContent(null);
        setRefineInstruction("");
      }
    } finally {
      setSaving(false);
    }
  }, [id, activeTab, previewContent]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    setPreviewContent(null);
    try {
      const res = await fetch(`/api/jobs/${id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: activeTab }),
      });
      if (res.ok) {
        const { content, version } = await res.json() as { content: string; version: number };
        const newOutput: Output = {
          id: crypto.randomUUID(),
          job_id: id,
          type: activeTab,
          content,
          version,
          created_at: new Date().toISOString(),
        };
        setOutputs((prev) => [...prev, newOutput]);
        setViewingVersions((prev) => ({ ...prev, [activeTab]: version }));
      }
    } finally {
      setRegenerating(false);
    }
  }, [id, activeTab]);

  async function handleRestore(version: number) {
    setRestoring(true);
    try {
      const res = await fetch(`/api/jobs/${id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, version }),
      });
      if (res.ok) {
        const { content, version: newVersion } = await res.json() as { content: string; version: number };
        const newOutput: Output = {
          id: crypto.randomUUID(),
          job_id: id,
          type: activeTab,
          content,
          version: newVersion,
          created_at: new Date().toISOString(),
        };
        setOutputs((prev) => [...prev, newOutput]);
        setViewingVersions((prev) => ({ ...prev, [activeTab]: newVersion }));
      }
    } finally {
      setRestoring(false);
    }
  }

  async function handleStop() {
    setStopping(true);
    await fetch(`/api/jobs/${id}/cancel`, { method: "POST" });
    setStopping(false);
  }

  const displayContent = previewContent ?? activeOutput?.content ?? "";
  const wordCount = displayContent.split(/\s+/).filter(Boolean).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!job) return <div className="p-8 text-white/40">Job not found.</div>;

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
            <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-white/30 hover:text-amber-400 transition-colors truncate block mt-0.5">
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
          {job.language === "English" ? null : (
            job.language && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/8">
                🌐 {job.language}
              </span>
            )
          )}
          {job.seo_mode && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SEO
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusBadge(job.status)}`}>
            {job.status}
          </span>
        </div>
      </div>

      {/* Processing — step-by-step progress */}
      {isProcessing && (() => {
        const isTranscribing = job.status === "transcribing" || job.status === "pending";
        const isGenerating = job.status === "generating";
        type Step = { label: string; detail: string; done: boolean; active: boolean };
        const steps: Step[] = [
          { label: "Job queued",          detail: "Waiting to start",                       done: !isTranscribing,  active: job.status === "pending" },
          { label: "Fetching transcript", detail: "Extracting captions from your video",    done: isGenerating,     active: job.status === "transcribing" },
          { label: "Reading with GPT-4o", detail: "Analyzing your content",                 done: false,            active: isGenerating },
          { label: "Blog post",           detail: "SEO-optimized long-form article",        done: false,            active: isGenerating },
          { label: "Twitter thread",      detail: "Viral hook + engaging thread",           done: false,            active: isGenerating },
          { label: "LinkedIn post",       detail: "Professional B2B reach",                done: false,            active: isGenerating },
          { label: "Newsletter",          detail: "Ready-to-send email with subject line",  done: false,            active: isGenerating },
        ];
        const activeIdx = steps.findIndex((s) => s.active);
        return (
          <div className="glass rounded-2xl p-7 mb-6">
            <div className="flex items-start gap-3 mb-7">
              <div className="relative w-8 h-8 shrink-0 mt-0.5">
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">
                  {isTranscribing ? "Fetching transcript…" : "Generating your content…"}
                </p>
                <p className="text-white/30 text-xs mt-0.5">Usually takes 30–60 seconds</p>
              </div>
              <button
                onClick={handleStop}
                disabled={stopping}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/8 hover:border-red-500/20 text-white/30 hover:text-red-400 text-xs transition-all disabled:opacity-40 shrink-0"
              >
                <Square className="w-3 h-3" />
                {stopping ? "Stopping…" : "Stop"}
              </button>
            </div>
            <div className="space-y-3 pl-1">
              {steps.map((step, idx) => {
                const isPending = !step.done && !step.active && idx > activeIdx;
                return (
                  <div key={step.label} className={"flex items-center gap-3 " + (isPending ? "opacity-25" : "")}>
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      {step.done ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      ) : step.active ? (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-white/15" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={"text-sm " + (step.done ? "text-white/40" : step.active ? "text-white font-medium" : "text-white/30")}>
                        {step.label}
                      </p>
                    </div>
                    {step.active && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Failed */}
      {job.status === "failed" && (
        <div className="glass rounded-2xl p-8 border border-red-500/15 mb-6">
          <p className="text-red-300 font-semibold mb-2">Processing failed</p>
          <p className="text-white/60 text-sm mb-5">
            {job.error_message ?? "Something went wrong. Please try again."}
          </p>
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

      {/* Output load error */}
      {job.status === "completed" && outputLoadError && (
        <div className="glass rounded-2xl p-6 border border-amber-500/15 mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-amber-300 font-semibold text-sm">Content didn't load</p>
            <p className="text-white/40 text-xs mt-0.5">The job completed but outputs failed to load. Try refreshing.</p>
          </div>
          <button
            onClick={() => void loadOutputs(id)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      )}

      {/* Completed outputs */}
      {job.status === "completed" && outputs.length > 0 && (
        <div>
          {/* Tabs */}
          <div className="flex gap-1.5 mb-5 p-1 glass rounded-xl w-fit">
            {TABS.map((tab) => {
              const has    = outputs.some((o) => o.type === tab.type);
              const active = !showChat && activeTab === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => { setShowChat(false); switchTab(tab.type); }}
                  disabled={!has}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${getTabClass(active, has)}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
            {job.transcript && (
              <button
                onClick={() => setShowChat(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showChat
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-900/40"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </button>
            )}
          </div>

          {/* Chat panel */}
          {showChat && <ChatPanel jobId={id} />}

          {/* Content card */}
          {!showChat && activeOutput && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30">{wordCount.toLocaleString()} words</span>
                  {previewContent !== null && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium">
                      Preview
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {previewContent !== null ? (
                    <>
                      <button
                        onClick={() => void handleSavePreview()}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 transition-all disabled:opacity-40"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={discardPreview}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 hover:text-red-400 text-xs transition-all hover:bg-red-500/10"
                      >
                        <X className="w-3.5 h-3.5" /> Discard
                      </button>
                    </>
                  ) : (
                    activeTab !== "extras" && (
                      <>
                        <VersionPicker
                          versions={tabVersions}
                          currentVersion={currentVersion}
                          onSelect={(v) => setViewingVersions((prev) => ({ ...prev, [activeTab]: v }))}
                          onRestore={handleRestore}
                          restoring={restoring}
                        />
                        <button
                          onClick={() => setRefineOpen((v) => !v)}
                          disabled={regenerating || previewing}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-40 ${
                            refineOpen
                              ? "bg-amber-600/20 text-amber-300 border border-amber-500/30"
                              : "glass text-white/50 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Refine
                        </button>
                        <button
                          onClick={() => void handleRegenerate()}
                          disabled={regenerating || previewing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 hover:text-white text-xs transition-all hover:bg-white/5 disabled:opacity-40"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
                          {regenerating ? "Generating…" : "Regenerate"}
                        </button>
                      </>
                    )
                  )}
                  <CopyButton text={activeTab === "twitter_thread" ? (previewContent ?? activeOutput.content) : stripMarkdown(previewContent ?? activeOutput.content)} />
                  {activeTab !== "twitter_thread" && (
                    <CopyMarkdownButton text={previewContent ?? activeOutput.content} />
                  )}
                  <DownloadButton text={previewContent ?? activeOutput.content} filename={`${activeTab}-${id.slice(0, 8)}.md`} />
                  {previewContent === null && !editMode && (
                    <button
                      onClick={() => { setEditedContent(activeOutput.content); setEditMode(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 hover:text-amber-400 text-xs transition-all hover:bg-white/5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  <ShareButton jobId={id} />
                  {previewContent === null && !editMode && (
                    <QuickPublishBar tab={activeTab} content={activeOutput.content} />
                  )}
                  {previewContent === null && (
                    <StarButton outputId={activeOutput.id} starred={starredIds.has(activeOutput.id)} onToggle={(id, starred) => setStarredIds((prev) => { const next = new Set(prev); starred ? next.add(id) : next.delete(id); return next; })} />
                  )}
                </div>
              </div>

              {refineOpen && activeTab !== "extras" && previewContent === null && (
                <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-amber-500/5">
                  <input
                    type="text"
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && refineInstruction.trim()) void handlePreviewRefine(refineInstruction); }}
                    placeholder="e.g. make it shorter, add more examples, focus on beginners…"
                    className="flex-1 text-sm bg-transparent text-white placeholder-white/25 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => void handlePreviewRefine(refineInstruction)}
                    disabled={!refineInstruction.trim() || previewing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-500 transition-all disabled:opacity-40"
                  >
                    {previewing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</> : "Apply"}
                  </button>
                  <button onClick={() => setRefineOpen(false)} className="text-white/30 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className={`p-7 overflow-auto max-h-[65vh] transition-opacity ${regenerating || restoring || previewing || saving ? "opacity-40 pointer-events-none" : ""}`}>
                {/* Word count for blog, char count for LinkedIn */}
                {!editMode && activeTab === "blog" && (
                  <BlogMeta text={previewContent ?? activeOutput.content} />
                )}
                {!editMode && activeTab === "linkedin" && (
                  <LinkedInCharCount content={previewContent ?? activeOutput.content} />
                )}
                {job.seo_mode && activeTab === "blog" && (() => {
                  const seo = parseSeoMeta(activeOutput.content);
                  return seo ? (
                    <div className="mb-5 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20 space-y-2">
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">SEO</span>
                      <div>
                        <p className="text-xs text-white/40">Focus keyword</p>
                        <p className="text-sm text-white/80 font-medium">{seo.keyword}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Meta description ({seo.metaDesc.length} chars)</p>
                        <p className="text-sm text-white/70">{seo.metaDesc}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
                {editMode ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full min-h-[420px] bg-white/3 border border-amber-500/20 rounded-xl p-4 text-sm text-white/85 leading-relaxed resize-y focus:outline-none focus:border-amber-500/50 transition-all font-mono"
                      spellCheck={false}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (!editedContent.trim()) return;
                          setEditSaving(true);
                          try {
                            const res = await fetch(`/api/jobs/${id}/save-output`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ format: activeTab, content: editedContent }),
                            });
                            if (res.ok) {
                              const { version } = await res.json() as { version: number };
                              const newOutput: Output = {
                                id: crypto.randomUUID(),
                                job_id: id,
                                type: activeTab,
                                content: editedContent,
                                version,
                                created_at: new Date().toISOString(),
                              };
                              setOutputs((prev) => [...prev, newOutput]);
                              setViewingVersions((prev) => ({ ...prev, [activeTab]: version }));
                              setEditMode(false);
                            }
                          } finally {
                            setEditSaving(false);
                          }
                        }}
                        disabled={editSaving || !editedContent.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 transition-all disabled:opacity-40"
                      >
                        {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {editSaving ? "Saving…" : "Save as new version"}
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 rounded-xl text-white/40 hover:text-white/70 text-xs transition-all hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <span className="ml-auto text-xs text-white/20 tabular-nums">{editedContent.length} chars</span>
                    </div>
                  </div>
                ) : activeTab === "twitter_thread" ? (
                  <TwitterThreadView content={previewContent ?? activeOutput.content} />
                ) : (
                  <div className="prose-dark">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {previewContent ?? activeOutput.content}
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
