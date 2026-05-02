"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Play,
  Layers,
  Heart,
  ArrowLeft,
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
  const channelName   = activeChannel?.name        ?? "My Library";
  const channelHandle = activeChannel?.handle      ?? "Favorites";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">

      {/* ── Channel Navigation (desktop sidebar + mobile top bar) ───────── */}
      <ChannelSidebarNav
        channels={channels}
        activeChannelId={activeChannel?.channel_id ?? null}
        onSelect={handleChannelSelect}
        onBack={onBack}
      />

      {/* ── Main Content ──────────────────────────────────────────────────  */}
      <main className="flex-1 min-w-0 overflow-y-auto">

        {/* ── Slim channel header (replaces the giant banner) ─────────── */}
        <header className="border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-3 px-4 sm:px-8 h-14">
            {/* Avatar */}
            <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-black/5 bg-neutral-100">
              {activeLogo ? (
                <Image
                  src={activeLogo}
                  alt={channelName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-[#7A8F78] fill-[#7A8F78]" />
                </div>
              )}
            </div>

            {/* Name + handle */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="truncate font-display text-[18px] font-semibold text-[#3E4A45]">
                  {channelName}
                </h1>
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-[#7A8F78]" />
              </div>
              <p className="truncate text-[11px] text-neutral-500">
                {channelHandle}
              </p>
            </div>

            {/* Tabs (or breadcrumb when in a playlist) */}
            {!activePlaylistId ? (
              <nav className="hidden sm:flex items-center gap-0.5 rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
                {TABS.map(({ id, label, Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => onTabChange(id)}
                      className={`inline-flex items-center gap-1.5 rounded px-2.5 h-7 text-[12px] font-medium transition-colors ${
                        active
                          ? "bg-white text-[#3E4A45] shadow-sm"
                          : "text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </nav>
            ) : (
              <button
                onClick={onPlaylistBack}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 h-7 text-[12px] text-neutral-700 hover:bg-neutral-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="max-w-[180px] truncate">
                  {activePlaylistName ?? "Playlist"}
                </span>
              </button>
            )}
          </div>

          {/* Mobile-only tab strip */}
          {!activePlaylistId && (
            <nav className="flex sm:hidden border-t border-neutral-200">
              {TABS.map(({ id, label, Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => onTabChange(id)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 h-10 text-[12px] font-medium border-b-2 transition-colors ${
                      active
                        ? "border-[#7A8F78] text-[#3E4A45]"
                        : "border-transparent text-neutral-500"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </nav>
          )}
        </header>

        {/* ── Content Grid ────────────────────────────────────────────────── */}
        <div className="px-4 sm:px-8 pt-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left column: player + info */}
          <div className="lg:col-span-8 flex flex-col">
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

          {/* Right column: video list */}
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
