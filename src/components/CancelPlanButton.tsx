"use client";

import { useState } from "react";
import { Loader2, XCircle, RotateCcw } from "lucide-react";

interface Props {
  readonly cancelAtPeriodEnd: boolean;
  readonly periodEndDate: string;
}

export function CancelPlanButton({ cancelAtPeriodEnd, periodEndDate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleAction(resume: boolean) {
    setLoading(true);
    setError("");
    setShowConfirm(false);
    try {
      const res = await fetch("/api/cancel-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });
      const json = await res.json() as { success?: boolean; error?: string };
      if (json.success) {
        globalThis.location.reload();
      } else {
        setError(json.error ?? "Something went wrong");
        setLoading(false);
      }
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  if (cancelAtPeriodEnd) {
    return (
      <div className="pt-3 border-t border-white/5">
        <p className="text-sm text-amber-400 mb-3">
          Your subscription cancels on <span className="font-semibold">{periodEndDate}</span>. You keep access until then.
        </p>
        <button
          type="button"
          onClick={() => handleAction(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 text-white text-sm font-semibold transition-all disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Resume subscription
        </button>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="pt-3 border-t border-white/5">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-white/70 mb-4">
            Access continues until <span className="font-semibold text-white">{periodEndDate}</span>, then your subscription ends. Are you sure?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleAction(false)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-40"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Yes, cancel
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-all"
            >
              Keep subscription
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-3 border-t border-white/5">
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/8 hover:border-red-500/20 text-white/50 hover:text-red-400 text-sm font-medium transition-all"
      >
        <XCircle className="w-4 h-4" />
        Cancel subscription
      </button>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
