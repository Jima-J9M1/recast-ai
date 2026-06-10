"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Crown, UserMinus, Link2, Copy, Check, Plus, Loader2,
  Trash2, Pencil, X, Clock, BarChart2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  jobs_this_month: number;
  users: { email: string | null; full_name: string | null } | null;
}

interface PendingInvite {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
}

interface Team {
  id: string;
  name: string;
  owner_id: string;
}

interface TeamData {
  team: Team | null;
  members: Member[];
  pending_invites: PendingInvite[];
  plan: string;
  seat_limit: number;
}

function CopyLink({ url }: Readonly<{ url: string }>) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/8">
      <p className="flex-1 text-xs text-white/50 truncate font-mono">{url}</p>
      <button
        onClick={() => void copy()}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copied ? "bg-emerald-600/20 text-emerald-400" : "bg-violet-600 text-white hover:bg-violet-500"}`}
      >
        {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
      </button>
    </div>
  );
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function TeamPage() {
  const [data, setData]             = useState<TeamData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [teamName, setTeamName]     = useState("");
  const [creating, setCreating]     = useState(false);
  const [inviteUrl, setInviteUrl]   = useState<string | null>(null);
  const [inviting, setInviting]     = useState(false);
  const [removing, setRemoving]     = useState<string | null>(null);
  const [revoking, setRevoking]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [joinToken, setJoinToken]   = useState("");
  const [joining, setJoining]       = useState(false);
  const [joinError, setJoinError]   = useState("");
  const [error, setError]           = useState("");
  const [renaming, setRenaming]     = useState(false);
  const [renameVal, setRenameVal]   = useState("");
  const [savingName, setSavingName] = useState(false);

  const load = useCallback(async () => {
    const res  = await fetch("/api/team");
    const json = await res.json() as TeamData;
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createTeam() {
    if (!teamName.trim()) return;
    setCreating(true); setError("");
    const res  = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: teamName }) });
    const json = await res.json() as { error?: string };
    if (!res.ok) { setError(json.error ?? "Failed"); setCreating(false); return; }
    await load();
    setCreating(false);
  }

  async function saveName() {
    if (!renameVal.trim()) return;
    setSavingName(true);
    const res = await fetch("/api/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: renameVal }) });
    if (res.ok) { await load(); setRenaming(false); }
    setSavingName(false);
  }

  async function generateInvite() {
    setInviting(true);
    const res  = await fetch("/api/team/invite", { method: "POST" });
    const json = await res.json() as { token?: string; error?: string };
    if (res.ok && json.token) {
      setInviteUrl(`${globalThis.location.origin}/join?token=${json.token}`);
    }
    await load(); // refresh pending invites list
    setInviting(false);
  }

  async function revokeInvite(inviteId: string) {
    setRevoking(inviteId);
    await fetch(`/api/team/invite/${inviteId}`, { method: "DELETE" });
    await load();
    setRevoking(null);
    setInviteUrl(null);
  }

  async function removeMember(userId: string) {
    setRemoving(userId);
    await fetch(`/api/team/members/${userId}`, { method: "DELETE" });
    await load();
    setRemoving(null);
  }

  async function deleteTeam() {
    if (!globalThis.confirm("Delete the team? All members will be removed.")) return;
    setDeleting(true);
    await fetch("/api/team", { method: "DELETE" });
    await load();
    setDeleting(false);
  }

  async function joinTeam() {
    const token = joinToken.trim();
    if (!token) return;
    setJoining(true); setJoinError("");
    const res  = await fetch("/api/team/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const json = await res.json() as { ok?: boolean; teamName?: string; error?: string };
    if (!res.ok) { setJoinError(json.error ?? "Invalid invite"); setJoining(false); return; }
    await load();
    setJoining(false);
  }

  async function leaveTeam() {
    if (!globalThis.confirm("Leave the team?")) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await fetch(`/api/team/members/${user.id}`, { method: "DELETE" });
    await load();
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
    </div>
  );

  // No team yet
  if (!data?.team) {
    const isPro = data?.plan === "pro";
    return (
      <div className="p-8 max-w-xl animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Team Workspace</h1>
          <p className="text-white/40 mt-1">Collaborate with your team under a shared credit pool.</p>
        </div>

        {isPro ? (
          <div className="glass rounded-2xl p-7 space-y-6">
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Create a team</p>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void createTeam(); }}
                placeholder="Team name…"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-all text-sm"
              />
              {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
              <button
                onClick={() => void createTeam()}
                disabled={creating || !teamName.trim()}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-all disabled:opacity-40"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? "Creating…" : "Create team"}
              </button>
            </div>

            <div className="border-t border-white/5 pt-5">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Join an existing team</p>
              <input
                type="text"
                value={joinToken}
                onChange={(e) => setJoinToken(e.target.value)}
                placeholder="Paste invite token or link…"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-all text-sm"
              />
              {joinError && <p className="text-xs text-red-400 mt-2">{joinError}</p>}
              <button
                onClick={() => void joinTeam()}
                disabled={joining || !joinToken.trim()}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/8 text-white font-semibold hover:bg-white/12 transition-all disabled:opacity-40 text-sm"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join team"}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-violet-900/30 flex items-center justify-center mx-auto">
              <Users className="w-5 h-5 text-violet-400/60" />
            </div>
            <p className="text-white/50 text-sm">Team workspace is available on the Pro plan.</p>
            <a href="/billing" className="inline-block text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">Upgrade to Pro →</a>
          </div>
        )}
      </div>
    );
  }

  const isOwner = data.members.find((m) => m.user_id === data.team?.owner_id)?.role === "owner";
  const seatCount = data.members.length;
  const seatLimit = data.seat_limit ?? 10;

  return (
    <div className="p-8 max-w-2xl animate-fade-in-up space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void saveName(); else if (e.key === "Escape") setRenaming(false); }}
                className="text-2xl font-bold bg-transparent border-b border-violet-500 text-white focus:outline-none w-full"
              />
              <button onClick={() => void saveName()} disabled={savingName} className="shrink-0 text-violet-400 hover:text-violet-300 disabled:opacity-40">
                {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => setRenaming(false)} className="shrink-0 text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white truncate">{data.team.name}</h1>
              {isOwner && (
                <button
                  onClick={() => { setRenameVal(data.team?.name ?? ""); setRenaming(true); }}
                  className="shrink-0 text-white/20 hover:text-white/60 transition-colors"
                  title="Rename team"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-white/40 text-sm">{seatCount}/{seatLimit} seats</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-xs text-violet-400 font-medium">Pro</span>
          </div>
        </div>
        {isOwner && (
          <button onClick={() => void deleteTeam()} disabled={deleting} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all disabled:opacity-40">
            <Trash2 className="w-3.5 h-3.5" /> {deleting ? "Deleting…" : "Delete team"}
          </button>
        )}
      </div>

      {/* Members */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Members</p>
          <div className="flex items-center gap-1 text-white/30">
            <BarChart2 className="w-3 h-3" />
            <span className="text-xs">Jobs this month</span>
          </div>
        </div>
        <div className="divide-y divide-white/4">
          {data.members.map((m) => {
            const name  = m.users?.full_name ?? m.users?.email ?? "Unknown";
            const email = m.users?.email ?? "";
            return (
              <div key={m.user_id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-violet-700/40 flex items-center justify-center text-xs font-bold text-white/70 shrink-0">
                  {(name[0] ?? "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-medium truncate">{name}</p>
                  <p className="text-xs text-white/30 truncate">{email}</p>
                </div>
                <span className="text-xs text-white/30 shrink-0 mr-2">{m.jobs_this_month} jobs</span>
                {m.role === "owner"
                  ? <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  : isOwner && (
                    <button
                      onClick={() => void removeMember(m.user_id)}
                      disabled={removing === m.user_id}
                      className="shrink-0 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                      title="Remove member"
                    >
                      {removing === m.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                    </button>
                  )
                }
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite section (owner only) */}
      {isOwner && seatCount < seatLimit && (
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Invite members</p>
          {inviteUrl ? (
            <>
              <CopyLink url={inviteUrl} />
              <p className="text-xs text-white/25 mt-2">Link expires in 7 days. Share it privately.</p>
            </>
          ) : (
            <button
              onClick={() => void generateInvite()}
              disabled={inviting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-all disabled:opacity-40"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {inviting ? "Generating…" : "Generate invite link"}
            </button>
          )}
        </div>
      )}

      {/* Pending invites */}
      {isOwner && data.pending_invites.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider px-5 pt-4 pb-2">Pending invites</p>
          <div className="divide-y divide-white/4">
            {data.pending_invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60 font-mono truncate">{inv.token.slice(0, 18)}…</p>
                  <p className="text-xs text-white/25">Expires in {daysUntil(inv.expires_at)}d</p>
                </div>
                <button
                  onClick={() => void revokeInvite(inv.id)}
                  disabled={revoking === inv.id}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 text-xs transition-all disabled:opacity-40"
                >
                  {revoking === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3" /> Revoke</>}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave team (members only) */}
      {!isOwner && (
        <button onClick={() => void leaveTeam()} className="text-xs text-white/30 hover:text-red-400 transition-colors">
          Leave team
        </button>
      )}
    </div>
  );
}
