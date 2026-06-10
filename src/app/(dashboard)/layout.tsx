"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Zap, LayoutDashboard, PlusCircle, History, LogOut, TrendingUp, SlidersHorizontal, Settings, Mic2, Rss, CreditCard, Repeat2, CalendarDays, Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard",   icon: LayoutDashboard,  label: "Dashboard"      },
  { href: "/new",         icon: PlusCircle,        label: "New Content"    },
  { href: "/reverse",     icon: Repeat2,           label: "Reverse"        },
  { href: "/history",     icon: History,           label: "History"        },
  { href: "/calendar",    icon: CalendarDays,      label: "Calendar"       },
  { href: "/library",     icon: Star,              label: "Library"        },
  { href: "/feeds",       icon: Rss,               label: "RSS Feeds"      },
  { href: "/prompts",     icon: SlidersHorizontal, label: "Custom Prompts" },
  { href: "/brand-voice", icon: Mic2,              label: "Brand Voice"    },
  { href: "/team",        icon: Users,             label: "Team"           },
  { href: "/billing",     icon: CreditCard,        label: "Billing"        },
  { href: "/settings",    icon: Settings,          label: "Settings"       },
];

interface Profile {
  plan: string;
  full_name: string | null;
  email: string | null;
}

async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  globalThis.location.href = "/";
}

function getPlanClass(plan: string | undefined): string {
  if (plan === "pro")     return "text-amber-400";
  if (plan === "starter") return "text-violet-400";
  return "text-white/40";
}

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { globalThis.location.href = "/login"; return; }
      setUserEmail(user.email ?? null);
      const { data } = await supabase
        .from("users")
        .select("plan, full_name, email")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    }
    void load();
  }, []);

  const initial = ((profile?.full_name ?? profile?.email ?? userEmail ?? "U")[0] ?? "U").toUpperCase();

  return (
    <div className="flex h-screen" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col border-r border-white/5 shrink-0" style={{ background: "var(--surface)" }}>
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">RecastAI</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-violet-400" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {/* Plan badge */}
          <div className="px-3 py-2.5 rounded-xl bg-white/3 border border-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/30">Plan</span>
              <span className={`text-xs font-semibold uppercase tracking-wide ${getPlanClass(profile?.plan)}`}>
                {profile?.plan ?? "free"}
              </span>
            </div>
            {(!profile?.plan || profile.plan === "free") && (
              <Link href="/upgrade" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                <TrendingUp className="w-3 h-3" />
                Upgrade for more
              </Link>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">{profile?.full_name ?? "User"}</p>
              <p className="text-xs text-white/30 truncate">{profile?.email ?? userEmail}</p>
            </div>
          </div>

          <button
            onClick={() => void logout()}
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-white/70 transition-colors w-full rounded-xl hover:bg-white/5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-grid">{children}</main>
    </div>
  );
}
