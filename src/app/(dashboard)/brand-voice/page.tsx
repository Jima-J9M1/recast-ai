"use client";

import { useEffect, useState, useCallback } from "react";
import { Mic2, Save, Loader2, CheckCircle2 } from "lucide-react";

interface BrandVoice {
  persona: string;
  audience: string;
  style_notes: string;
  key_phrases: string;
  avoid_phrases: string;
}

const EMPTY: BrandVoice = {
  persona: "",
  audience: "",
  style_notes: "",
  key_phrases: "",
  avoid_phrases: "",
};

const FIELDS: { key: keyof BrandVoice; label: string; hint: string; rows: number }[] = [
  {
    key: "persona",
    label: "Brand persona",
    hint: 'Who is writing? e.g. "A pragmatic tech founder who values clarity over hype"',
    rows: 2,
  },
  {
    key: "audience",
    label: "Target audience",
    hint: 'Who are you writing for? e.g. "Early-stage SaaS founders, 30-45, technical background"',
    rows: 2,
  },
  {
    key: "style_notes",
    label: "Writing style & rules",
    hint: 'e.g. "Use short sentences. No buzzwords. Always cite examples. First-person is fine."',
    rows: 3,
  },
  {
    key: "key_phrases",
    label: "Key phrases to include",
    hint: 'Comma-separated. e.g. "leverage, iterate, ship fast, customer obsession"',
    rows: 2,
  },
  {
    key: "avoid_phrases",
    label: "Phrases to avoid",
    hint: 'Comma-separated. e.g. "synergy, disruptive, game-changer, unlock"',
    rows: 2,
  },
];

export default function BrandVoicePage() {
  const [voice, setVoice] = useState<BrandVoice>(EMPTY);
  const [saved, setSaved] = useState<BrandVoice>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    fetch("/api/brand-voice")
      .then((r) => r.json() as Promise<{ brand_voice: BrandVoice | null }>)
      .then(({ brand_voice }) => {
        const v = brand_voice ?? EMPTY;
        setVoice(v);
        setSaved(v);
      })
      .finally(() => setLoading(false));
  }, []);

  const isDirty = JSON.stringify(voice) !== JSON.stringify(saved);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const res = await fetch("/api/brand-voice", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voice),
    });
    if (res.ok) {
      setSaved(voice);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    }
    setSaving(false);
  }, [voice]);

  const hasAnyContent = Object.values(voice).some((v) => v.trim());

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl animate-fade-in-up">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Mic2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Brand Voice</h1>
            <p className="text-white/40 text-sm mt-0.5">Applied automatically to every piece of content you generate</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-all disabled:opacity-40 shrink-0"
        >
          {savedOk ? (
            <><CheckCircle2 className="w-4 h-4 text-emerald-300" /> Saved</>
          ) : saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : (
            <><Save className="w-4 h-4" /> Save</>
          )}
        </button>
      </div>

      {!hasAnyContent && (
        <div className="mt-4 mb-6 px-4 py-3 rounded-xl bg-violet-500/8 border border-violet-500/15 text-sm text-violet-300/70">
          Fill in at least one field — your brand voice will be injected into every generation prompt automatically.
        </div>
      )}

      <div className="mt-6 space-y-5">
        {FIELDS.map(({ key, label, hint, rows }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-white/70 mb-1.5">{label}</label>
            <textarea
              value={voice[key]}
              onChange={(e) => setVoice((prev) => ({ ...prev, [key]: e.target.value }))}
              rows={rows}
              placeholder={hint}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-violet-500/60 transition-all resize-none"
            />
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-white/20 leading-relaxed">
        Your brand voice is appended to the AI prompt on every generation. Leave fields blank to skip them.
        Changes apply to new generations only — use Regenerate on existing content to apply the updated voice.
      </p>
    </div>
  );
}
