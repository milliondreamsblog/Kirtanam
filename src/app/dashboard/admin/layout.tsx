"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderKanban, Loader2, LogOut, Menu, Users, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { label: "Accounts", href: "/dashboard/admin/accounts", icon: FolderKanban },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
];

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

  const currentLabel =
    NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      ?.label ?? "Admin";

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="flex min-h-screen bg-white text-neutral-900">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-56 flex-col border-r border-neutral-200 bg-neutral-50/60 transition-transform duration-150 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 h-12">
          <Link href="/dashboard/admin/accounts" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#7A8F78] text-[11px] font-semibold text-white">
              K
            </div>
            <span className="text-sm font-semibold tracking-tight text-neutral-900">
              Kritaman
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close sidebar"
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-200 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3">
          <ul className="space-y-0.5">
            {NAV.map(({ label, href, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2 rounded-md px-2 h-8 text-[13px] transition-colors ${
                      active
                        ? "bg-neutral-200/70 text-neutral-900 font-medium"
                        : "text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-neutral-200 px-3 py-3">
          <div className="mb-2 min-w-0">
            <p className="truncate text-[13px] font-medium text-neutral-900">
              {userName || "Admin"}
            </p>
            <p className="truncate text-[11px] text-neutral-500">{userEmail}</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="text-[12px] text-neutral-500 hover:text-neutral-900"
            >
              ← Back to app
            </Link>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 h-7 text-[12px] text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-neutral-200 bg-white/95 px-4 h-12 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Open sidebar"
            className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <p className="text-[13px] font-medium text-neutral-900">{currentLabel}</p>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
