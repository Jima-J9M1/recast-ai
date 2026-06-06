"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap, FileText, Hash, Briefcase, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PLAN_LIMITS, type ToneStyle, type Plan } from "@/types";

const OUTPUT_TYPES = [
  { icon: FileText, label: "Blog Post", desc: "SEO-optimized long-form article" },
  { icon: Hash, label: "Twitter Thread", desc: "Viral-ready thread with hook & CTA" },
  { icon: Briefcase, label: "LinkedIn Post", desc: "Professional post built for reach" },
  { icon: Mail, label: "Newsletter", desc: "Ready-to-send email with subject line" },
];

const TONES: { value: ToneStyle; label: string; emoji: string; desc: string }[] = [
  { value: "professional", label: "Professional", emoji: "💼", desc: "Authoritative & polished" },
  { value: "casual", label: "Casual", emoji: "☕", desc: "Friendly & conversational" },
  { value: "storytelling", label: "Storytelling", emoji: "📖", desc: "Narrative-driven" },
  { value: "educational", label: "Educational", emoji: "🎓", desc: "Clear & structured" },
  { value: "humorous", label: "Humorous", emoji: "😄", desc: "Witty & playful" },
];

function isYouTubeUrl(url: string) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url);
}

export default function NewPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [tone, setTone] = useState<ToneStyle>("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);

  useEffect(() => {
    async function loadCredits() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [{ data: profile }, { data: usage }] = await Promise.all([
        supabase.from("users").select("plan").eq("id", user.id).single(),
        supabase.from("usage").select("count").eq("user_id", user.id).eq("month", currentMonth).single(),
      ]);
      const plan = (profile?.plan ?? "free") as Plan;
      const limit = PLAN_LIMITS[plan];
      if (limit !== null) {
        setCreditsLeft(Math.max(0, limit - (usage?.count ?? 0)));
      }
    }
    void loadCredits();
  }, []);

  async function handleSubmit() {
    if (!isYouTubeUrl(url)) { setError("Please enter a valid YouTube URL."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, tone }),
      });
      const data = await res.json() as { jobId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/jobs/${data.jobId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const valid = isYouTubeUrl(url);

  return (
    <div className="p-8 max-w-2xl animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New content</h1>
        <p className="text-white/40 mt-1">Paste a YouTube URL — we&apos;ll generate 4 content formats in ~30s.</p>
      </div>

      {/* 1 credit remaining warning */}
      {creditsLeft === 1 && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm truncate">This will use your last free video this month.</p>
          </div>
          <Link
            href="/upgrade"
            className="shrink-0 text-xs text-amber-300 font-semibold hover:text-amber-200 transition-colors"
          >
            Upgrade →
          </Link>
        </div>
      )}

      <div className="glass rounded-2xl p-7 mb-6 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>
          {/* URL input */}
          <div className="mb-6">
            <label htmlFor="youtube-url" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              YouTube URL
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-red-600 flex items-center justify-center pointer-events-none">
                <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-[7px] border-l-white ml-0.5" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                disabled={loading}
                required
                id="youtube-url"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/6 transition-all disabled:opacity-50 text-sm"
                placeholder="https://youtube.com/watch?v=..."
              />
              {valid && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </div>
            <p className="mt-2 text-xs text-white/25">
              Requires a video with auto-generated or manual captions.
            </p>
          </div>

          {/* Tone selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Content tone
            </p>
            <div className="grid grid-cols-5 gap-2">
              {TONES.map((t) => {
                const active = tone === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTone(t.value)}
                    disabled={loading}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all disabled:opacity-40 ${
                      active
                        ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                        : "bg-white/3 border-white/8 text-white/40 hover:text-white/70 hover:bg-white/6 hover:border-white/15"
                    }`}
                  >
                    <span className="text-lg leading-none">{t.emoji}</span>
                    <span className="text-xs font-medium leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-white/25">
              {TONES.find((t) => t.value === tone)?.desc}
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-300 text-sm mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !valid}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting job...</>
            ) : (
              <><Zap className="w-5 h-5" /> Generate content</>
            )}
          </button>
        </form>
      </div>

      {/* Output preview */}
      <div>
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">What you&apos;ll get</p>
        <div className="grid grid-cols-2 gap-3">
          {OUTPUT_TYPES.map((t) => (
            <div key={t.label} className="glass rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-900/50 flex items-center justify-center shrink-0 mt-0.5">
                <t.icon className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80">{t.label}</p>
                <p className="text-xs text-white/35 mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 px-4 py-3 rounded-xl bg-violet-500/8 border border-violet-500/15 flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <p className="text-xs text-violet-300">Results are ready in ~30 seconds. You&apos;ll be taken there automatically.</p>
        </div>
      </div>
    </div>
  );
}
