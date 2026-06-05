import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, LayoutDashboard, PlusCircle, History, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/new", icon: PlusCircle, label: "New Content" },
  { href: "/history", icon: History, label: "History" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plan, full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <aside className="w-60 flex flex-col glass border-r border-white/5">
        <div className="p-5 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">RecastAI</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          {/* Plan badge */}
          <div className="px-3 py-2 rounded-xl bg-white/5 mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/40">Current plan</span>
              <span className="text-xs font-semibold text-purple-400 uppercase">
                {profile?.plan ?? "free"}
              </span>
            </div>
            {(profile?.plan === "free" || !profile?.plan) && (
              <Link
                href="/upgrade"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Upgrade →
              </Link>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {(profile?.full_name ?? profile?.email ?? "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {profile?.full_name ?? "User"}
              </p>
              <p className="text-xs text-white/40 truncate">{profile?.email ?? user.email}</p>
            </div>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button className="flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white transition-colors w-full">
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
