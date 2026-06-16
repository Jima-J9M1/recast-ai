"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";

export function NotificationSettings({ initialValue }: { initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    setEnabled(next);
    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_notifications: next }),
    });
    setSaving(false);
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-5">Notifications</h2>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${enabled ? "bg-amber-900/40" : "bg-white/5"}`}>
            {enabled
              ? <Bell className="w-4 h-4 text-amber-400" />
              : <BellOff className="w-4 h-4 text-white/30" />}
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Email when content is ready</p>
            <p className="text-xs text-white/35 mt-0.5">Get notified when a job finishes processing</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={saving}
          aria-pressed={enabled}
          className={`relative w-11 h-6 rounded-full transition-all disabled:opacity-50 shrink-0 ${enabled ? "bg-amber-600" : "bg-white/10"}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>
    </div>
  );
}
