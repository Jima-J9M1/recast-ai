"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

interface Props {
  initialName: string;
  email: string;
}

export function ProfileForm({ initialName, email }: Readonly<Props>) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const initial = (name || email || "U")[0].toUpperCase();
  const isDirty = name.trim() !== initialName;

  async function handleSave() {
    if (!name.trim()) { setError("Name cannot be empty."); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: name }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json() as { error?: string };
      setError(json.error ?? "Failed to save.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-5">Profile</h2>

      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-amber-700 flex items-center justify-center text-xl font-bold text-white shrink-0">
          {initial}
        </div>

        <div className="flex-1 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="full-name" className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Display name
            </label>
            <input
              id="full-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); setSaved(false); }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/25 focus:outline-none focus:border-amber-500/60 transition-all text-sm"
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Email
            </label>
            <p className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-white/40 text-sm">
              {email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleSave()}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : saved ? (
                <><Check className="w-4 h-4 text-emerald-400" /> Saved</>
              ) : (
                "Save changes"
              )}
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
