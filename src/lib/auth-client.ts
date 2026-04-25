import { supabase } from "@/lib/supabase";

/** Resolve the current session's access token, or null if signed out. */
export async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** fetch() wrapper that attaches the Bearer token when a session exists. */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

/**
 * Fire-and-forget: tell the server the monk opened a video on YouTube. Never
 * throws — a logging failure must not block the navigation the user asked for.
 */
export async function logOpenExternal(videoId: string): Promise<void> {
  try {
    await authFetch("/api/activity/open-external", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
  } catch {
    // Ignore — logging is best-effort.
  }
}
