import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wraps the Next.js app in an Android WebView.
 *
 * The WebView points at the live Vercel deployment — every Vercel deploy
 * instantly updates every installed APK with no rebuild needed.
 *
 * To target a different environment (staging, local LAN testing), change
 * `server.url` and re-run `npx cap sync android`.
 *
 * Local LAN testing example (replace with your machine's LAN IP):
 *   server.url = "http://192.168.1.10:3100"
 *   server.cleartext = true
 *   (also start Next.js on 0.0.0.0: `next dev -H 0.0.0.0 -p 3100`)
 */
const config: CapacitorConfig = {
  appId: "com.ashramconnect.app",
  appName: "Ashram Connect",
  // webDir is unused when server.url is set, but Capacitor requires the field.
  webDir: "out",
  server: {
    // CHANGE THIS to your production Vercel URL.
    url: "https://kirtanam.vercel.app",
    androidScheme: "https",
    // Allow navigation only to your own domain. Anything else (YouTube,
    // share links) opens in the system browser via @capacitor/browser.
    allowNavigation: ["kirtanam.vercel.app"],
  },
  android: {
    // Hides the loading spinner that appears before first paint.
    backgroundColor: "#0f0f18",
  },
};

export default config;
