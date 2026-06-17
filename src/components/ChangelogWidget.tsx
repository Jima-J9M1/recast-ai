"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";

const CHANGELOG = [
  { date: "Jun 2025", text: "Style presets — Direct & Bold, Newsletter Writer, and more" },
  { date: "Jun 2025", text: "Share page — public link for every job" },
  { date: "Jun 2025", text: "Inline editor — edit content without leaving the page" },
  { date: "Jun 2025", text: "YouTube preview — see thumbnail before generating" },
  { date: "Jun 2025", text: "Email notifications when your content is ready" },
  { date: "Jun 2025", text: "Live generation progress tracker" },
  { date: "Jun 2025", text: "Audio upload raised to 25 MB" },
];

const STORAGE_KEY = "recastai_changelog_seen_v1";

export function ChangelogWidget() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    setSeen(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setSeen(true);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs text-white/30 hover:text-white/70 transition-colors w-full rounded-xl hover:bg-white/5"
      >
        <Sparkles className="w-3.5 h-3.5" />
        What&apos;s new
        {!seen && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl border border-white/8 shadow-2xl z-50 overflow-hidden" style={{ background: "var(--surface-raised)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">What&apos;s new</p>
            <button onClick={dismiss} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="py-2 max-h-64 overflow-y-auto">
            {CHANGELOG.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/3 transition-colors">
                <span className="text-xs text-white/25 shrink-0 mt-0.5 w-16">{item.date}</span>
                <span className="text-xs text-white/65 leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
