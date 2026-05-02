"use client";

import { Heart, Share2, ExternalLink } from "lucide-react";
import OptimizedVideoPlayer from "@/components/OptimizedVideoPlayer";
import { openExternal } from "@/lib/device";
import { logOpenExternal } from "@/lib/auth-client";
import type { VideoItem, Channel } from "../types";

interface VideoPlayerSectionProps {
  activeVideoId: string | null;
  activeVideo: VideoItem | null;
  activeChannel: Channel | null;
  activeTab: string;
  isLive: boolean;
  /** Forwarded ref so the parent can scroll this section into view on video select */
  playerRef: React.RefObject<HTMLDivElement | null>;
  /** IDs of all currently favorited videos */
  favoriteIds: string[];
  /** Called when the user clicks the favorite heart button */
  onToggleFavorite: (videoId: string) => void;
  /** Called when the user clicks the share button */
  onShare: () => void;
}

export default function VideoPlayerSection({
  activeVideoId,
  activeVideo,
  activeChannel,
  activeTab,
  isLive,
  playerRef,
  favoriteIds,
  onToggleFavorite,
  onShare,
}: VideoPlayerSectionProps) {
  const isFav = activeVideoId ? favoriteIds.includes(activeVideoId) : false;

  return (
    <div className="flex flex-col">
      {/* Player — 12px corner, no shadow drama */}
      <div
        ref={playerRef}
        className="scroll-mt-24 aspect-video bg-black overflow-hidden relative rounded-xl ring-1 ring-black/5"
      >
        {activeVideoId ? (
          <OptimizedVideoPlayer
            key={activeVideoId}
            videoId={activeVideoId}
            title={activeVideo?.title ?? "Video"}
            artist={activeChannel?.name ?? "My Favorites"}
            thumbnail={activeVideo?.thumbnail}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 px-6 text-center">
            <p className="text-[13px] font-medium text-neutral-400">
              {activeTab === "live"
                ? "No live streams currently"
                : "Select a video from the list to start watching"}
            </p>
          </div>
        )}
      </div>

      {/* Info row — title + meta on the left, actions on the right */}
      {activeVideo && (
        <div className="mt-4 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[20px] font-semibold leading-snug text-pine sm:text-[22px]">
              {activeVideo.title}
            </h2>

            <div className="mt-1.5 flex items-center gap-2 text-[12px] text-neutral-500">
              {activeChannel?.name && (
                <span className="truncate font-medium text-neutral-700">
                  {activeChannel.name}
                </span>
              )}
              {activeChannel?.name && activeVideo.date && (
                <span className="text-neutral-300">·</span>
              )}
              {activeVideo.date && <span>{activeVideo.date}</span>}
              {isLive && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C97064] opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#C97064]" />
                    </span>
                    <span className="font-medium text-[#C97064]">Live</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons — ghost icon buttons */}
          <div className="flex flex-shrink-0 items-center gap-1">
            <ActionButton
              onClick={() => activeVideoId && onToggleFavorite(activeVideoId)}
              label={isFav ? "Remove from favorites" : "Add to favorites"}
              active={isFav}
            >
              <Heart
                className={`h-4 w-4 ${
                  isFav ? "fill-[#3E4A45] text-[#3E4A45]" : ""
                }`}
              />
            </ActionButton>

            <ActionButton onClick={onShare} label="Share">
              <Share2 className="h-4 w-4" />
            </ActionButton>

            <ActionButton
              onClick={() => {
                if (!activeVideoId) return;
                logOpenExternal(activeVideoId);
                openExternal(`https://www.youtube.com/watch?v=${activeVideoId}`);
              }}
              label="Open on YouTube"
            >
              <ExternalLink className="h-4 w-4" />
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  label,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
        active
          ? "bg-[#e6ebe2] text-[#3E4A45]"
          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      {children}
    </button>
  );
}
