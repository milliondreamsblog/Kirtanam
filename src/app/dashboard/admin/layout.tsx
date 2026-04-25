"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileVideo,
  Users,
  Activity,
  ChevronLeft,
  Menu,
  X,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const NAV = [
  {
    group: "Content",
    items: [
      {
        label: "Channels",
        href: "/dashboard/admin/youtube-channels",
        icon: FileVideo,
        description: "Add & sync YT channels",
        color: "from-violet-500 to-purple-600",
        glow: "shadow-violet-500/30",
        dot: "bg-violet-400",
      },
    ],
  },
  {
    group: "Monk Access",
    items: [
      {
        label: "Monks",
        href: "/dashboard/admin/monks",
        icon: Users,
        description: "Channel assignments",
        color: "from-sky-500 to-blue-600",
        glow: "shadow-sky-500/30",
        dot: "bg-sky-400",
      },
      {
        label: "Activity Feed",
        href: "/dashboard/admin/activity",
        icon: Activity,
        description: "Audit log",
        color: "from-emerald-500 to-teal-600",
        glow: "shadow-emerald-500/30",
        dot: "bg-emerald-400",
      },
    ],
  },
];

function AdminShieldIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path
        d="M18 3L5 8.5V18c0 7.18 5.55 13.9 13 15.5C25.45 31.9 31 25.18 31 18V8.5L18 3Z"
        fill="url(#shieldGrad)"
        opacity="0.15"
      />
      <path
        d="M18 3L5 8.5V18c0 7.18 5.55 13.9 13 15.5C25.45 31.9 31 25.18 31 18V8.5L18 3Z"
        stroke="#818cf8"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M13 18l3.5 3.5L23 14"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== 1) {
        router.replace("/");
        return;
      }
      setUserEmail(profile?.email || session.user.email || "");
      setUserName(profile?.full_name || "");
      setAllowed(true);
      setChecking(false);
    });
  }, [router]);

  const getInitials = () => {
    if (userName) return userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    return userEmail?.[0]?.toUpperCase() || "A";
  };

  // Current page label for mobile topbar
  const currentLabel =
    NAV.flatMap((g) => g.items).find(
      (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
    )?.label ?? "Admin";

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12"><AdminShieldIcon /></div>
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (!allowed) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* ── Brand header ──────────────────────────────────────── */}
      <div className="relative px-5 pt-6 pb-5">
        {/* subtle grid bg */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 shrink-0"><AdminShieldIcon /></div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-400/80">
                Super Admin
              </p>
              <p className="text-sm font-black text-white leading-tight tracking-tight">
                Ashram Connect
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* thin divider with glow */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2 space-y-5">
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="px-3 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-white/20">
              {group.group}
            </p>
            <ul className="space-y-1">
              {group.items.map(({ label, href, icon: Icon, description, color, glow, dot }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`relative flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all duration-200 group overflow-hidden
                        ${active
                          ? `bg-white/10 shadow-lg ${glow}`
                          : "hover:bg-white/[0.06]"
                        }`}
                    >
                      {/* active left bar */}
                      {active && (
                        <span className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gradient-to-b ${color}`} />
                      )}

                      {/* icon bubble */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                        ${active
                          ? `bg-gradient-to-br ${color} shadow-md ${glow}`
                          : "bg-white/8 group-hover:bg-white/12"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-white" : "text-white/40 group-hover:text-white/70"}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold leading-tight ${active ? "text-white" : "text-white/60 group-hover:text-white/90"}`}>
                          {label}
                        </p>
                        <p className={`text-[10px] leading-tight mt-0.5 ${active ? "text-white/50" : "text-white/20 group-hover:text-white/35"}`}>
                          {description}
                        </p>
                      </div>

                      {active && (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot} shadow-sm`} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* ── Other admin section ──────────────────────────────── */}
        <div>
          <p className="px-3 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-white/20">
            Other
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin"
                className="flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white/[0.06] transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-white/8 group-hover:bg-white/12 flex items-center justify-center shrink-0 transition-all">
                  <LayoutDashboard className="w-4 h-4 text-white/30 group-hover:text-white/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white/50 group-hover:text-white/80 leading-tight">
                    Full Admin Panel
                  </p>
                  <p className="text-[10px] text-white/20 group-hover:text-white/35 mt-0.5">
                    Legacy admin tools
                  </p>
                </div>
                <ExternalLink className="w-3 h-3 text-white/15 group-hover:text-white/40 shrink-0 transition-colors" />
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white/[0.06] transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-white/8 group-hover:bg-white/12 flex items-center justify-center shrink-0 transition-all">
                  <ChevronLeft className="w-4 h-4 text-white/30 group-hover:text-white/60" />
                </div>
                <p className="text-sm font-bold text-white/50 group-hover:text-white/80">
                  Back to App
                </p>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── User card ─────────────────────────────────────────── */}
      <div className="px-3 pb-4">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          {/* avatar */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-md">
            {getInitials()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-white/80 truncate uppercase tracking-wide leading-tight">
              {userName || "Admin"}
            </p>
            <p className="text-[9px] text-white/30 truncate mt-0.5">{userEmail}</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* version badge */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <Sparkles className="w-2.5 h-2.5 text-indigo-400/40" />
          <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/15">
            Admin Dashboard v2
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40 flex flex-col
          bg-[#0f0f18] border-r border-white/[0.06]
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#0f0f18]/95 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 shrink-0"><AdminShieldIcon /></div>
            <p className="text-sm font-black text-white uppercase tracking-widest truncate">
              {currentLabel}
            </p>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
