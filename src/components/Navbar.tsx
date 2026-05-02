"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  LogOut,
  MoreHorizontal,
  Settings,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import ProfileEdit from "./ProfileEdit";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-home"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function YoutubeIcon({
  className,
  active,
}: {
  className?: string;
  active?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-youtube ${className ?? ""}`}
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.46 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.46-5.58z" />
      <polygon
        points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
        fill={active ? "white" : "none"}
      />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const { profile, isBcdb, refreshProfile } = useProfile(session);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDesktopMore, setShowDesktopMore] = useState(false);
  const role = Number(profile?.role);
  const canOpenAttendance = isBcdb || role === 1 || role === 3;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return session?.user?.email?.[0].toUpperCase() || "U";
  };

  const isHome = pathname === "/";
  const isClass = pathname === "/class";
  const isAttendance = pathname === "/attendance";

  return (
    <>
      <nav className="glass-panel sticky top-4 z-[100] mx-4 hidden h-20 items-center justify-between rounded-[1.75rem] px-6 md:flex lg:mx-6 lg:px-8">
        <NextLink href="/" className="group flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-gradient-to-br from-devo-700 via-devo-500 to-amber-400 text-white shadow-lg transition-all group-hover:scale-105">
            <span className="font-display text-2xl font-semibold">A</span>
          </div>
          <div className="space-y-0.5">
            <span className="font-display text-3xl font-semibold leading-none text-devo-950">
              Kritaman
            </span>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-devo-700/60">
              Daily spiritual operations
            </p>
          </div>
        </NextLink>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowProfileModal(true)}
            className="group flex items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-2.5 shadow-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-devo-100 text-xs font-black text-devo-700 transition-colors group-hover:bg-devo-600 group-hover:text-white">
              {getInitials()}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-devo-900">
              My Profile
            </span>
          </button>

          <NextLink
            href="/class"
            className={`group flex items-center gap-2 rounded-2xl border px-4 py-2.5 shadow-sm ${
              isClass
                ? "border-devo-700 bg-devo-700 text-white"
                : "border-white/80 bg-white/70 text-devo-700 hover:bg-devo-700 hover:text-white"
            }`}
          >
            <YoutubeIcon className="h-5 w-5" active={isClass} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              BC Class
            </span>
          </NextLink>

          {canOpenAttendance && (
            <NextLink
              href="/attendance"
              className={`group flex items-center gap-2 rounded-2xl border px-4 py-2.5 shadow-sm ${
                isAttendance
                  ? "border-devo-950 bg-devo-950 text-white"
                  : "border-white/80 bg-white/70 text-slate-700 hover:bg-white"
              }`}
            >
              <CalendarDays className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                My Attendance
              </span>
            </NextLink>
          )}

          <div className="relative">
            <button
              onClick={() => setShowDesktopMore(!showDesktopMore)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 shadow-sm ${
                showDesktopMore
                  ? "border-devo-950 bg-devo-950 text-white"
                  : "border-white/80 bg-white/70 text-slate-700 hover:bg-white"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                More
              </span>
            </button>

            {showDesktopMore && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDesktopMore(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-3 w-64 rounded-[1.75rem] border border-white/80 bg-white/92 p-2 shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
                  {isBcdb && (
                    <NextLink
                      href="/policy-manual"
                      onClick={() => setShowDesktopMore(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                        pathname === "/policy-manual"
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className="flex-1 text-[10px] font-black uppercase tracking-widest">
                        Policy Manual
                      </span>
                    </NextLink>
                  )}

                  {isBcdb && (
                    <NextLink
                      href="/directory"
                      onClick={() => setShowDesktopMore(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                        pathname === "/directory"
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <span className="flex-1 text-[10px] font-black uppercase tracking-widest">
                        Devotee Directory
                      </span>
                    </NextLink>
                  )}

                  {role === 1 && (
                    <NextLink
                      href="/admin"
                      onClick={() => setShowDesktopMore(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                        pathname.startsWith("/admin")
                          ? "bg-devo-50 text-devo-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="flex-1 text-[10px] font-black uppercase tracking-widest">
                        Admin Panel
                      </span>
                    </NextLink>
                  )}

                  <div className="my-2 border-t border-slate-100" />

                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = "/";
                    }}
                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="flex-1 text-[10px] font-black uppercase tracking-widest">
                      Logout Session
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <nav className="glass-panel relative z-[100] mx-3 mt-3 flex h-16 items-center justify-between rounded-[1.4rem] px-4 md:hidden">
        <NextLink href="/" className="group flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-devo-700 via-devo-500 to-amber-400 text-white shadow-sm">
            <span className="font-display text-lg font-semibold">A</span>
          </div>
          <span className="font-display text-2xl font-semibold leading-none text-devo-950">
            Kritaman
          </span>
        </NextLink>

        <div className="flex items-center gap-2">
          {role === 1 && (
            <NextLink
              href="/admin"
              className={`p-2 transition-all active:scale-95 ${
                pathname.startsWith("/admin")
                  ? "text-devo-600"
                  : "text-slate-400 hover:text-devo-600"
              }`}
            >
              <Settings className="h-5 w-5" />
            </NextLink>
          )}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-devo-100 text-[10px] font-black text-devo-700 shadow-sm transition-all active:scale-90"
          >
            {getInitials()}
          </button>
        </div>
      </nav>

      <nav className="glass-panel safe-area-bottom fixed bottom-3 left-3 right-3 z-[100] flex items-center justify-between gap-1 rounded-[1.6rem] px-4 py-3 md:hidden">
        <NextLink href="/" className="group flex flex-1 flex-col items-center gap-1">
          <div
            className={`rounded-xl p-2 transition-all group-active:scale-95 ${
              isHome ? "bg-devo-50 text-devo-600 shadow-inner" : "text-slate-400"
            }`}
          >
            <HomeIcon active={isHome} />
          </div>
          <span
            className={`text-[9px] font-black uppercase tracking-widest ${
              isHome ? "text-devo-600" : "text-slate-400"
            }`}
          >
            Home
          </span>
        </NextLink>

        <NextLink
          href="/class"
          className="group flex flex-1 flex-col items-center gap-1"
        >
          <div
            className={`rounded-xl p-2 transition-all group-active:scale-95 ${
              isClass ? "bg-devo-50 text-devo-600 shadow-inner" : "text-slate-400"
            }`}
          >
            <YoutubeIcon className="h-6 w-6" active={isClass} />
          </div>
          <span
            className={`text-[9px] font-black uppercase tracking-widest ${
              isClass ? "text-devo-600" : "text-slate-400"
            }`}
          >
            BC Class
          </span>
        </NextLink>

        {canOpenAttendance && (
          <NextLink
            href="/attendance"
            className="group flex flex-1 flex-col items-center gap-1"
          >
            <div
              className={`rounded-xl p-2 transition-all group-active:scale-95 ${
                isAttendance
                  ? "bg-devo-50 text-devo-600 shadow-inner"
                  : "text-slate-400"
              }`}
            >
              <CalendarDays className="h-6 w-6" />
            </div>
            <span
              className={`text-[9px] font-black uppercase tracking-widest ${
                isAttendance ? "text-devo-600" : "text-slate-400"
              }`}
            >
              Attendance
            </span>
          </NextLink>
        )}

        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="flex flex-1 flex-col items-center gap-1"
        >
          <div
            className={`rounded-xl p-2 transition-all group-active:scale-95 ${
              showMoreMenu
                ? "bg-indigo-50 text-indigo-600 shadow-inner"
                : "text-slate-400"
            }`}
          >
            {showMoreMenu ? (
              <X className="h-6 w-6" />
            ) : (
              <MoreHorizontal className="h-6 w-6" />
            )}
          </div>
          <span
            className={`text-[9px] font-black uppercase tracking-widest ${
              showMoreMenu ? "text-indigo-600" : "text-slate-400"
            }`}
          >
            {showMoreMenu ? "Close" : "More"}
          </span>
        </button>
      </nav>

      {showMoreMenu && (
        <div className="fixed inset-0 z-[1000] animate-in fade-in duration-300 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="absolute bottom-[84px] left-4 right-4 overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col py-2">
              {isBcdb && (
                <NextLink
                  href="/policy-manual"
                  onClick={() => setShowMoreMenu(false)}
                  className={`flex items-center gap-4 px-6 py-3.5 transition-all ${
                    pathname === "/policy-manual"
                      ? "bg-indigo-50/50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <BookOpen
                    className={`h-4 w-4 ${
                      pathname === "/policy-manual"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  />
                  <span
                    className={`flex-1 text-[11px] font-black uppercase tracking-widest ${
                      pathname === "/policy-manual"
                        ? "text-indigo-900"
                        : "text-slate-600"
                    }`}
                  >
                    Policy Manual
                  </span>
                </NextLink>
              )}

              {isBcdb && (
                <NextLink
                  href="/directory"
                  onClick={() => setShowMoreMenu(false)}
                  className={`flex items-center gap-4 px-6 py-3.5 transition-all ${
                    pathname === "/directory"
                      ? "bg-emerald-50/50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <Users
                    className={`h-4 w-4 ${
                      pathname === "/directory"
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  />
                  <span
                    className={`flex-1 text-[11px] font-black uppercase tracking-widest ${
                      pathname === "/directory"
                        ? "text-emerald-900"
                        : "text-slate-600"
                    }`}
                  >
                    Devotee Directory
                  </span>
                </NextLink>
              )}

              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-4 px-6 py-3.5 text-left transition-all hover:bg-slate-50"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span className="flex-1 text-[11px] font-black uppercase tracking-widest text-slate-600">
                  My Profile
                </span>
              </button>

              {role === 1 && (
                <NextLink
                  href="/admin"
                  onClick={() => setShowMoreMenu(false)}
                  className={`flex items-center gap-4 px-6 py-3.5 transition-all ${
                    pathname.startsWith("/admin")
                      ? "bg-devo-50/50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <Shield
                    className={`h-4 w-4 ${
                      pathname.startsWith("/admin")
                        ? "text-devo-600"
                        : "text-slate-400"
                    }`}
                  />
                  <span
                    className={`flex-1 text-[11px] font-black uppercase tracking-widest ${
                      pathname.startsWith("/admin")
                        ? "text-devo-950"
                        : "text-slate-600"
                    }`}
                  >
                    Admin Panel
                  </span>
                </NextLink>
              )}

              <div className="my-2 mx-4 border-t border-slate-100" />

              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="group flex items-center gap-4 px-6 py-3.5 text-left transition-all hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 text-slate-300 transition-colors group-hover:text-red-500" />
                <span className="flex-1 text-[11px] font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-red-600">
                  Logout Session
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/50 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-black text-devo-700 shadow-sm">
                  {getInitials()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[10px] font-black uppercase leading-none tracking-tighter text-slate-900">
                    {profile?.full_name || "Member"}
                  </div>
                  <div className="mt-1 truncate text-[8px] font-bold uppercase tracking-tight text-slate-400">
                    {session?.user?.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <ProfileEdit
          session={session}
          profile={profile}
          onUpdate={refreshProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
}
