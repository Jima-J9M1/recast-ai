"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";

function JoinInner() {
  const params  = useSearchParams();
  const router  = useRouter();
  const token   = params.get("token") ?? "";
  const [status, setStatus]   = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("No invite token found."); return; }

    fetch("/api/team/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json() as Promise<{ ok?: boolean; teamName?: string; error?: string }>)
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setMessage(`You've joined ${data.teamName ?? "the team"}!`);
          setTimeout(() => router.push("/team"), 2000);
        } else {
          setStatus("error");
          setMessage(data.error ?? "Invalid or expired invite.");
        }
      })
      .catch(() => { setStatus("error"); setMessage("Something went wrong."); });
  }, [token, router]);

  return (
    <div className="glass rounded-2xl p-10 max-w-sm w-full text-center space-y-4">
      {status === "loading" && (
        <>
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
          <p className="text-white/60 text-sm">Joining team…</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-white font-semibold">{message}</p>
          <p className="text-white/40 text-xs">Redirecting to team page…</p>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
            <X className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-white font-semibold">Unable to join</p>
          <p className="text-white/40 text-sm">{message}</p>
          <a href="/dashboard" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Go to dashboard →</a>
        </>
      )}
    </div>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <Suspense fallback={
        <div className="glass rounded-2xl p-10 max-w-sm w-full text-center">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
        </div>
      }>
        <JoinInner />
      </Suspense>
    </div>
  );
}
