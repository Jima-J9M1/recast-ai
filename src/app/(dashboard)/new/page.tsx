"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, Loader2, Zap } from "lucide-react";

function isYouTubeUrl(url: string) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url);
}

export default function NewPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isYouTubeUrl(url)) {
      setError("Please enter a valid YouTube URL.");
      return;
    }

    setLoading(true);
    setError("");
    setStage("Fetching transcript...");

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      setStage("Done!");
      router.push(`/jobs/${data.jobId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      setStage("");
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New content</h1>
        <p className="text-white/50 mt-1">Paste a YouTube URL below and we&apos;ll do the rest.</p>
      </div>

      <div className="glass rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-white/70 mb-3">YouTube URL</label>
            <div className="relative">
              <Film className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <p className="mt-2 text-xs text-white/30">
              Works with any YouTube video that has captions/subtitles.
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-sm text-purple-300">{stage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !url}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            {loading ? "Processing..." : "Generate content"}
          </button>
        </form>

        {/* What you'll get */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-xs text-white/40 mb-4 uppercase tracking-widest">You&apos;ll receive</p>
          <div className="grid grid-cols-2 gap-3">
            {["Blog post", "Twitter thread", "LinkedIn post", "Newsletter"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-white/60">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
