"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Zap, FileText, Hash, Briefcase, Mail, ArrowRight,
  Globe, Mic, Upload, Layers, Square, Check, Radio,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PLAN_LIMITS, BATCH_LIMITS, LANGUAGES, type ToneStyle, type Language, type Plan } from "@/types";

const OUTPUT_TYPES = [
  { icon: FileText,  label: "Blog Post",      desc: "SEO-optimized long-form article" },
  { icon: Hash,      label: "Twitter Thread", desc: "Viral-ready thread with hook & CTA" },
  { icon: Briefcase, label: "LinkedIn Post",  desc: "Professional post built for reach" },
  { icon: Mail,      label: "Newsletter",     desc: "Ready-to-send email with subject line" },
];

const TONES: { value: ToneStyle; label: string; emoji: string; desc: string }[] = [
  { value: "professional", label: "Professional", emoji: "💼", desc: "Authoritative & polished" },
  { value: "casual",       label: "Casual",       emoji: "☕", desc: "Friendly & conversational" },
  { value: "storytelling", label: "Storytelling", emoji: "📖", desc: "Narrative-driven" },
  { value: "educational",  label: "Educational",  emoji: "🎓", desc: "Clear & structured" },
  { value: "humorous",     label: "Humorous",     emoji: "😄", desc: "Witty & playful" },
];

const STYLE_PRESETS: { label: string; tone: ToneStyle; emoji: string; hint: string }[] = [
  { label: "Direct & Bold",    tone: "professional", emoji: "⚡", hint: "Short punchy sentences. Cut the fluff." },
  { label: "Newsletter Writer", tone: "casual",       emoji: "✉️", hint: "Conversational, like writing to a friend." },
  { label: "Thought Leader",   tone: "professional", emoji: "🎯", hint: "Data-driven insights with strong opinions." },
  { label: "Educator",         tone: "educational",  emoji: "🧑‍🏫", hint: "Break complex ideas into clear steps." },
];

type InputMode = "youtube" | "audio" | "voice" | "batch";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const YT_PATTERN = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

function isYouTubeUrl(url: string): boolean {
  return YT_PATTERN.test(url);
}

async function loadUserData(userId: string): Promise<{ creditsLeft: number | null; plan: Plan }> {
  const supabase = createClient();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabase.from("users").select("plan").eq("id", userId).single(),
    supabase.from("usage").select("count").eq("user_id", userId).eq("month", currentMonth).single(),
  ]);
  const plan = (profile?.plan ?? "free") as Plan;
  const limit = PLAN_LIMITS[plan];
  const creditsLeft = limit === null ? null : Math.max(0, limit - (usage?.count ?? 0));
  return { creditsLeft, plan };
}

async function submitYouTubeJob(url: string, tone: ToneStyle, language: Language, seoMode: boolean, styleHint: string = ""): Promise<string> {
  const res = await fetch("/api/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, tone, language, seo_mode: seoMode, style_hint: styleHint }),
  });
  const data = await res.json() as { jobId?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data.jobId ?? "";
}

async function submitAudioJob(file: File, tone: ToneStyle, language: Language, seoMode: boolean, styleHint: string = ""): Promise<string> {
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

async function submitBatchJob(
  urls: string[],
  tone: ToneStyle,
  language: Language,
  seoMode: boolean,
  extraLanguages: Language[]
): Promise<void> {
  const languages = extraLanguages.length > 0 ? [language, ...extraLanguages] : [language];
  const res = await fetch("/api/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls, tone, languages, seo_mode: seoMode }),
  });
  const data = await res.json() as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
}

// ── Voice Recorder ────────────────────────────────────────────────────────────

type RecordingState = "idle" | "recording" | "recorded";

function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

interface VoiceRecorderProps {
  readonly onFileReady: (f: File | null) => void;
  readonly loading: boolean;
}

