"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Zap } from "lucide-react";
import type { Plan } from "@/types";

const PLAN_RANK: Record<Plan, number> = { free: 0, starter: 1, pro: 2 };
const PLAN_LABEL: Record<"starter" | "pro", string> = { starter: "Starter", pro: "Pro" };

interface UpgradeGateProps {
  userPlan: Plan;
  required: "starter" | "pro";
  feature: string;
  children: React.ReactNode;
  compact?: boolean;
}

export function UpgradeGate({ userPlan, required, feature, children, compact = false }: UpgradeGateProps) {
  const hasAccess = PLAN_RANK[userPlan] >= PLAN_RANK[required];
  const [popoverOpen, setPopoverOpen] = useState(false);

  if (hasAccess) return <>{children}</>;

  const label = PLAN_LABEL[required];
  const upgradeHref = `/upgrade?feature=${encodeURIComponent(feature)}`;

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setPopoverOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/30 hover:text-amber-400 text-xs transition-all hover:bg-white/5"
          title={`${feature} — ${label} plan`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download</span>
        </button>
        {popoverOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setPopoverOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 shadow-2xl z-20 p-4" style={{ background: "var(--surface-raised)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-900/40 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{feature}</p>
                  <p className="text-xs text-white/35">{label} plan</p>
                </div>
              </div>
              <Link
                href={upgradeHref}
                className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all"
              >
                <Zap className="w-3 h-3" />
                Upgrade to {label}
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="pointer-events-none select-none opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
        <div className="text-center px-6 py-8 max-w-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-900/50 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">{feature}</p>
          <p className="text-xs text-white/40 mb-5">Available on {label} plan and above</p>
          <Link
            href={upgradeHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-900/30"
          >
            <Zap className="w-4 h-4" />
            Upgrade to {label}
          </Link>
        </div>
      </div>
    </div>
  );
}
