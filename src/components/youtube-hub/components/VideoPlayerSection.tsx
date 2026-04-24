"use client";

import { useRef } from "react";
import { Clock, Radio, Heart, Share2 } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      {/* ── Player ─────────────────────────────────────────────────────── */}
      <div
        ref={playerRef}
        className="order-1 lg:order-2 scroll-mt-24 aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl relative"
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
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 px-6 text-center">
            <p className="text-white/50 font-bold text-sm uppercase tracking-widest leading-loose">
              {activeTab === "live"
                ? "No live streams currently"
                : "Select a video from the list to start watching"}
            </p>
          </div>
        )}
      </div>

      {/* ── Video Info Card ─────────────────────────────────────────────── */}
      {activeVideo && (
        <div className="order-2 lg:order-3 bg-white p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">

            {/* Title + Meta */}
            <div className="space-y-3 flex-1">
              <h2 className="text-xl sm:text-2xl font-outfit font-black text-devo-950 tracking-tight leading-tight">
                {activeVideo.title}
              </h2>
              <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest flex-wrap">
                {activeVideo.date && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {activeVideo.date}
                  </span>
                )}
                <span
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
                    isLive
                      ? "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  <Radio
                    className={`w-3.5 h-3.5 ${isLive ? "animate-pulse" : ""}`}
                  />
                  {isLive ? "LIVE" : activeTab.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 shrink-0">
              {/* Watch on YouTube */}
              <button
                onClick={() => {
                  if (!activeVideoId) return;
                  logOpenExternal(activeVideoId);
                  openExternal(
                    `https://www.youtube.com/watch?v=${activeVideoId}`
                  );
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-white rounded-xl hover:bg-[#cc0000] transition-all shadow-md active:scale-95"
                title="Watch on YouTube"
              >
                {/* YouTube logo SVG */}
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  Watch on YouTube
                </span>
              </button>

              {/* Favorite */}
              <button
                onClick={() => activeVideoId && onToggleFavorite(activeVideoId)}
                className={`p-3 rounded-xl transition-all group border ${
                  isFav
                    ? "bg-red-50 border-red-100 text-red-600"
                    : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                }`}
                title={isFav ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFav ? "fill-red-600" : "group-hover:text-red-500"
                  }`}
                />
              </button>

              {/* Share */}
              <button
                onClick={onShare}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                title="Share this lecture"
              >
                <Share2 className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-slate-400 text-sm font-medium leading-relaxed border-t border-slate-50 pt-4">
            Distraction-free devotional viewing. All content is curated from
            approved spiritual channels. Your favorites appear here
            automatically for quick access.
          </p>
        </div>
      )}
    </div>
  );
}
