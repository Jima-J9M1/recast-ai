"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check, Users, Gift, Zap } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-900/30"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

export default function InvitePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", user.id);
      setReferralCount(count ?? 0);
    }
    void load();
  }, []);

  const referralLink = userId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${userId.slice(0, 8)}`
    : "";

  return (
    <div className="p-8 max-w-2xl animate-fade-in-up">
      <div className="mb-8">
        <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-2">Referrals</p>
        <h1 className="text-2xl font-bold text-white mb-2">Invite creators, earn videos</h1>
        <p className="text-white/40">
          Share your link. Every friend who signs up gives you both 3 bonus videos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-amber-900/40 flex items-center justify-center mb-3">
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">{referralCount}</p>
          <p className="text-xs text-white/40 mt-1">Friends referred</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-900/30 flex items-center justify-center mb-3">
            <Gift className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{referralCount * 3}</p>
          <p className="text-xs text-white/40 mt-1">Bonus videos earned</p>
        </div>
      </div>

      {/* Link card */}
      <div className="glass rounded-2xl p-6 mb-6">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Your referral link</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white/60 font-mono truncate">
            {referralLink || "Loading…"}
          </div>
          {referralLink && <CopyButton text={referralLink} />}
        </div>
      </div>

      {/* How it works */}
      <div className="glass rounded-2xl p-6">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-5">How it works</p>
        <div className="space-y-4">
          {[
            { icon: Copy,  step: "1", text: "Copy your unique referral link above" },
            { icon: Users, step: "2", text: "Share it with fellow creators — Twitter, email, DMs" },
            { icon: Zap,   step: "3", text: "When they sign up and create their first content, you both get 3 bonus videos" },
          ].map(({ icon: Icon, step, text }) => (
            <div key={step} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-amber-600/20 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-amber-400">{step}</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
