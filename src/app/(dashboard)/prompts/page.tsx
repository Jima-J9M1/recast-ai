"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Hash, Briefcase, Mail, Save, RotateCcw, Lock, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_PROMPTS, type ContentFormat } from "@/lib/prompts";

const FORMATS: { type: ContentFormat; label: string; icon: typeof FileText; desc: string }[] = [
  { type: "blog", label: "Blog Post", icon: FileText, desc: "Long-form SEO article" },
  { type: "twitter_thread", label: "Twitter Thread", icon: Hash, desc: "Viral thread format" },
  { type: "linkedin", label: "LinkedIn Post", icon: Briefcase, desc: "Professional post" },
  { type: "newsletter", label: "Newsletter", icon: Mail, desc: "Email newsletter" },
];

const HINT = "Available variables: {transcript} (required), {tone} (optional)";

interface SaveState {
  saving: boolean;
  saved: boolean;
  error: string;
}

export default function PromptsPage() {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [activeFormat, setActiveFormat] = useState<ContentFormat>("blog");
  const [drafts, setDrafts] = useState<Partial<Record<ContentFormat, string>>>({});
  const [saved, setSaved] = useState<Partial<Record<ContentFormat, string>>>({});
  const [saveState, setSaveState] = useState<SaveState>({ saving: false, saved: false, error: "" });

  const loadTemplates = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .single();
    setIsPro(profile?.plan === "pro" || profile?.plan === "starter");

    const res = await fetch("/api/prompt-templates");
    const json = await res.json() as { templates: { format: ContentFormat; prompt: string }[] };
    const map: Partial<Record<ContentFormat, string>> = {};
    for (const t of json.templates ?? []) map[t.format] = t.prompt;
    setSaved(map);
    setDrafts(map);
  }, []);

  useEffect(() => { void loadTemplates(); }, [loadTemplates]);

  const activeDefault = DEFAULT_PROMPTS[activeFormat];
  const activeDraft = drafts[activeFormat] ?? "";
  const activeSaved = saved[activeFormat] ?? "";
  const isDirty = activeDraft !== activeSaved;
  const isCustom = !!activeSaved;

  function setDraft(val: string) {
    setDrafts((d) => ({ ...d, [activeFormat]: val }));
    setSaveState({ saving: false, saved: false, error: "" });
  }

  async function handleSave() {
    if (!activeDraft.includes("{transcript}")) {
      setSaveState({ saving: false, saved: false, error: "Prompt must include the {transcript} variable." });
      return;
    }
    setSaveState({ saving: true, saved: false, error: "" });
    const res = await fetch("/api/prompt-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: activeFormat, prompt: activeDraft }),
    });
    const json = await res.json() as { error?: string };
    if (!res.ok) {
      setSaveState({ saving: false, saved: false, error: json.error ?? "Failed to save." });
      return;
    }
    setSaved((s) => ({ ...s, [activeFormat]: activeDraft }));
    setSaveState({ saving: false, saved: true, error: "" });
    setTimeout(() => setSaveState((s) => ({ ...s, saved: false })), 2500);
  }

  async function handleReset() {
    await fetch("/api/prompt-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: activeFormat, prompt: null }),
    });
    setSaved((s) => { const n = { ...s }; delete n[activeFormat]; return n; });
    setDrafts((d) => { const n = { ...d }; delete n[activeFormat]; return n; });
    setSaveState({ saving: false, saved: false, error: "" });
  }

  if (isPro === null) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Custom prompts</h1>
        <p className="text-white/40 mt-1">
          Override the AI instructions for each content format.{" "}
          <span className="text-amber-400 font-medium">Starter &amp; Pro.</span>
        </p>
      </div>

      {!isPro && (
        <div className="glass rounded-2xl p-8 border border-amber-500/20 mb-8 flex items-start gap-5">
          <div className="w-10 h-10 rounded-xl bg-amber-900/50 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold mb-1">Starter &amp; Pro feature</p>
            <p className="text-white/50 text-sm mb-4">
              Custom prompts let you control exactly how the AI writes each format — match your brand voice,
              add your own structure, or inject instructions the default prompt doesn&apos;t have.
            </p>
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 transition-all shadow-lg shadow-amber-900/30"
            >
              Upgrade to Starter — $19/mo
            </Link>
          </div>
        </div>
      )}

      <div className={`${isPro ? "" : "opacity-50 pointer-events-none select-none"}`}>
        {/* Format tabs */}
        <div className="flex gap-1.5 mb-6 p-1 glass rounded-xl w-fit">
          {FORMATS.map((f) => {
            const active = activeFormat === f.type;
            const hasCustom = !!saved[f.type];
            return (
              <button
                key={f.type}
                onClick={() => {
                  setActiveFormat(f.type);
                  setSaveState({ saving: false, saved: false, error: "" });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-900/40"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
                {hasCustom && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Editor card */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">
                {isCustom ? "Custom prompt active" : "Using default prompt"}
              </span>
              {isCustom && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-300 border border-amber-500/20">
                  custom
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isCustom && (
                <button
                  onClick={() => void handleReset()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/40 hover:text-white text-xs transition-all hover:bg-white/5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to default
                </button>
              )}
              <button
                onClick={() => void handleSave()}
                disabled={!isDirty || saveState.saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 text-white hover:bg-amber-500"
              >
                {saveState.saving && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>}
                {saveState.saved && <><Check className="w-3.5 h-3.5 text-emerald-400" /> Saved</>}
                {!saveState.saving && !saveState.saved && <><Save className="w-3.5 h-3.5" /> Save</>}
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="p-6">
            <textarea
              value={activeDraft || activeDefault}
              onChange={(e) => setDraft(e.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full bg-transparent text-sm text-white/80 font-mono leading-relaxed resize-none focus:outline-none placeholder-white/20"
              placeholder={activeDefault}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/5">
            <p className="text-xs text-white/25">{HINT}</p>
            {saveState.error && (
              <p className="text-xs text-red-400">{saveState.error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
