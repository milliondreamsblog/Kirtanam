"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Play,
  Loader2,
  AlertCircle,
  Radio,
  Layers,
  X,
} from "lucide-react";
import { useVideoContent } from "../hooks/useVideoContent";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import type { VideoItem, Channel } from "../types";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface VideoListSidebarProps {
  activeVideoId: string | null;
  activeChannel: Channel | null;
  activeTab: string;
  activePlaylistId: string | null;
  /** Favorite video IDs — used to filter the favorites tab */
  favoriteVideos: VideoItem[];
  onVideoSelect: (vid: VideoItem) => void;
}

function VideoListSidebarContent({
  activeVideoId,
  activeChannel,
  activeTab,
  activePlaylistId,
  favoriteVideos,
  onVideoSelect,
}: VideoListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Server data ────────────────────────────────────────────────────────────
  const {
    videos: channelVideos,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useVideoContent(
    activeChannel?.channel_id ?? null,
    activeTab,
    activePlaylistId,
  );

  const { results: globalResults, isSearching } = useGlobalSearch(
    searchQuery,
    activeChannel ? [activeChannel.channel_id] : [],
  );

  // ── Derived data ────────────────────────────────────────────────────────────
  const baseVideos = activeTab === "favorites" ? favoriteVideos : channelVideos;

  const filteredVideos = searchQuery
    ? baseVideos.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : baseVideos;

  // In the sidebar, global results only show videos from OTHER channels
  const otherChannelResults = globalResults.filter(
    (r) => r.channelId !== activeChannel?.channel_id,
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleGlobalResultClick = (item: VideoItem) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("channel", item.channelId ?? "");
    if (item.type === "playlist") {
      query.set("playlist", item.id);
      query.delete("v");
    } else {
      query.set("v", item.id);
      query.delete("playlist");
    }
    setSearchQuery("");
    router.push(`${pathname}?${query.toString()}`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="lg:col-span-4 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search this channel..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:border-devo-500 font-bold text-[11px] sm:text-xs outline-none transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Item Count */}
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-2 flex items-center gap-2">
        <Play className="w-3 h-3" />
        {isLoading
          ? "Loading…"
          : `${
              activePlaylistId ? "Playlist" : activeTab.toUpperCase()
            }: ${filteredVideos.length} Items`}
      </p>

      {/* List Container */}
      <div className="space-y-3 max-h-[1200px] overflow-y-auto pr-1 custom-scrollbar">
        {/* ── Loading Skeleton ── */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 bg-white rounded-[2rem] border-2 border-transparent animate-pulse"
            >
              <div className="w-32 sm:w-40 aspect-video rounded-2xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-3 bg-slate-200 rounded-full w-full" />
                <div className="h-3 bg-slate-200 rounded-full w-3/4" />
                <div className="h-2 bg-slate-100 rounded-full w-1/3 mt-4" />
              </div>
            </div>
          ))
        ) : error ? (
          /* ── Error State ── */
          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-red-100">
            <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-xs uppercase tracking-widest">
              Failed to load
            </p>
          </div>
        ) : (
          <>
            {/* ── Local Channel Results ── */}
            {filteredVideos.length > 0 && (
              <div className="space-y-3">
                {searchQuery && (
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-devo-600 pl-2">
                    Matches in this Channel
                  </p>
                )}

                {filteredVideos.map((vid: VideoItem) => {
                  const isActive = activeVideoId === vid.id;
                  const isPlaylist = vid.type === "playlist";

                  return (
                    <button
                      key={vid.id + vid.type}
                      onClick={() => onVideoSelect(vid)}
                      className={`w-full group flex items-start gap-4 p-4 rounded-[2rem] transition-all duration-300 border-2 text-left relative ${
                        isActive
                          ? "bg-white border-devo-400 shadow-lg"
                          : "bg-white/50 border-transparent hover:bg-white hover:border-slate-200"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-28 sm:w-40 aspect-video rounded-2xl overflow-hidden shrink-0 shadow-md">
                        <Image
                          src={vid.thumbnail}
                          alt={vid.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                          loading="eager"
                        />

                        {/* Playlist overlay */}
                        {isPlaylist && (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                            <Layers className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-black uppercase">
                              {vid.playlistCount ?? "?"} Videos
                            </span>
                          </div>
                        )}

                        {/* Now-playing indicator */}
                        {isActive && (
                          <div className="absolute inset-0 bg-devo-600/30 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                              <Radio className="w-4 h-4 text-devo-600 animate-pulse" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="space-y-1.5 py-1 flex-1 min-w-0">
                        <p
                          className={`font-outfit font-black text-[13px] sm:text-sm leading-snug line-clamp-3 ${
                            isActive ? "text-devo-700" : "text-slate-700"
                          }`}
                        >
                          {vid.title}
                        </p>
                        {!isPlaylist && (
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {vid.date}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Divider between local + global results ── */}
            {searchQuery &&
              filteredVideos.length > 0 &&
              otherChannelResults.length > 0 && (
                <div className="h-px bg-slate-200 my-6 mx-4" />
              )}

            {/* ── Global (Cross-channel) Search Results ── */}
            {searchQuery && (
              <div className="space-y-4 pt-2">
                {(otherChannelResults.length > 0 || isSearching) && (
                  <>
                    <div className="flex items-center justify-between px-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-devo-600">
                        Global Spiritual Search
                      </p>
                      {isSearching && (
                        <Loader2 className="w-3 h-3 animate-spin text-devo-400" />
                      )}
                    </div>

                    <div className="space-y-3">
                      {otherChannelResults.slice(0, 10).map((item, i) => (
                        <button
                          key={item.id + i}
                          onClick={() => handleGlobalResultClick(item)}
                          className="w-full group flex items-start gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 text-left"
                        >
                          <div className="relative w-20 aspect-video rounded-lg overflow-hidden shrink-0 shadow-sm">
                            <Image
                              src={item.thumbnail}
                              alt={item.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="font-outfit font-black text-[13px] leading-tight text-slate-700 line-clamp-2 group-hover:text-devo-600 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                              {item.channelTitle}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* No results state */}
                {!isSearching &&
                  otherChannelResults.length === 0 &&
                  searchQuery.length >= 2 &&
                  filteredVideos.length === 0 && (
                    <div className="text-center py-10 bg-white/30 rounded-3xl border-2 border-dashed border-slate-100">
                      <Search className="w-8 h-8 text-slate-200 mx-auto mb-2 opacity-50" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">
                        No matches discovered in the wider library
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* ── Load More ── */}
            {hasNextPage && activeTab !== "favorites" && !searchQuery && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-4 bg-white/50 hover:bg-white text-devo-600 rounded-[2rem] border-2 border-dashed border-devo-100 font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Load More Archives"
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Key-based reset wrapper.
 *
 * When `activeChannel`, `activeTab`, or `activePlaylistId` changes, React
 * unmounts and remounts `VideoListSidebarContent` via the `key` prop, which
 * naturally resets the local `searchQuery` state — no `useEffect` required.
 */
export default function VideoListSidebar(props: VideoListSidebarProps) {
  const resetKey = [
    props.activeChannel?.channel_id ?? "none",
    props.activeTab,
    props.activePlaylistId ?? "main",
  ].join("|");

  return <VideoListSidebarContent key={resetKey} {...props} />;
}
