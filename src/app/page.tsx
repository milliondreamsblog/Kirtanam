"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import YouTubeChannelHub from "@/components/YouTubeChannelHub";
import AuthUI from "@/components/AuthUI";
import { useProfile } from "@/hooks/useProfile";
import { ArrowRight, Loader2, Shield, Sparkles, Waves } from "lucide-react";

export default function PortalPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const { loading: loadingProfile } = useProfile(session);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loadingAuth || (session && loadingProfile)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-devo-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <section className="relative overflow-hidden rounded-[2.25rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,251,245,0.96),rgba(255,242,223,0.9))] px-6 py-8 shadow-[0_34px_90px_-38px_rgba(91,47,16,0.45)] sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.24),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(124,45,18,0.14),transparent_30%)]" />
            <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-devo-200/80 bg-white/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-devo-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Ashram Connect
                </div>
                <div className="space-y-4">
                  <h1 className="font-display max-w-4xl text-5xl leading-[0.92] text-devo-950 sm:text-6xl lg:text-7xl">
                    Built for
                    <span className="ml-3 bg-gradient-to-r from-devo-700 via-devo-500 to-amber-500 bg-clip-text text-transparent">
                      daily spiritual work
                    </span>
                  </h1>
                  <p className="max-w-2xl text-balance text-base leading-7 text-devo-900/72 sm:text-lg">
                    One portal for lecture study, attendance visibility, internal
                    documentation, and community operations, designed for focused
                    use on desktop and mobile.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="paper-panel rounded-[1.5rem] p-4">
                    <Waves className="mb-3 h-5 w-5 text-devo-600" />
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-devo-900">
                      Curated Library
                    </p>
                    <p className="mt-2 text-sm leading-6 text-devo-900/72">
                      Watch approved channels without distraction-heavy browsing.
                    </p>
                  </div>
                  <div className="paper-panel rounded-[1.5rem] p-4">
                    <Shield className="mb-3 h-5 w-5 text-devo-600" />
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-devo-900">
                      Role Sensitive
                    </p>
                    <p className="mt-2 text-sm leading-6 text-devo-900/72">
                      Attendance and administration unlock only when assigned.
                    </p>
                  </div>
                  <div className="paper-panel rounded-[1.5rem] p-4">
                    <ArrowRight className="mb-3 h-5 w-5 text-devo-600" />
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-devo-900">
                      Fast Entry
                    </p>
                    <p className="mt-2 text-sm leading-6 text-devo-900/72">
                      Sign in once and continue directly into the tools you use.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:justify-self-end">
                <AuthUI redirectTo="/" />
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-6 sm:py-12">
        <YouTubeChannelHub />
      </main>
    </div>
  );
}
