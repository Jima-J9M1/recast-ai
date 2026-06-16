"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";

interface ChangePlanButtonProps {
  readonly targetPlan: "starter" | "pro";
  readonly label: string;
  readonly highlight?: boolean;
}

export function ChangePlanButton({ targetPlan, label, highlight }: ChangePlanButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClick() {
    setLoading(true);
    setError("");
    fetch("/api/change-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: targetPlan }),
    })
      .then((r) => r.json() as Promise<{ success?: boolean; error?: string }>)
      .then((data) => {
        if (data.success) {
          router.push("/settings?plan_updated=true");
        } else {
          setError(data.error ?? "Failed to change plan");
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Network error — please try again");
        setLoading(false);
      });
  }

  const btnClass = highlight
    ? "bg-amber-600 text-white hover:bg-amber-500"
    : "border border-white/20 text-white hover:bg-white/10";

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`w-full py-3 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${btnClass}`}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Switching plan…</>
          : <><Zap className="w-4 h-4" /> {label}</>}
      </button>
      {error && <p className="text-xs text-red-400 mt-2 text-center">{error}</p>}
    </div>
  );
}
