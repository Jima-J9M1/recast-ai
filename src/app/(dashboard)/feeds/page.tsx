"use client";

import { useState, useEffect } from "react";
import { Rss, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FEED_LIMITS, LANGUAGES, type ToneStyle, type Language, type Plan, type Feed } from "@/types";

const TONES: { value: ToneStyle; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "storytelling", label: "Storytelling" },
  { value: "educational", label: "Educational" },
  { value: "humorous", label: "Humorous" },
];

interface AddFeedFormProps {
  readonly onAdd: (feed: Feed) => void;
  readonly feedsCount: number;
  readonly feedLimit: number;
}

function AddFeedForm({ onAdd, feedsCount, feedLimit }: AddFeedFormProps) {
  const [channelUrl, setChannelUrl] = useState("");
  const [tone, setTone] = useState<ToneStyle>("professional");
  const [language, setLanguage] = useState<Language>("English");
  const [seoMode, setSeoMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const atLimit = feedsCount >= feedLimit;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelUrl.trim() || atLimit) return;
    setSaving(true);
    setError("");
    fetch("/api/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel_url: channelUrl.trim(), tone, language, seo_mode: seoMode }),
    })
      .then((r) => r.json() as Promise<{ feed?: Feed; error?: string }>)
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        if (data.feed) { onAdd(data.feed); setChannelUrl(""); }
      })
      .catch(() => setError("Network error"))
      .finally(() => setSaving(false));
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4 mb-6">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Add Channel</p>
      <div>
        <input
          value={channelUrl}
          onChange={(e) => { setChannelUrl(e.target.value); setError(""); }}
          disabled={saving || atLimit}
          placeholder="https://youtube.com/@channelname or channel/UCxxx"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-all disabled:opacity-50 text-sm"
        />
        <p className="mt-1.5 text-xs text-white/25">Paste a YouTube channel URL, @handle, or channel ID starting with UC.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Tone</p>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as ToneStyle)}
            disabled={saving}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-violet-500/60 transition-all appearance-none disabled:opacity-50"
          >
            {TONES.map((t) => <option key={t.value} value={t.value} className="bg-[#0d0d1a]">{t.label}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Language</p>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            disabled={saving}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-violet-500/60 transition-all appearance-none disabled:opacity-50"
          >
            {LANGUAGES.map((l) => <option key={l.code} value={l.code} className="bg-[#0d0d1a]">{l.flag} {l.code}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">SEO Mode</p>
          <p className="text-xs text-white/25 mt-0.5">Adds SEO structure to blog posts</p>
        </div>
        <button
          type="button"
          onClick={() => setSeoMode((v) => !v)}
          disabled={saving}
          aria-pressed={seoMode}
          className={`relative w-11 h-6 rounded-full transition-all disabled:opacity-40 shrink-0 ${seoMode ? "bg-violet-600" : "bg-white/10"}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${seoMode ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={saving || !channelUrl.trim() || atLimit}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Add Feed
      </button>
    </form>
  );
}

interface FeedRowProps {
  readonly feed: Feed;
  readonly onToggle: (id: string, active: boolean) => void;
  readonly onDelete: (id: string) => void;
}

function FeedRow({ feed, onToggle, onDelete }: FeedRowProps) {
  const [busy, setBusy] = useState(false);

  function handleToggle() {
    setBusy(true);
    fetch(`/api/feeds/${feed.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !feed.active }),
    })
      .then(() => onToggle(feed.id, !feed.active))
      .finally(() => setBusy(false));
  }

  function handleDelete() {
    if (!confirm("Remove this feed?")) return;
    setBusy(true);
    fetch(`/api/feeds/${feed.id}`, { method: "DELETE" })
      .then(() => onDelete(feed.id))
      .finally(() => setBusy(false));
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/3 border border-white/6 hover:border-white/10 transition-all">
      <div className={`w-2 h-2 rounded-full shrink-0 ${feed.active ? "bg-emerald-400" : "bg-white/20"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80 truncate font-mono">{feed.channel_id}</p>
        <p className="text-xs text-white/30 mt-0.5">{feed.tone} · {feed.language}{feed.seo_mode ? " · SEO" : ""}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleToggle}
          disabled={busy}
          title={feed.active ? "Pause feed" : "Resume feed"}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all disabled:opacity-40"
        >
          {feed.active
            ? <ToggleRight className="w-5 h-5 text-violet-400" />
            : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          title="Remove feed"
          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/5 transition-all disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function FeedsPage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, feedsRes] = await Promise.all([
        supabase.from("users").select("plan").eq("id", user.id).single(),
        fetch("/api/feeds").then((r) => r.json() as Promise<{ feeds?: Feed[] }>),
      ]);

      setPlan((profileRes.data?.plan ?? "free") as Plan);
      setFeeds(feedsRes.feeds ?? []);
      setLoading(false);
    }
    void init();
  }, []);

  const feedLimit = FEED_LIMITS[plan];
  const isPaidPlan = plan === "starter" || plan === "pro";

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-white/40">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading feeds…</span>
      </div>
    );
  }

  if (!isPaidPlan) {
    return (
      <div className="p-8 max-w-2xl animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">RSS Auto-Import</h1>
          <p className="text-white/40 mt-1">Automatically process new YouTube videos from channels.</p>
        </div>
        <div className="glass rounded-2xl p-10 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-900/40 flex items-center justify-center">
            <Lock className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Starter &amp; Pro feature</p>
            <p className="text-sm text-white/40 mt-1 max-w-sm">
              Monitor YouTube channels and automatically convert new videos into content — hands-free.
            </p>
          </div>
          <Link
            href="/upgrade"
            className="mt-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-all"
          >
            Upgrade to Starter — $19/mo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white">RSS Auto-Import</h1>
          <span className="px-2.5 py-1 rounded-full bg-violet-600/20 text-violet-300 text-xs font-semibold border border-violet-500/20">
            {feeds.length} / {feedLimit}
          </span>
        </div>
        <p className="text-white/40">New videos from monitored channels are processed automatically every hour.</p>
      </div>

      <AddFeedForm
        onAdd={(feed) => setFeeds((prev) => [feed, ...prev])}
        feedsCount={feeds.length}
        feedLimit={feedLimit}
      />

      {feeds.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Rss className="w-8 h-8 text-white/15" />
          <p className="text-white/30 text-sm">No channels added yet. Add one above to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feeds.map((feed) => (
            <FeedRow
              key={feed.id}
              feed={feed}
              onToggle={(id, active) => setFeeds((prev) => prev.map((f) => f.id === id ? { ...f, active } : f))}
              onDelete={(id) => setFeeds((prev) => prev.filter((f) => f.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
