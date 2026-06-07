"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap, FileText, Hash, Briefcase, Mail, ArrowRight, Globe, Mic, Upload } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PLAN_LIMITS, LANGUAGES, type ToneStyle, type Language, type Plan } from "@/types";

const OUTPUT_TYPES = [
  { icon: FileText, label: "Blog Post",       desc: "SEO-optimized long-form article" },
  { icon: Hash,     label: "Twitter Thread",  desc: "Viral-ready thread with hook & CTA" },
  { icon: Briefcase,label: "LinkedIn Post",   desc: "Professional post built for reach" },
  { icon: Mail,     label: "Newsletter",      desc: "Ready-to-send email with subject line" },
];

const TONES: { value: ToneStyle; label: string; emoji: string; desc: string }[] = [
  { value: "professional", label: "Professional", emoji: "💼", desc: "Authoritative & polished" },
  { value: "casual",       label: "Casual",       emoji: "☕", desc: "Friendly & conversational" },
  { value: "storytelling", label: "Storytelling", emoji: "📖", desc: "Narrative-driven" },
  { value: "educational",  label: "Educational",  emoji: "🎓", desc: "Clear & structured" },
  { value: "humorous",     label: "Humorous",     emoji: "😄", desc: "Witty & playful" },
];

const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

function isYouTubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url);
}

async function loadUserCredits(userId: string): Promise<number | null> {
  const supabase = createClient();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabase.from("users").select("plan").eq("id", userId).single(),
    supabase.from("usage").select("count").eq("user_id", userId).eq("month", currentMonth).single(),
  ]);
  const plan = (profile?.plan ?? "free") as Plan;
  const limit = PLAN_LIMITS[plan];
  if (limit === null) return null;
  return Math.max(0, limit - (usage?.count ?? 0));
}

async function submitYouTubeJob(url: string, tone: ToneStyle, language: Language, seoMode: boolean): Promise<string> {
  const res = await fetch("/api/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, tone, language, seo_mode: seoMode }),
  });
  const data = await res.json() as { jobId?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data.jobId ?? "";
}

async function submitAudioJob(file: File, tone: ToneStyle, language: Language, seoMode: boolean): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("tone", tone);
  form.append("language", language);
  form.append("seo_mode", String(seoMode));
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json() as { jobId?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data.jobId ?? "";
}

interface ToneSelectorProps {
  readonly value: ToneStyle;
  readonly onChange: (t: ToneStyle) => void;
  readonly disabled: boolean;
}

