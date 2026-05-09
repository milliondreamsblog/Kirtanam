"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";
import { isAppEnvironment } from "@/lib/platform";
import { supabase } from "@/lib/supabase";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes default
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Capacitor deep-link OAuth handler. Google redirects back to
  // com.ashramconnect.app://auth-callback?code=... — Android delivers that
  // URL to MainActivity, the @capacitor/app plugin fires `appUrlOpen`, and
  // we exchange the code for a Supabase session inside the WebView (where
  // the PKCE code_verifier was stored when sign-in started).
  useEffect(() => {
    if (!isAppEnvironment()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        if (!url.startsWith("com.ashramconnect.app://auth-callback")) return;

        try {
          const parsed = new URL(url);
          const code = parsed.searchParams.get("code");
          const errorDescription = parsed.searchParams.get("error_description");

          if (errorDescription) {
            console.error("OAuth error:", errorDescription);
            return;
          }
          if (!code) return;

          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.error("exchangeCodeForSession failed:", error);
        } finally {
          await Browser.close().catch(() => {});
        }
      });

      cleanup = () => {
        handle.remove();
      };
    })();

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
