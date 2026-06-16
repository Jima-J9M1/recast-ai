"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, X, Zap, Mic2, PlusCircle, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "recastai_onboarding_dismissed_v2";

interface Props {
  completedJobs: number;
  hasBrandVoice: boolean;
  hasStarred: boolean;
  plan: string;
  firstName: string;
}

export function OnboardingChecklist({ completedJobs, hasBrandVoice, hasStarred, plan, firstName }: Readonly<Props>) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const steps = [
    {
      icon: CheckCircle2,
      label: "Create your account",
      description: "You're in.",
      done: true,
      href: null,
    },
    {
      icon: Mic2,
      label: "Set up your brand voice",
      description: "Tell the AI who you are — once, and it applies everywhere.",
      done: hasBrandVoice,
      href: "/brand-voice",
    },
    {
      icon: PlusCircle,
      label: "Generate your first content",
      description: "Paste a YouTube URL or upload an audio file.",
      done: completedJobs > 0,
      href: "/new",
    },
    {
      icon: Star,
      label: "Save an output to your library",
      description: "Hit ★ on any output to keep it for later.",
      done: hasStarred,
      href: completedJobs > 0 ? "/history" : "/new",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const nextStep = steps.find((s) => !s.done);

  if (dismissed || allDone) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="rounded-2xl mb-6 overflow-hidden border border-amber-500/15" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-white/5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-1">Getting started</p>
          <h3 className="text-white font-bold text-lg">
            {completedCount === 0
              ? `Welcome, ${firstName} — let's get you set up`
              : completedCount === 1
              ? "One down. Here's what's next."
              : `${completedCount} of ${steps.length} steps done — almost there.`}
          </h3>
          {nextStep && (
            <p className="text-white/40 text-sm mt-1">{nextStep.description}</p>
          )}
        </div>
        <button
          onClick={dismiss}
          className="text-white/20 hover:text-white/50 transition-colors shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Steps */}
      <div className="px-6 py-4 space-y-1">
        {steps.map((step) => (
          <div
            key={step.label}
            className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all ${
              !step.done && step === nextStep ? "bg-amber-500/5 border border-amber-500/10" : ""
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Circle className={`w-4 h-4 shrink-0 ${step === nextStep ? "text-amber-400" : "text-white/15"}`} />
            )}

            <span className={`text-sm flex-1 ${step.done ? "text-white/30 line-through" : step === nextStep ? "text-white/80 font-medium" : "text-white/40"}`}>
              {step.label}
            </span>

            {!step.done && step.href && (
              <Link
                href={step.href}
                className={`flex items-center gap-1 text-xs font-semibold transition-colors shrink-0 ${
                  step === nextStep ? "text-amber-400 hover:text-amber-300" : "text-white/25 hover:text-white/50"
                }`}
              >
                {step === nextStep ? "Do this" : "Start"} <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Progress footer */}
      <div className="px-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-700"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-white/30 shrink-0">{completedCount}/{steps.length}</span>
        </div>
        {plan === "free" && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-white/30">On the free plan · 3 videos/month</p>
            <Link
              href="/upgrade"
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              <Zap className="w-3 h-3" /> Upgrade for more
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
