"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Play,
  Layers,
  Heart,
  X,
  CheckCircle2,
} from "lucide-react";
import ChannelSidebarNav from "../components/ChannelSidebarNav";
import VideoPlayerSection from "../components/VideoPlayerSection";
import VideoListSidebar from "../components/VideoListSidebar";
import { useVideoContent } from "../hooks/useVideoContent";
import { useFavorites } from "../hooks/useFavorites";
import { useVideoMetadata } from "../hooks/useVideoMetadata";
import type { Channel, VideoItem } from "../types";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "videos",    label: "Videos",    Icon: Play   },
  { id: "playlists", label: "Playlists", Icon: Layers },
  { id: "favorites", label: "Favorites", Icon: Heart  },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChannelViewPageProps {
  /** Full list of channels — needed to populate the sidebar nav */
  channels: Channel[];
  /** The currently active channel, or null when showing Favorites without a channel */
  activeChannel: Channel | null;
  activeTab: string;
  activePlaylistId: string | null;
  activePlaylistName: string | null;
  activeVideoId: string | null;
  isLive: boolean;
  /** Forwarded ref so the orchestrator can scroll the player into view */
  playerRef: React.RefObject<HTMLDivElement | null>;
  onVideoSelect: (vid: VideoItem) => void;
  onTabChange: (tab: string) => void;
  onPlaylistBack: () => void;
  /** Navigate back to the ChannelPickerPage */
  onBack: () => void;
  /** Open the share modal — managed by the orchestrator */
  onShare: () => void;
  notify: (message: string, type?: "success" | "error") => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChannelViewPage({
  channels,
  activeChannel,
  activeTab,
  activePlaylistId,
  activePlaylistName,
  activeVideoId,
  isLive,
  playerRef,
  onVideoSelect,
  onTabChange,
  onPlaylistBack,
  onBack,
  onShare,
  notify,
}: ChannelViewPageProps) {
  const router   = useRouter();
  const pathname = usePathname();

  // ── Data hooks ────────────────────────────────────────────────────────────

  const { videos: channelVideos } = useVideoContent(
    activeChannel?.channel_id ?? null,
    activeTab,
    activePlaylistId
  );

  const {
    favoriteVideos,
    favoriteIds,
    toggle: toggleFavorite,
  } = useFavorites();

  // Only fetch single-video metadata when the video isn't already in any list.
  // This handles the case where a user opens a direct share link (?v=someId).
  const isVideoInLocalList =
    channelVideos.some((v) => v.id === activeVideoId) ||
    favoriteVideos.some((v) => v.id === activeVideoId);

  const { data: fallbackMetadata } = useVideoMetadata(
    !isVideoInLocalList ? activeVideoId : null
  );

  // ── Derived: active video object ──────────────────────────────────────────

  const activeVideo: VideoItem | null =
    channelVideos.find((v) => v.id === activeVideoId) ??
    favoriteVideos.find((v) => v.id === activeVideoId) ??
    fallbackMetadata ??
    null;

  // ── Auto-select first video ───────────────────────────────────────────────

  const isShowingPlaylist = activePlaylistId !== null;
  const isMainVideoTab    = activeTab === "videos" && !isShowingPlaylist;

  useEffect(() => {
    if (
      !activeVideoId &&
      channelVideos.length > 0 &&
      (isMainVideoTab || isShowingPlaylist)
    ) {
      onVideoSelect(channelVideos[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelVideos, activeVideoId, isMainVideoTab, isShowingPlaylist]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleChannelSelect = (channelId: string) => {
    router.push(`${pathname}?channel=${channelId}`);
  };

  const handleToggleFavorite = (videoId: string) => {
    toggleFavorite(videoId, {
      onSuccess: (data) => {
        notify(
          data.action === "added"
            ? "Added to Spiritual Favorites!"
            : "Removed from Favorites"
        );
      },
      onError: () => notify("Failed to update favorites", "error"),
    });
  };

  // ── Display values ────────────────────────────────────────────────────────

  const activeLogo    = activeChannel?.custom_logo ?? null;
  const channelName   = activeChannel?.name        ?? "My Spiritual Library";
  const channelHandle = activeChannel?.handle      ?? "FAVORITES COLLECTION";
  const bannerStyle   =
    activeChannel?.banner_style ?? "linear-gradient(to right, #0F172A, #334155)";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 pt-6 lg:pt-0 pb-20 lg:pb-0">

      {/* ── Channel Navigation (desktop sidebar + mobile top bar) ───────── */}
      <ChannelSidebarNav
        channels={channels}
        activeChannelId={activeChannel?.channel_id ?? null}
        onSelect={handleChannelSelect}
        onBack={onBack}
      />

      {/* ── Main Content ──────────────────────────────────────────────────  */}
      <main className="flex-1 overflow-y-auto">

        {/* ── Banner ──────────────────────────────────────────────────────── */}
        <div className="h-44 sm:h-64 relative">
          {/* Gradient background */}
          <div
            className="absolute inset-0 opacity-90 transition-all duration-700"
            style={{ background: bannerStyle }}
          />
          {/* Fade to white at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

          {/* Channel identity card */}
          <div className="absolute -bottom-16 sm:-bottom-20 left-1/2 sm:left-8 -translate-x-1/2 sm:translate-x-0 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 w-full sm:w-auto px-4 sm:px-0">
            {/* Logo / Avatar */}
            <div className="relative w-28 h-28 sm:w-44 sm:h-44 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-4 sm:border-8 border-white shadow-2xl bg-slate-100 flex items-center justify-center shrink-0">
              {activeLogo ? (
                <Image
                  src={activeLogo}
                  alt={channelName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                /* Favorites fallback */
                <div className="bg-red-50 w-full h-full flex items-center justify-center">
                  <Heart className="w-12 h-12 text-red-500 fill-red-500" />
                </div>
              )}
            </div>

            {/* Name + handle */}
            <div className="pb-3 space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-4xl font-outfit font-black text-devo-950 tracking-tight drop-shadow-sm">
                  {channelName}
                </h1>
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 shrink-0" />
              </div>
              <span className="inline-block text-white bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] border border-white/20">
                {channelHandle}
              </span>
            </div>
          </div>
        </div>

        {/* ── Content Grid ────────────────────────────────────────────────── */}
        <div className="pt-24 px-4 sm:px-10 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Left Column: tabs / player / info ─────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Tab bar or Playlist breadcrumb */}
            <div className="order-3 lg:order-1">
              {!activePlaylistId ? (
                /* ── Tabs ── */
                <div className="flex bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-black uppercase tracking-widest text-[9px] sm:text-[10px]">
                  {TABS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => onTabChange(id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 transition-all ${
                        activeTab === id
                          ? "bg-devo-950 text-white"
                          : "text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                /* ── Playlist breadcrumb ── */
                <div className="flex items-center justify-between bg-devo-950 p-4 rounded-2xl shadow-lg sticky top-20 z-40">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-white font-outfit font-black text-sm truncate uppercase tracking-widest">
                      {activePlaylistName ?? "Playlist"}
                    </h3>
                  </div>
                  <button
                    onClick={onPlaylistBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    Back to Channel
                  </button>
                </div>
              )}
            </div>

            {/* Player + Video Info */}
            <VideoPlayerSection
              activeVideoId={activeVideoId}
              activeVideo={activeVideo}
              activeChannel={activeChannel}
              activeTab={activeTab}
              isLive={isLive}
              playerRef={playerRef}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onShare={onShare}
            />
          </div>

          {/* ── Right Column: video list ─────────────────────────────────── */}
          <VideoListSidebar
            activeVideoId={activeVideoId}
            activeChannel={activeChannel}
            activeTab={activeTab}
            activePlaylistId={activePlaylistId}
            favoriteVideos={favoriteVideos}
            onVideoSelect={onVideoSelect}
          />
        </div>
      </main>
    </div>
  );
}
