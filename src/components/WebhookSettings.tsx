"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, Link2, Check } from "lucide-react";

interface Webhook {
  id: string;
  url: string;
  secret: string | null;
  active: boolean;
  created_at: string;
}

export function WebhookSettings() {
  const [webhooks, setWebhooks]   = useState<Webhook[]>([]);
  const [loading, setLoading]     = useState(true);
  const [url, setUrl]             = useState("");
  const [secret, setSecret]       = useState("");
  const [adding, setAdding]       = useState(false);
  const [error, setError]         = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [tested, setTested]       = useState<string | null>(null);

  const load = useCallback(async () => {
    const res  = await fetch("/api/webhooks");
    const data = await res.json() as { webhooks: Webhook[] };
    setWebhooks(data.webhooks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function add() {
    setAdding(true); setError("");
    const res  = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), secret: secret.trim() || undefined }),
    });
    const data = await res.json() as { webhook?: Webhook; error?: string };
    if (!res.ok) { setError(data.error ?? "Failed to add webhook."); setAdding(false); return; }
    setWebhooks((prev) => [data.webhook!, ...prev]);
    setUrl(""); setSecret(""); setShowForm(false);
    setAdding(false);
  }

  async function remove(id: string) {
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }

  async function toggleActive(id: string, active: boolean) {
    const res  = await fetch(`/api/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    const data = await res.json() as { webhook?: Webhook };
    if (data.webhook) setWebhooks((prev) => prev.map((w) => w.id === id ? data.webhook! : w));
  }

  async function testWebhook(id: string, hookUrl: string) {
    const payload = JSON.stringify({ event: "test", message: "Webhook test from RecastAI", timestamp: new Date().toISOString() });
    try {
      await fetch(hookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
    } catch { /* ignore CORS */ }
    setTested(id);
    setTimeout(() => setTested(null), 2500);
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Webhooks</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-300 text-xs font-medium hover:bg-violet-600/30 transition-all">
            <Plus className="w-3.5 h-3.5" /> Add webhook
          </button>
        )}
      </div>

      <p className="text-xs text-white/30 mb-4">
        RecastAI will POST to these URLs when a job completes. Include an optional secret to verify the payload.
      </p>

      {showForm && (
        <div className="mb-5 p-4 rounded-xl bg-white/3 border border-white/8 space-y-3">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Endpoint URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Secret (optional)</label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Sent as X-RecastAI-Secret header"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => void add()} disabled={adding || !url.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 transition-all disabled:opacity-40">
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {adding ? "Adding…" : "Add"}
            </button>
            <button onClick={() => { setShowForm(false); setError(""); }} className="px-4 py-2 rounded-lg glass text-white/40 text-xs hover:text-white transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-16">
          <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="flex items-center gap-2 py-6 text-center justify-center">
          <Link2 className="w-4 h-4 text-white/15" />
          <p className="text-xs text-white/25">No webhooks configured.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
              <div className={`w-2 h-2 rounded-full shrink-0 ${wh.active ? "bg-emerald-400" : "bg-white/15"}`} />
              <p className="flex-1 text-xs text-white/60 truncate font-mono">{wh.url}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => void testWebhook(wh.id, wh.url)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${tested === wh.id ? "text-emerald-400" : "text-white/30 hover:text-white"}`}>
                  {tested === wh.id ? <><Check className="w-3 h-3" /> Sent</> : "Test"}
                </button>
                <button onClick={() => void toggleActive(wh.id, wh.active)}
                  className="px-2 py-1 rounded text-xs text-white/30 hover:text-white transition-all">
                  {wh.active ? "Disable" : "Enable"}
                </button>
                <button onClick={() => void remove(wh.id)}
                  className="p-1 rounded text-white/20 hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
