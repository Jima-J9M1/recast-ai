"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import { Search, X } from "lucide-react";
import { LANGUAGES } from "@/types";

const STATUSES = [
  { value: "", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "transcribing,generating", label: "Processing" },
];

const TONES = [
  { value: "", label: "Any tone" },
  { value: "professional", label: "💼 Professional" },
  { value: "casual", label: "☕ Casual" },
  { value: "storytelling", label: "📖 Storytelling" },
  { value: "educational", label: "🎓 Educational" },
  { value: "humorous", label: "😄 Humorous" },
];

export function HistoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const tone = searchParams.get("tone") ?? "";
  const language = searchParams.get("language") ?? "";

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const onSearchChange = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update("q", value), 350);
  }, [update]);

  const hasFilters = q || status || tone || language;

  return (
    <div className="space-y-4 mb-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          type="text"
          defaultValue={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title or URL…"
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-all text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 p-1 glass rounded-xl">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => update("status", s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                status === s.value
                  ? "bg-violet-600 text-white"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <select
          value={tone}
          onChange={(e) => update("tone", e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-white/60 text-xs focus:outline-none focus:border-violet-500/60 transition-all appearance-none cursor-pointer"
        >
          {TONES.map((t) => (
            <option key={t.value} value={t.value} className="bg-[#0d0d1a]">{t.label}</option>
          ))}
        </select>

        <select
          value={language}
          onChange={(e) => update("language", e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-white/60 text-xs focus:outline-none focus:border-violet-500/60 transition-all appearance-none cursor-pointer"
        >
          <option value="" className="bg-[#0d0d1a]">Any language</option>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-[#0d0d1a]">{l.flag} {l.code}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