function VoiceRecorder({ onFileReady, loading }: VoiceRecorderProps) {
  const [recState, setRecState] = useState<RecordingState>("idle");
  const [seconds, setSeconds]   = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const recorderRef             = useRef<MediaRecorder | null>(null);
  const chunksRef               = useRef<Blob[]>([]);
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      chunksRef.current   = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "voice-recording.webm", { type: "audio/webm" });
        setFileSize(file.size);
        setRecState("recorded");
        onFileReady(file);
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start();
      setRecState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      // Microphone permission denied or unavailable
    }
  }

  function stopRecording() { recorderRef.current?.stop(); }

  function reset() {
    setRecState("idle");
    setSeconds(0);
    setFileSize(0);
    onFileReady(null);
  }

  if (recState === "recording") {
    return (
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Voice Recording</p>
        <div className="flex flex-col items-center gap-4 py-8 rounded-xl border-2 border-red-500/30 bg-red-500/5">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
          </div>
          <p className="text-red-300 font-mono text-2xl font-semibold tracking-wider">{fmtTime(seconds)}</p>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all"
          >
            <Square className="w-4 h-4" /> Stop recording
          </button>
        </div>
      </div>
    );
  }

  if (recState === "recorded") {
    return (
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Voice Recording</p>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-600/30 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Recording ready</p>
            <p className="text-xs text-white/40 mt-0.5">{fmtTime(seconds)} · {(fileSize / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={reset}
            disabled={loading}
            className="text-xs text-white/30 hover:text-white transition-colors shrink-0"
          >
            Re-record
          </button>
        </div>
        <p className="mt-2 text-xs text-white/25">Click &quot;Generate content&quot; below to transcribe and create your content.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Voice Recording</p>
      <button
        type="button"
        onClick={() => void startRecording()}
        disabled={loading}
        className="w-full flex flex-col items-center gap-3 py-10 rounded-xl border-2 border-dashed border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all disabled:opacity-50"
      >
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
          <Mic className="w-6 h-6 text-white/40" />
        </div>
        <div className="text-center">
          <p className="text-sm text-white/60 font-medium">Click to start recording</p>
          <p className="text-xs text-white/25 mt-1">Speak your ideas — we&apos;ll transcribe and generate 5 formats</p>
        </div>
      </button>
    </div>
  );
}

// ── Batch Input ───────────────────────────────────────────────────────────────

const MULTI_LANG_EXTRA_MAX = 2;

interface BatchInputProps {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly loading: boolean;
  readonly parsedCount: number;
  readonly batchLimit: number;
  readonly plan: Plan;
  readonly primaryLanguage: Language;
  readonly extraLanguages: Language[];
  readonly onExtraLanguagesChange: (langs: Language[]) => void;
}

function BatchInput({
  value, onChange, loading, parsedCount, batchLimit,
  plan, primaryLanguage, extraLanguages, onExtraLanguagesChange,
}: BatchInputProps) {
  const locked = batchLimit === 0;
  const isPro  = plan === "pro";

  function toggleLang(lang: Language) {
    if (lang === primaryLanguage) return;
    if (extraLanguages.includes(lang)) {
      onExtraLanguagesChange(extraLanguages.filter((l) => l !== lang));
    } else if (extraLanguages.length < MULTI_LANG_EXTRA_MAX) {
      onExtraLanguagesChange([...extraLanguages, lang]);
    }
  }

  const totalJobs = parsedCount * (1 + extraLanguages.length);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">YouTube URLs</p>
        {locked ? (
          <div className="flex flex-col items-center gap-3 py-8 rounded-xl border border-white/8 bg-white/2 text-center">
            <Layers className="w-6 h-6 text-white/20" />
            <p className="text-sm text-white/40">Batch processing requires a Starter or Pro plan.</p>
            <Link href="/upgrade" className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors">
              Upgrade to Starter — $19/mo →
            </Link>
          </div>
        ) : (
          <>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={loading}
              rows={6}
              placeholder={"https://youtube.com/watch?v=xxx\nhttps://youtu.be/yyy\nhttps://youtube.com/watch?v=zzz"}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/60 transition-all disabled:opacity-50 text-sm font-mono resize-none"
            />
            <p className="mt-2 text-xs text-white/25">
              One URL per line · {parsedCount} valid URL{parsedCount === 1 ? "" : "s"} · max {batchLimit} per batch
            </p>
          </>
        )}
      </div>

      {/* Multi-language — Pro only */}
      {!locked && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Multi-language output</p>
            {isPro
              ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-semibold">Pro</span>
              : <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">Pro only</span>
            }
          </div>
          {isPro ? (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                {LANGUAGES.map((l) => {
                  const isPrimary = l.code === primaryLanguage;
                  const selected  = isPrimary || extraLanguages.includes(l.code);
                  const disabled  = !selected && extraLanguages.length >= MULTI_LANG_EXTRA_MAX;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => toggleLang(l.code)}
                      disabled={disabled || loading || isPrimary}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isPrimary
                          ? "bg-amber-600/20 border border-amber-500/30 text-amber-300 cursor-default"
                          : selected
                          ? "bg-amber-600/20 border border-amber-500/40 text-amber-200"
                          : "bg-white/3 border border-white/8 text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                      }`}
                    >
                      <span>{l.flag}</span> {l.code}
                      {isPrimary && <span className="text-white/30 ml-auto">primary</span>}
                    </button>
                  );
                })}
              </div>
              {extraLanguages.length > 0 && parsedCount > 0 && (
                <p className="mt-2 text-xs text-amber-300/70">
                  {parsedCount} URL{parsedCount !== 1 ? "s" : ""} × {1 + extraLanguages.length} languages = <span className="font-semibold">{totalJobs} jobs</span>
                </p>
              )}
              <p className="mt-1 text-xs text-white/25">Primary language always included. Add up to {MULTI_LANG_EXTRA_MAX} more.</p>
            </>
          ) : (
            <div className="px-3 py-2.5 rounded-xl bg-white/3 border border-white/8 text-xs text-white/30 flex items-center justify-between">
              Generate the same content in multiple languages at once
              <Link href="/billing" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors ml-2 shrink-0">Upgrade →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tone Selector ─────────────────────────────────────────────────────────────

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
                  ? "bg-amber-600/20 border-amber-500/40 text-amber-300"
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

// ── Audio Drop Zone ───────────────────────────────────────────────────────────

interface AudioDropZoneProps {
  readonly file: File | null;
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onOpen: () => void;
  readonly loading: boolean;
}

function AudioDropZone({ file, inputRef, onChange, onOpen, loading }: AudioDropZoneProps) {
  const tooLarge  = file !== null && file.size > MAX_AUDIO_BYTES;
  const dropClass = file ? "border-amber-500/40 bg-amber-500/5" : "border-white/10 hover:border-white/20 hover:bg-white/3";
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
              {(file.size / 1024 / 1024).toFixed(1)} MB{tooLarge ? " — too large (max 25 MB)" : ""}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-white/50">Click to select or drag and drop</p>
            <p className="text-xs text-white/25">MP3, M4A, WAV, OGG, FLAC, WebM · max 25 MB</p>
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
      {file && file.size <= MAX_AUDIO_BYTES && (
        <p className="mt-2 text-xs text-white/25">Audio will be transcribed with Whisper, then 5 formats generated.</p>
      )}
    </div>
  );
}

// ── SEO Toggle ────────────────────────────────────────────────────────────────

interface SeoToggleProps {
  readonly checked: boolean;
  readonly onToggle: () => void;
  readonly disabled: boolean;
}

function SeoToggle({ checked, onToggle, disabled }: SeoToggleProps) {
  const desc       = checked ? "Blog will include focus keyword, meta description & FAQ" : "Adds SEO structure to the blog post only";
  const trackClass = checked ? "bg-amber-600" : "bg-white/10";
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

// ── Output Preview ────────────────────────────────────────────────────────────

function OutputPreview() {
  return (
    <div>
      <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">What you&apos;ll get</p>
      <div className="grid grid-cols-2 gap-3">
        {OUTPUT_TYPES.map((t) => (
          <div key={t.label} className="glass rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-900/50 flex items-center justify-center shrink-0 mt-0.5">
              <t.icon className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/80">{t.label}</p>
              <p className="text-xs text-white/35 mt-0.5">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/15 flex items-center gap-2">
        <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-300">Results are ready in ~30 seconds. You&apos;ll be taken there automatically.</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SUBTITLES: Record<InputMode, string> = {
  youtube: "Paste a YouTube URL — we'll generate 5 content formats in ~30s.",
  audio:   "Upload an audio file — we'll transcribe and generate 5 content formats.",
  voice:   "Record your voice — speak your ideas, we'll transcribe and generate 5 formats.",
  batch:   "Paste multiple YouTube URLs — we'll process them all in the background.",
};

const SUBMIT_LABELS: Record<InputMode, string> = {
  youtube: "Submitting job…",
  audio:   "Transcribing…",
  voice:   "Transcribing…",
  batch:   "Queueing batch…",
};

export default function NewPage() {
  const router       = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode]     = useState<InputMode>("youtube");
  const [url, setUrl]                 = useState("");
  const [videoPreview, setVideoPreview] = useState<{ title: string; channel: string; thumbnail: string } | null | "loading">(null);
  const [audioFile, setAudioFile]     = useState<File | null>(null);
  const [voiceFile, setVoiceFile]     = useState<File | null>(null);
  const [batchUrls, setBatchUrls]     = useState("");
  const [extraLangs, setExtraLangs]   = useState<Language[]>([]);
  const [tone, setTone]               = useState<ToneStyle>("professional");
  const [styleHint, setStyleHint]     = useState("");
  const [language, setLanguage]       = useState<Language>("English");
  const [seoMode, setSeoMode]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [userPlan, setUserPlan]       = useState<Plan>("free");

  useEffect(() => {
    if (!isYouTubeUrl(url)) { setVideoPreview(null); return; }
    setVideoPreview("loading");
    const t = setTimeout(() => {
      fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
        .then((r) => r.ok ? r.json() : null)
        .then((d: { title?: string; author_name?: string; thumbnail_url?: string } | null) => {
          if (d?.title) setVideoPreview({ title: d.title, channel: d.author_name ?? "", thumbnail: d.thumbnail_url ?? "" });
          else setVideoPreview(null);
        })
        .catch(() => setVideoPreview(null));
    }, 500);
    return () => clearTimeout(t);
  }, [url]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { creditsLeft: cl, plan } = await loadUserData(user.id);
      setCreditsLeft(cl);
      setUserPlan(plan);
    }
    void init();
  }, []);

  function switchMode(mode: InputMode) {
    setInputMode(mode);
    setError("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAudioFile(e.target.files?.[0] ?? null);
    setError("");
  }

  function handleSubmit() {
    setLoading(true);
    setError("");

    if (inputMode === "batch") {
      submitBatchJob(parsedBatchUrls, tone, language, seoMode, extraLangs)
        .then(() => router.push("/history"))
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setLoading(false);
        });
      return;
    }

    const fileForAudio = inputMode === "voice" ? voiceFile! : audioFile!;
    const job = inputMode === "youtube"
      ? submitYouTubeJob(url, tone, language, seoMode, styleHint)
      : submitAudioJob(fileForAudio, tone, language, seoMode, styleHint);

    job
      .then((jobId) => router.push(`/jobs/${jobId}`))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });
  }

  const batchLimit      = BATCH_LIMITS[userPlan];
  const parsedBatchUrls = batchUrls.split("\n").map((s) => s.trim()).filter(isYouTubeUrl);
  const selectedLang    = LANGUAGES.find((l) => l.code === language);

  let canSubmit = false;
  if (inputMode === "batch")        canSubmit = parsedBatchUrls.length > 0 && batchLimit > 0;
  else if (inputMode === "youtube") canSubmit = isYouTubeUrl(url);
  else if (inputMode === "audio")   canSubmit = audioFile !== null && audioFile.size <= MAX_AUDIO_BYTES;
  else                              canSubmit = voiceFile !== null;

  function tabClass(mode: InputMode) {
    return inputMode === mode
      ? "bg-amber-600 text-white shadow"
      : "text-white/40 hover:text-white/70";
  }

  return (
    <div className="p-8 max-w-2xl animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New content</h1>
        <p className="text-white/40 mt-1">{SUBTITLES[inputMode]}</p>
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
        {/* Tab bar */}
        <div className="grid grid-cols-4 gap-1 p-1 glass rounded-xl mb-6">
          <button type="button" onClick={() => switchMode("youtube")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tabClass("youtube")}`}>
            <div className="w-4 h-4 rounded bg-red-600 flex items-center justify-center shrink-0">
              <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-white ml-px" />
            </div>
            YouTube
          </button>
          <button type="button" onClick={() => switchMode("audio")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tabClass("audio")}`}>
            <Upload className="w-4 h-4" /> Upload
          </button>
          <button type="button" onClick={() => switchMode("voice")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tabClass("voice")}`}>
            <Radio className="w-4 h-4" /> Voice
          </button>
          <button type="button" onClick={() => switchMode("batch")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tabClass("batch")}`}>
            <Layers className="w-4 h-4" /> Batch
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {inputMode === "youtube" && (
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
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/25 focus:outline-none focus:border-amber-500/60 transition-all disabled:opacity-50 text-sm"
                  placeholder="https://youtube.com/watch?v=..."
                />
                {isYouTubeUrl(url) && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400" />}
              </div>
              <p className="mt-2 text-xs text-white/25">Requires a video with auto-generated or manual captions.</p>
              {videoPreview === "loading" && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6 animate-pulse">
                  <div className="w-16 h-10 rounded-lg bg-white/8 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/8 rounded w-3/4" />
                    <div className="h-2.5 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              )}
              {videoPreview && videoPreview !== "loading" && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-amber-500/15 transition-all">
                  {videoPreview.thumbnail && (
                    <img
                      src={videoPreview.thumbnail}
                      alt=""
                      className="w-16 h-10 rounded-lg object-cover shrink-0 bg-white/5"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">{videoPreview.title}</p>
                    <p className="text-xs text-white/35 truncate mt-0.5">{videoPreview.channel}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                </div>
              )}
            </div>
          )}

          {inputMode === "audio" && (
            <AudioDropZone
              file={audioFile}
              inputRef={fileInputRef}
              onChange={handleFileChange}
              onOpen={() => fileInputRef.current?.click()}
              loading={loading}
            />
          )}

          {inputMode === "voice" && (
            <VoiceRecorder onFileReady={setVoiceFile} loading={loading} />
          )}

          {inputMode === "batch" && (
            <BatchInput
              value={batchUrls}
              onChange={setBatchUrls}
              loading={loading}
              parsedCount={parsedBatchUrls.length}
              batchLimit={batchLimit}
              plan={userPlan}
              primaryLanguage={language}
              extraLanguages={extraLangs}
              onExtraLanguagesChange={setExtraLangs}
            />
          )}

          <ToneSelector value={tone} onChange={setTone} disabled={loading} />

            {/* Style presets */}
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Style preset <span className="text-white/25 font-normal normal-case tracking-normal">(optional)</span></p>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      if (styleHint === p.hint) { setStyleHint(""); }
                      else { setTone(p.tone); setStyleHint(p.hint); }
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all disabled:opacity-40 ${
                      styleHint === p.hint
                        ? "bg-amber-600/20 border-amber-500/40 text-amber-300"
                        : "bg-white/3 border-white/8 text-white/40 hover:text-white/70 hover:bg-white/6 hover:border-white/15"
                    }`}
                  >
                    <span className="text-base shrink-0">{p.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{p.label}</p>
                      <p className="text-xs opacity-60 truncate">{p.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Output language</p>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                disabled={loading}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-amber-500/60 transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#161310]">{l.flag} {l.code}</option>
                ))}
              </select>
            </div>
            {language !== "English" && (
              <p className="mt-2 text-xs text-amber-300/70">
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
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> {SUBMIT_LABELS[inputMode]}</>
              : <><Zap className="w-5 h-5" /> Generate content</>}
          </button>
        </form>
      </div>

      <OutputPreview />
    </div>
  );
}
