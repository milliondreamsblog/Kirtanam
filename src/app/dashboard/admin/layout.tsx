"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderKanban, Loader2, LogOut, Menu, Users, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAV = [
  {
    label: "Accounts",
    href: "/dashboard/admin/accounts",
    icon: FolderKanban,
    hint: "Reusable channel bundles",
  },
  {
    label: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
    hint: "Per-user access",
  },
];

function BrandMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff4e45] text-sm font-black text-white shadow-[0_10px_24px_-14px_rgba(255,78,69,0.9)]">
      AC
    </div>
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

  const currentLabel =
    NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      ?.label ?? "Admin";

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f8f8]">
        <div className="flex flex-col items-center gap-4">
          <BrandMark />
          <Loader2 className="h-5 w-5 animate-spin text-[#ff4e45]" />
        </div>
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="flex min-h-screen bg-[#f8f8f8] text-[#161616]">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-[276px] flex-col border-r border-black/8 bg-[#f3f3f3] transition-transform duration-200 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/6 px-5 py-5">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-xl font-black tracking-tight text-[#ff4e45]">
                Ashram Admin
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/45">
                Content Control
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl p-2 text-black/45 hover:bg-black/5 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4">
          <p className="px-4 pb-3 text-[11px] font-black uppercase tracking-[0.26em] text-black/35">
            Menu
          </p>
          <ul className="space-y-1.5">
            {NAV.map(({ label, href, icon: Icon, hint }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                      active
                        ? "border-[#ff4e45]/30 bg-[#ff4e45] text-white shadow-[0_18px_40px_-24px_rgba(255,78,69,0.9)]"
                        : "border-transparent bg-transparent text-black/70 hover:bg-white hover:text-black"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active ? "bg-white/18" : "bg-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black tracking-tight">{label}</p>
                      <p
                        className={`truncate text-[11px] font-medium ${
                          active ? "text-white/75" : "text-black/45"
                        }`}
                      >
                        {hint}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-black/6 px-4 py-4">
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
            <p className="truncate text-sm font-black text-black">
              {userName || "Admin"}
            </p>
            <p className="mt-1 truncate text-xs font-medium text-black/45">
              {userEmail}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <Link
                href="/"
                className="text-[11px] font-black uppercase tracking-[0.22em] text-black/45 hover:text-black"
              >
                Back To App
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-black/6 bg-[#f8f8f8]/95 px-4 py-3 backdrop-blur md:px-6 lg:hidden">
          <button
            type="button"
            className="rounded-xl bg-white p-2 text-black/70 shadow-sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-black">
            {currentLabel}
          </p>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