function ToneSelector({ value, onChange, disabled }: ToneSelectorProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Content tone</p>
      <div className="grid grid-cols-5 gap-2">
        {TONES.map((t) => {
          const active = value === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              disabled={disabled}
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
      <p className="mt-2 text-xs text-white/25">{TONES.find((t) => t.value === value)?.desc}</p>
    </div>
  );
}

interface AudioDropZoneProps {
  readonly file: File | null;
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onOpen: () => void;
  readonly loading: boolean;
}

function AudioDropZone({ file, inputRef, onChange, onOpen, loading }: AudioDropZoneProps) {
  const tooLarge = file !== null && file.size > MAX_AUDIO_BYTES;
  const dropClass = file
    ? "border-violet-500/40 bg-violet-500/5"
    : "border-white/10 hover:border-white/20 hover:bg-white/3";
  return (
    <div>
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Audio File</p>
      <button
        type="button"
        onClick={onOpen}
        disabled={loading}
        className={`w-full flex flex-col items-center gap-3 py-8 rounded-xl border-2 border-dashed transition-all disabled:opacity-50 ${dropClass}`}
      >
        <Upload className="w-6 h-6 text-white/30" />
        {file ? (
          <>
            <p className="text-sm text-white/80 font-medium">{file.name}</p>
            <p className={`text-xs ${tooLarge ? "text-red-400" : "text-white/40"}`}>
              {(file.size / 1024 / 1024).toFixed(1)} MB{tooLarge ? " — too large (max 4 MB)" : ""}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-white/50">Click to select or drag and drop</p>
            <p className="text-xs text-white/25">MP3, M4A, WAV, OGG, FLAC, WebM · max 4 MB</p>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/m4a,audio/ogg,audio/webm,audio/flac"
        className="hidden"
        onChange={onChange}
        disabled={loading}
      />
      {file && !tooLarge && (
        <p className="mt-2 text-xs text-white/25">Audio will be transcribed with Whisper, then 5 formats generated.</p>
      )}
    </div>
  );
}

interface SeoToggleProps {
  readonly checked: boolean;
  readonly onToggle: () => void;
  readonly disabled: boolean;
}

function SeoToggle({ checked, onToggle, disabled }: SeoToggleProps) {
  const desc = checked
    ? "Blog will include focus keyword, meta description & FAQ"
    : "Adds SEO structure to the blog post only";
  const trackClass = checked ? "bg-violet-600" : "bg-white/10";
  const thumbClass = checked ? "translate-x-5" : "translate-x-0";
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">SEO Mode</p>
        <p className="text-xs text-white/25 mt-1">{desc}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={checked}
        className={`relative w-11 h-6 rounded-full transition-all disabled:opacity-40 shrink-0 ${trackClass}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${thumbClass}`} />
      </button>
    </div>
  );
}

function OutputPreview() {
  return (
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
  );
}

export default function NewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<"youtube" | "audio">("youtube");
  const [url, setUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [tone, setTone] = useState<ToneStyle>("professional");
  const [language, setLanguage] = useState<Language>("English");
  const [seoMode, setSeoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCreditsLeft(await loadUserCredits(user.id));
    }
    void init();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAudioFile(e.target.files?.[0] ?? null);
    setError("");
  }

  function handleSubmit() {
    setLoading(true);
    setError("");
    const job = inputMode === "youtube"
      ? submitYouTubeJob(url, tone, language, seoMode)
      : submitAudioJob(audioFile!, tone, language, seoMode);
    job
      .then((jobId) => router.push(`/jobs/${jobId}`))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });
  }

  const isYouTube = inputMode === "youtube";
  const fileTooLarge = audioFile !== null && audioFile.size > MAX_AUDIO_BYTES;
  const canSubmit = isYouTube ? isYouTubeUrl(url) : audioFile !== null && !fileTooLarge;
  const selectedLang = LANGUAGES.find((l) => l.code === language);
  const ytTabClass = isYouTube ? "bg-violet-600 text-white shadow" : "text-white/40 hover:text-white/70";
  const audioTabClass = inputMode === "audio" ? "bg-violet-600 text-white shadow" : "text-white/40 hover:text-white/70";
  const subtitle = isYouTube
    ? "Paste a YouTube URL — we'll generate 5 content formats in ~30s."
    : "Upload an audio file — we'll transcribe and generate 5 content formats.";
  const submitLabel = inputMode === "audio" ? "Transcribing…" : "Submitting job...";

  return (
    <div className="p-8 max-w-2xl animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New content</h1>
        <p className="text-white/40 mt-1">{subtitle}</p>
      </div>

      {creditsLeft === 1 && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm truncate">This will use your last free job this month.</p>
          </div>
          <Link href="/upgrade" className="shrink-0 text-xs text-amber-300 font-semibold hover:text-amber-200 transition-colors">
            Upgrade →
          </Link>
        </div>
      )}

      <div className="glass rounded-2xl p-7 mb-6">
        <div className="flex gap-1 p-1 glass rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setInputMode("youtube"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${ytTabClass}`}
          >
            <div className="w-4 h-4 rounded bg-red-600 flex items-center justify-center shrink-0">
              <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-white ml-px" />
            </div>
            YouTube URL
          </button>
          <button
            type="button"
            onClick={() => { setInputMode("audio"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${audioTabClass}`}
          >
            <Mic className="w-4 h-4" />
            Audio File
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {isYouTube ? (
            <div>
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
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-all disabled:opacity-50 text-sm"
                  placeholder="https://youtube.com/watch?v=..."
                />
                {isYouTubeUrl(url) && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400" />}
              </div>
              <p className="mt-2 text-xs text-white/25">Requires a video with auto-generated or manual captions.</p>
            </div>
          ) : (
            <AudioDropZone
              file={audioFile}
              inputRef={fileInputRef}
              onChange={handleFileChange}
              onOpen={() => fileInputRef.current?.click()}
              loading={loading}
            />
          )}

          <ToneSelector value={tone} onChange={setTone} disabled={loading} />

          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Output language</p>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                disabled={loading}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-violet-500/60 transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#0d0d1a]">{l.flag} {l.code}</option>
                ))}
              </select>
            </div>
            {language === "English" ? null : (
              <p className="mt-2 text-xs text-violet-300/70">
                {selectedLang?.flag} All formats will be written in {language}.
              </p>
            )}
          </div>

          <SeoToggle checked={seoMode} onToggle={() => setSeoMode((v) => !v)} disabled={loading} />

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-300 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {submitLabel}</>
            ) : (
              <><Zap className="w-5 h-5" /> Generate content</>
            )}
          </button>
        </form>
      </div>

      <OutputPreview />
    </div>
  );
}
