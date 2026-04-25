"use client";

import { useEffect, useState } from "react";

/**
 * Platform detection — distinguishes "running inside the Capacitor APK"
 * from "running in a regular browser tab".
 *
 * We use this to:
 *  - hide the top navbar / footer inside the app (already fullscreen)
 *  - hide admin routes from the mobile app entirely
 *  - swap "Watch on YouTube" → opens the YouTube native app (vnd.youtube://)
 *  - skip features that don't work in WebView (magic-link auth, etc.)
 *
 * Detection is layered so it works whether or not the @capacitor/core
 * package is installed yet (during web-only development):
 *   1. Capacitor global (set by the native runtime)
 *   2. URL query param ?platform=app (manual override / testing)
 *   3. UA string contains "AshramConnectApp" (custom WebView UA — set later)
 */

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }
}

export function isAppEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  if (window.Capacitor?.isNativePlatform?.()) return true;

  const params = new URLSearchParams(window.location.search);
  if (params.get("platform") === "app") return true;

  if (navigator.userAgent.includes("AshramConnectApp")) return true;

  return false;
}

export function getPlatform(): "web" | "android" | "ios" {
  if (typeof window === "undefined") return "web";
  const cap = window.Capacitor?.getPlatform?.();
  if (cap === "android") return "android";
  if (cap === "ios") return "ios";
  return "web";
}

/**
 * React hook — returns true when running inside the Capacitor app.
 * SSR-safe: returns false on the server, then updates on mount.
 */
export function useIsApp(): boolean {
  const [isApp, setIsApp] = useState(false);
  useEffect(() => {
    setIsApp(isAppEnvironment());
  }, []);
  return isApp;
}

/**
 * Open a YouTube video in the native YouTube app if installed,
 * falling back to the browser. Used by the "Watch on YouTube" button.
 *
 * On Android, vnd.youtube:VIDEO_ID launches the YouTube app directly.
 */
export function openYouTubeExternal(videoId: string) {
  if (typeof window === "undefined" || !videoId) return;
  const platform = getPlatform();
  if (platform === "android") {
    window.location.href = `vnd.youtube:${videoId}`;
    return;
  }
  window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
}
