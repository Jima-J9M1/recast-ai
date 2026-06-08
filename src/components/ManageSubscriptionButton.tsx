"use client";

import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/portal", { method: "POST" });
    const json = await res.json() as { url?: string; error?: string };
    setLoading(false);
    if (!res.ok || !json.url) {
      setError(json.error ?? "Could not open billing portal.");
      return;
    }
    window.location.href = json.url;
  }

  return (
    <div>
      <button
        onClick={() => void handleClick()}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 text-white text-sm font-semibold transition-all disabled:opacity-40"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</>
        ) : (
          <><ExternalLink className="w-4 h-4" /> Manage subscription</>
        )}
      </button>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
