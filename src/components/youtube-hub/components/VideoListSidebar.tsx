"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Loader2,
  AlertCircle,
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

  const baseVideos = activeTab === "favorites" ? favoriteVideos : channelVideos;

  const filteredVideos = searchQuery
    ? baseVideos.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : baseVideos;

  const otherChannelResults = globalResults.filter(
    (r) => r.channelId !== activeChannel?.channel_id,
  );

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

  return (
    <div className="lg:col-span-4 flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search this channel"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-neutral-200 bg-white py-1.5 pl-8 pr-8 text-[13px] outline-none transition-colors focus:border-neutral-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between px-1 text-[11px] text-neutral-500">
        <span className="font-medium">
          {activePlaylistId ? "Playlist" : capitalize(activeTab)}
        </span>
        <span>
          {isLoading
            ? "Loading…"
            : `${filteredVideos.length} ${filteredVideos.length === 1 ? "item" : "items"}`}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 max-h-[1200px] overflow-y-auto custom-scrollbar -mx-1">
        {isLoading ? (
          <ul className="space-y-1 px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="flex gap-3 p-2 rounded-md animate-pulse"
              >
                <div className="w-32 aspect-video rounded bg-neutral-200 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-2.5 bg-neutral-200 rounded-full" />
                  <div className="h-2.5 bg-neutral-200 rounded-full w-3/4" />
                  <div className="h-2 bg-neutral-100 rounded-full w-1/3 mt-2" />
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="text-center py-12 px-4">
            <AlertCircle className="h-5 w-5 text-[#C97064] mx-auto mb-2" />
            <p className="text-[13px] text-neutral-500">Failed to load</p>
          </div>
        ) : (
          <>
            {filteredVideos.length > 0 && (
              <ul className="space-y-0.5 px-1">
                {searchQuery && (
                  <li className="px-1 pb-1 pt-1 text-[11px] font-medium text-neutral-500">
                    Matches in this channel
                  </li>
                )}

                {filteredVideos.map((vid: VideoItem) => {
                  const isActive = activeVideoId === vid.id;
                  const isPlaylist = vid.type === "playlist";

                  return (
                    <li key={vid.id + vid.type}>
                      <button
                        onClick={() => onVideoSelect(vid)}
                        className={`group relative flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors ${
                          isActive
                            ? "bg-[#e6ebe2]"
                            : "hover:bg-neutral-50"
                        }`}
                      >
                        {/* Active indicator strip */}
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-[#7A8F78]" />
                        )}

                        {/* Thumbnail */}
                        <div className="relative w-28 sm:w-32 aspect-video rounded overflow-hidden shrink-0 ring-1 ring-black/5">
                          <Image
                            src={vid.thumbnail}
                            alt={vid.title}
                            fill
                            className="object-cover"
                            unoptimized
                            loading="eager"
                          />

                          {/* Playlist overlay */}
                          {isPlaylist && (
                            <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center text-white">
                              <Layers className="h-4 w-4 mb-0.5" />
                              <span className="text-[10px] font-medium">
                                {vid.playlistCount ?? "?"} videos
                              </span>
                            </div>
                          )}

                          {/* Now-playing dot */}
                          {isActive && !isPlaylist && (
                            <div className="absolute bottom-1 right-1 flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7A8F78] opacity-70" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7A8F78]" />
                            </div>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex-1 min-w-0 py-0.5">
                          <p
                            className={`text-[13px] leading-snug line-clamp-3 ${
                              isActive
                                ? "text-[#3E4A45] font-medium"
                                : "text-neutral-800"
                            }`}
                          >
                            {vid.title}
                          </p>
                          {!isPlaylist && vid.date && (
                            <p className="mt-1 text-[11px] text-neutral-500">
                              {vid.date}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Divider between local + global */}
            {searchQuery &&
              filteredVideos.length > 0 &&
              otherChannelResults.length > 0 && (
                <div className="h-px bg-neutral-200 my-3 mx-2" />
              )}

            {/* Global cross-channel search */}
            {searchQuery && (
              <div className="px-1">
                {(otherChannelResults.length > 0 || isSearching) && (
                  <>
                    <div className="flex items-center justify-between px-1 py-1.5">
                      <p className="text-[11px] font-medium text-neutral-500">
                        From other channels
                      </p>
                      {isSearching && (
                        <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />
                      )}
                    </div>

                    <ul className="space-y-0.5">
                      {otherChannelResults.slice(0, 10).map((item, i) => (
                        <li key={item.id + i}>
                          <button
                            onClick={() => handleGlobalResultClick(item)}
                            className="group flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-neutral-50 transition-colors"
                          >
                            <div className="relative w-20 aspect-video rounded overflow-hidden shrink-0 ring-1 ring-black/5">
                              <Image
                                src={item.thumbnail}
                                alt={item.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0 py-0.5">
                              <p className="text-[13px] leading-snug line-clamp-2 text-neutral-800 group-hover:text-[#3E4A45] transition-colors">
                                {item.title}
                              </p>
                              <p className="mt-1 text-[11px] text-neutral-500 truncate">
                                {item.channelTitle}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* No results */}
                {!isSearching &&
                  otherChannelResults.length === 0 &&
                  searchQuery.length >= 2 &&
                  filteredVideos.length === 0 && (
                    <div className="text-center py-10 px-4">
                      <Search className="h-5 w-5 text-neutral-300 mx-auto mb-1.5" />
                      <p className="text-[12px] text-neutral-500">
                        No matches found.
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Load more */}
            {hasNextPage && activeTab !== "favorites" && !searchQuery && (
              <div className="px-1 pt-1">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full rounded-md border border-dashed border-neutral-200 py-2 text-[12px] text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
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
