"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface AuthUIProps {
  redirectTo?: string;
}

export default function AuthUI({ redirectTo = "/admin" }: AuthUIProps) {
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthError("");

    try {
      const targetUrl = window.location.origin + redirectTo;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: targetUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to Google";
      setAuthError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] p-8 sm:p-12 lg:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(124,45,18,0.12),transparent_34%)]" />
          <div className="relative space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-devo-200/80 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-devo-800">
              <Sparkles className="h-3.5 w-3.5" />
              Private Ashram Portal
            </div>

            <div className="space-y-4">
              <p className="font-display text-5xl leading-none text-devo-950 sm:text-6xl lg:text-7xl">
                Enter the
                <span className="ml-3 inline-block bg-gradient-to-r from-devo-700 via-devo-500 to-amber-500 bg-clip-text text-transparent">
                  devotional archive
                </span>
              </p>
              <p className="max-w-2xl text-balance text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
                Access curated lectures, ashram attendance tools, internal policy
                documents, and member resources through one secure account.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="paper-panel rounded-[1.5rem] p-4">
                <BookOpen className="mb-3 h-5 w-5 text-devo-600" />
                <p className="text-sm font-black uppercase tracking-[0.18em] text-devo-900">
                  Lecture Library
                </p>
                <p className="mt-2 text-sm leading-6 text-devo-900/70">
                  Search approved channels and continue from shared links.
                </p>
              </div>
              <div className="paper-panel rounded-[1.5rem] p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-devo-600" />
                <p className="text-sm font-black uppercase tracking-[0.18em] text-devo-900">
                  Role-Based Access
                </p>
                <p className="mt-2 text-sm leading-6 text-devo-900/70">
                  Attendance, admin tools, and policy content stay permissioned.
                </p>
              </div>
              <div className="paper-panel rounded-[1.5rem] p-4">
                <Sparkles className="mb-3 h-5 w-5 text-devo-600" />
                <p className="text-sm font-black uppercase tracking-[0.18em] text-devo-900">
                  Daily Use
                </p>
                <p className="mt-2 text-sm leading-6 text-devo-900/70">
                  Built for members who move between study, seva, and reports.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel relative rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          <div className="relative space-y-6">
            <div className="space-y-3 text-center lg:text-left">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-devo-700/70">
                Sign In
              </p>
              <h2 className="font-display text-4xl font-semibold text-devo-950 sm:text-5xl">
                Continue to Kritaman
              </h2>
              <p className="text-sm leading-6 text-devo-900/70">
                Use your approved Google account. Access is granted based on your
                existing ashram profile and role.
              </p>
            </div>

            {authError && (
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50/90 px-4 py-4 text-sm font-semibold text-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="group flex w-full items-center justify-between rounded-[1.6rem] bg-devo-950 px-5 py-4 text-left text-white shadow-[0_24px_60px_-24px_rgba(67,20,7,0.7)] hover:-translate-y-0.5 hover:bg-devo-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-devo-600" />
                  ) : (
                    <svg
                      className="h-5 w-5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="text-base font-black tracking-tight sm:text-lg">
                    Sign in with Google
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                    Secure single-account access
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-1" />
            </button>

            <div className="rounded-[1.5rem] border border-devo-100 bg-white/65 px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-devo-700/70">
                Access Notes
              </p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-devo-900/75">
                <p>Only whitelisted or mapped community accounts can enter.</p>
                <p>Your modules appear automatically based on your role.</p>
                <p>Attendance and admin tools remain hidden unless assigned.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
