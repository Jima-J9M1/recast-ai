"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, X, Zap } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "recastai_onboarding_dismissed";

interface Props {
  completedJobs: number;
  plan: string;
}

export function OnboardingChecklist({ completedJobs, plan }: Readonly<Props>) {
  const [dismissed, setDismissed] = useState(true); // avoid hydration flash

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const steps = [
    { label: "Create your account", done: true, href: null },
    { label: "Generate your first content", done: completedJobs > 0, href: "/new" },
    { label: "Upgrade for unlimited access", done: plan !== "free", href: "/upgrade" },
  ];

  const allDone = steps.every((s) => s.done);

  if (dismissed || allDone || plan !== "free") return null;

  const completedCount = steps.filter((s) => s.done).length;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="glass rounded-2xl p-5 mb-6 border border-violet-500/15">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-white">Getting started</p>
          <p className="text-xs text-white/40 mt-0.5">{completedCount} of {steps.length} steps complete</p>
        </div>
        <button
          onClick={dismiss}
          className="text-white/20 hover:text-white/50 transition-colors"
          aria-label="Dismiss onboarding"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-white/20 shrink-0" />
            )}
            {step.href && !step.done ? (
              <Link
                href={step.href}
                className="text-sm text-white/60 hover:text-violet-300 transition-colors flex-1"
              >
                {step.label}
              </Link>
            ) : (
              <span className={`text-sm flex-1 ${step.done ? "text-white/30 line-through" : "text-white/60"}`}>
                {step.label}
              </span>
            )}
            {i === steps.length - 1 && !step.done && (
              <Link
                href="/upgrade"
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors"
              >
                <Zap className="w-3 h-3" /> Upgrade →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
