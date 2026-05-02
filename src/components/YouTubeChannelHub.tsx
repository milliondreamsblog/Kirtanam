"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import ChannelPickerPage from "./youtube-hub/views/ChannelPickerPage";
import ChannelViewPage from "./youtube-hub/views/ChannelViewPage";
import ShareModal from "./ShareModal";
import { useChannels } from "./youtube-hub/hooks/useChannels";
import { useRecentlyWatched } from "./youtube-hub/hooks/useRecentlyWatched";
import type { VideoItem, Notification } from "./youtube-hub/types";

/**
 * YouTubeChannelHub — Thin Orchestrator
 *
 * Responsibilities (and ONLY these):
 *  1. Read URL search params to derive active state
 *  2. Write URL search params when the user navigates
 *  3. Own notification toast state
 *  4. Own share modal state
 *  5. Pass playerRef down so ChannelViewPage can scroll it into view
 *
 * All data fetching lives in the child hooks:
 *  - useChannels       → channel list
 *  - useVideoContent   → per-channel videos / playlists (inside ChannelViewPage)
 *  - useFavorites      → user favorites              (inside ChannelViewPage)
 *  - useGlobalSearch   → cross-channel search        (inside each view)
 *  - useVideoMetadata  → single-video fallback       (inside ChannelViewPage)
 */
export default function YouTubeChannelHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Ref forwarded to <VideoPlayerSection> so we can scroll it into view
  const playerRef = useRef<HTMLDivElement | null>(null);

  // ── Pure UI state (not reflected in the URL) ─────────────────────────────
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activePlaylistName, setActivePlaylistName] = useState<string | null>(
    null,
  );
  const [isLive, setIsLive] = useState(false);
  const [shareVideoTitle, setShareVideoTitle] = useState("Spiritual Lecture");

  // ── Channel list (needed to resolve channelId → Channel object) ──────────
  const { channels, isLoading: channelsLoading } = useChannels();

  // ── Recently watched tracker (localStorage-backed) ───────────────────────
  const { trackPlay } = useRecentlyWatched();

  // ── URL-derived state (single source of truth) ───────────────────────────
  const urlChannelId = searchParams.get("channel");
  const urlPlaylistId = searchParams.get("playlist");
  const urlVideoId = searchParams.get("v");
  const urlTab = searchParams.get("tab") ?? "videos";

  const activeChannel =
    channels.find((c) => c.channel_id === urlChannelId) ?? null;
  const activeTab = urlTab;
  const activePlaylistId = urlPlaylistId;
  const activeVideoId = urlVideoId;

  // ── Notification helper ──────────────────────────────────────────────────
  const notify = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // If the URL points at a channel the monk no longer has access to (admin
  // revoked it, or bookmark from before assignment), surface a clear message
  // and drop the stale params so they land on the channel picker cleanly.
  useEffect(() => {
    if (!urlChannelId || channelsLoading) return;
    const exists = channels.some((c) => c.channel_id === urlChannelId);
    if (exists) return;
    setNotification({
      message: "This channel is no longer available to you.",
      type: "error",
    });
    const query = new URLSearchParams(searchParams.toString());
    query.delete("channel");
    query.delete("playlist");
    query.delete("v");
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setTimeout(() => setNotification(null), 3500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlChannelId, channelsLoading, channels]);

  // ── Navigation handlers ──────────────────────────────────────────────────

  /** Handles both regular video selection and playlist entry */
  const handleVideoSelect = (vid: VideoItem) => {
    const query = new URLSearchParams(searchParams.toString());

    if (vid.type === "playlist") {
      setActivePlaylistName(vid.title);
      query.set("playlist", vid.id);
      query.delete("v");
      router.push(`${pathname}?${query.toString()}`, { scroll: false });
      return;
    }

    setShareVideoTitle(vid.title);
    setIsLive(vid.type === "live");
    query.set("v", vid.id);
    query.delete("playlist");
    router.push(`${pathname}?${query.toString()}`, { scroll: false });

    // Remember this play in localStorage so the landing page can show it
    // under "Continue watching" next time the user opens the app.
    trackPlay(vid);

    // Scroll the player into view on selection (mobile-friendly)
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleTabChange = (tab: string) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("tab", tab);
    query.delete("playlist");
    query.delete("v");
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
    setActivePlaylistName(null);
    setIsLive(false);
  };

  const handlePlaylistBack = () => {
    const query = new URLSearchParams(searchParams.toString());
    query.delete("playlist");
    query.delete("v");
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
    setActivePlaylistName(null);
  };

  const handleChannelSelect = (channelId: string) => {
    router.push(`${pathname}?channel=${channelId}`);
  };

  /** Back arrow — clears everything and returns to the channel picker */
  const handleBack = () => {
    router.push(pathname);
    setActivePlaylistName(null);
    setIsLive(false);
  };

  // ── Share handler ────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (!activeVideoId) return;

    const shareUrl = `https://www.youtube.com/watch?v=${activeVideoId}`;
    const shareTitle = shareVideoTitle;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out this lecture: ${shareTitle}`,
          url: shareUrl,
        });
        notify("Shared successfully!");
      } catch (err) {
        // Ignore user cancellation; open fallback modal for real errors
        if ((err as Error).name !== "AbortError") {
          setIsShareModalOpen(true);
        }
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  // ── View routing ─────────────────────────────────────────────────────────

  // Show the channel view when:
  //  a) The user has selected a channel  (activeChannel is set), OR
  //  b) The user is on the Favorites tab (no channel needed)
  const showChannelView = !!activeChannel || activeTab === "favorites";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {showChannelView ? (
        <ChannelViewPage
          channels={channels}
          activeChannel={activeChannel}
          activeTab={activeTab}
          activePlaylistId={activePlaylistId}
          activePlaylistName={activePlaylistName}
          activeVideoId={activeVideoId}
          isLive={isLive}
          playerRef={playerRef}
          onVideoSelect={handleVideoSelect}
          onTabChange={handleTabChange}
          onPlaylistBack={handlePlaylistBack}
          onBack={handleBack}
          onShare={handleShare}
          notify={notify}
        />
      ) : (
        <ChannelPickerPage onChannelSelect={handleChannelSelect} />
      )}

      {/* ── Notification Toast ──────────────────────────────────────────── */}
      {notification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div
            className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 min-w-[280px] ${
              notification.type === "success"
                ? "bg-slate-900/90 text-white border-white/20"
                : "bg-red-600/90 text-white border-red-400"
            }`}
          >
            {notification.type === "success" ? (
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                {notification.type === "success" ? "Success" : "Attention"}
              </span>
              <span className="text-[11px] font-bold text-white/80 truncate">
                {notification.message}
              </span>
            </div>

            <button
              onClick={() => setNotification(null)}
              className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      )}

      {/* ── Share Modal (fallback for browsers without navigator.share) ─── */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={shareVideoTitle}
        url={
          activeVideoId
            ? `https://www.youtube.com/watch?v=${activeVideoId}`
            : ""
        }
      />
    </>
  );
}
