"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Zap, LayoutDashboard, PlusCircle, History, LogOut, TrendingUp,
  SlidersHorizontal, Settings, Mic2, Rss, CreditCard, Repeat2,
  CalendarDays, Star, Users, Menu, X, Gift,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ToastProvider } from "@/components/Toast";
import { ChangelogWidget } from "@/components/ChangelogWidget";

const navItems = [
  { href: "/dashboard",   icon: LayoutDashboard,  label: "Dashboard"      },
  { href: "/new",         icon: PlusCircle,        label: "New Content"    },
  { href: "/reverse",     icon: Repeat2,           label: "Reverse"        },
  { href: "/history",     icon: History,           label: "History"        },
  { href: "/library",     icon: Star,              label: "Library"        },
  { href: "/feeds",       icon: Rss,               label: "RSS Feeds"      },
  { href: "/prompts",     icon: SlidersHorizontal, label: "Custom Prompts" },
  { href: "/brand-voice", icon: Mic2,              label: "Brand Voice"    },
  { href: "/team",        icon: Users,             label: "Team"           },
  { href: "/invite",      icon: Gift,              label: "Invite & Earn"  },
  { href: "/billing",     icon: CreditCard,        label: "Billing"        },
  { href: "/settings",    icon: Settings,          label: "Settings"       },
];

interface Profile {
  plan: string;
  full_name: string | null;
  email: string | null;
}

interface UsageMeter {
  used: number;
  limit: number | null;
}

async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  globalThis.location.href = "/";
}

function getPlanClass(plan: string | undefined): string {
  if (plan === "pro")     return "text-amber-400";
  if (plan === "starter") return "text-amber-300";
  return "text-white/30";
}

function SidebarContent({
  pathname,
  profile,
  userEmail,
  usage,
  onNav,
}: {
  pathname: string;
  profile: Profile | null;
  userEmail: string | null;
  usage: UsageMeter | null;
  onNav?: () => void;
}) {
  const initial = ((profile?.full_name ?? profile?.email ?? userEmail ?? "U")[0] ?? "U").toUpperCase();

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNav}>
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/40">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">RecastAI</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-amber-600/15 text-amber-300 border border-amber-500/20"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-amber-400" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-2">
        <div className="px-3 py-2.5 rounded-xl bg-white/3 border border-white/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/30">Plan</span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${getPlanClass(profile?.plan)}`}>
              {profile?.plan ?? "free"}
            </span>
          </div>
          {usage && usage.limit !== null && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/25">Videos this month</span>
                <span className="text-xs text-white/40 tabular-nums">{usage.used} / {usage.limit}</span>
              </div>
              <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usage.used >= usage.limit ? "bg-red-500" :
                    usage.used / usage.limit > 0.7 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {(!profile?.plan || profile.plan === "free") && (
            <Link href="/upgrade" onClick={onNav} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
              <TrendingUp className="w-3 h-3" />
              Upgrade for more
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-amber-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">{profile?.full_name ?? "User"}</p>
            <p className="text-xs text-white/30 truncate">{profile?.email ?? userEmail}</p>
          </div>
        </div>

        <ChangelogWidget />
        <button
          onClick={() => void logout()}
          className="flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-white/70 transition-colors w-full rounded-xl hover:bg-white/5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [profile, setProfile]         = useState<Profile | null>(null);
  const [userEmail, setUserEmail]     = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage]             = useState<UsageMeter | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { globalThis.location.href = "/login"; return; }
      setUserEmail(user.email ?? null);

      const { data } = await supabase.from("users").select("plan, full_name, email").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        const planLimits: Record<string, number | null> = { free: 3, starter: 25, pro: null };
        const rawLimit = planLimits[data.plan as string];
        const limit = rawLimit !== undefined ? rawLimit : 3;
        if (limit !== null) {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          const { count } = await supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .not("status", "in", '("cancelled","failed")')
            .gte("created_at", startOfMonth.toISOString());
          setUsage({ used: count ?? 0, limit });
        }
      }
    }
    void load();
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <ToastProvider>
      <div className="flex h-screen" style={{ background: "var(--background)" }}>

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r border-white/5 shrink-0" style={{ background: "var(--surface)" }}>
          <SidebarContent pathname={pathname} profile={profile} userEmail={userEmail} usage={usage} />
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Mobile drawer */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col border-r border-white/5 md:hidden transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ background: "var(--surface)" }}
        >
          <SidebarContent pathname={pathname} profile={profile} userEmail={userEmail} usage={usage} onNav={() => setSidebarOpen(false)} />
        </aside>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0" style={{ background: "var(--surface)" }}>
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-600 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-sm text-white">RecastAI</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto p-2 rounded-lg text-white/40 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <main className="flex-1 overflow-y-auto bg-grid">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
