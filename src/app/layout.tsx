import type { Metadata } from "next";
import { Inter, Outfit, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import PolicyModal from "@/components/PolicyModal";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kritaman",
  description:
    "Private ashram portal for devotional lectures, attendance, policy access, and community operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} ${cormorant.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none fixed inset-0 -z-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(124,45,18,0.12),transparent_28%),linear-gradient(180deg,#fffdf8_0%,#f8f1e6_42%,#fffaf2_100%)]" />
              <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.7),transparent)]" />
            </div>

            <main className="w-full flex-grow pb-24 pt-0 md:pb-8 md:pt-16 lg:pt-8">
              <AuthGuard>{children}</AuthGuard>
            </main>

            <PolicyModal />

            <footer className="relative mt-10 border-t border-[rgba(124,45,18,0.12)] bg-white/55 backdrop-blur-xl">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-center sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:text-left">
                <div>
                  <p className="font-display text-2xl font-semibold text-devo-950">
                    Kritaman
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-devo-700/70">
                    Lectures, attendance, directory, policy access
                  </p>
                </div>
                <p className="text-sm font-medium text-devo-900/70">
                  © {new Date().getFullYear()} Kritaman. Internal community
                  portal.
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
