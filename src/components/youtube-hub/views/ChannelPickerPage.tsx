"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  Heart,
  Layers,
  Loader2,
  Play,
  Search,
  SlidersHorizontal,
  Video,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useChannels } from "../hooks/useChannels";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import type { VideoItem } from "../types";

interface ChannelPickerPageProps {
  onChannelSelect: (channelId: string) => void;
}

export default function ChannelPickerPage({
  onChannelSelect,
}: ChannelPickerPageProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const { channels, isLoading: loadingChannels } = useChannels();
  const { results: globalResults, isSearching } = useGlobalSearch(
    searchQuery,
    selectedChannelIds,
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleChannels =
    selectedChannelIds.length === 0
      ? channels
      : channels.filter((c) => selectedChannelIds.includes(c.channel_id));

  const handleSearchResultClick = (item: VideoItem) => {
    const query = new URLSearchParams();
    query.set("channel", item.channelId ?? "");
    if (item.type === "playlist") {
      query.set("playlist", item.id);
    } else {
      query.set("v", item.id);
    }
    setSearchQuery("");
    router.push(`${pathname}?${query.toString()}`);
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-7xl space-y-10 sm:space-y-16">
        <div className="glass-panel mx-auto animate-in fade-in slide-in-from-top-4 rounded-[2.2rem] px-5 py-8 text-center duration-700 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-devo-700/60">
              Spiritual Library
            </p>
            <h1 className="font-display text-5xl leading-none text-devo-950 sm:text-7xl">
              Select a teacher,
              <span className="ml-3 inline-block bg-gradient-to-r from-devo-700 via-devo-500 to-amber-500 bg-clip-text text-transparent">
                resume a lecture
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-balance text-sm leading-7 text-devo-900/70 sm:text-base">
              Search across approved channels or enter a specific archive directly.
              Favorites and playlists stay available from the same surface.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-4xl flex-col items-stretch gap-4 px-4 sm:mt-12 sm:flex-row sm:items-center">
            <div className="group relative flex-1">
              <div className="absolute inset-0 rounded-full bg-devo-500/10 opacity-0 blur-2xl transition-opacity group-focus-within:opacity-100" />
              <div className="relative">
                <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-devo-400" />
                <input
                  type="text"
                  placeholder="Search across wisdom library..."
                  className="w-full rounded-[2rem] border-2 border-white bg-white/90 py-4 pl-14 pr-6 text-sm font-bold shadow-xl outline-none transition-all placeholder:text-slate-300 focus:border-devo-500 sm:py-5 sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-5 w-5 animate-spin text-devo-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`${pathname}?tab=favorites`)}
                className="group flex h-[52px] flex-1 items-center justify-center gap-2.5 whitespace-nowrap rounded-[2rem] border-2 border-white bg-white/85 px-6 text-[10px] font-black uppercase tracking-widest text-red-500 shadow-xl transition-all hover:scale-[1.02] hover:bg-red-50/30 active:scale-95 sm:h-[60px] sm:flex-none"
              >
                <Heart className="h-4 w-4 fill-red-500 transition-transform group-hover:scale-125" />
                <span>My Favorites</span>
              </button>

              <div className="relative flex-1 sm:flex-none" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex h-[52px] w-full items-center justify-center gap-3 rounded-[2rem] border-2 px-6 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 sm:h-[60px] sm:w-auto ${
                    selectedChannelIds.length > 0
                      ? "border-devo-500 bg-devo-50/50 text-devo-600"
                      : "border-white bg-white/85 text-slate-500"
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>
                    {selectedChannelIds.length === 0
                      ? "All Channels"
                      : `${selectedChannelIds.length} Teachers`}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-300 ${
                      isFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 top-full z-[100] mt-4 w-72 rounded-3xl border border-white bg-white/95 p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="mb-4 flex items-center justify-between px-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Filter Teachers
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            setSelectedChannelIds(channels.map((c) => c.channel_id))
                          }
                          className="text-[9px] font-black uppercase text-devo-600 hover:text-devo-950"
                        >
                          All
                        </button>
                        <button
                          onClick={() => setSelectedChannelIds([])}
                          className="text-[9px] font-black uppercase text-slate-400 hover:text-red-500"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="custom-scrollbar max-h-80 space-y-1 overflow-y-auto pr-2">
                      {channels.map((ch) => {
                        const isSelected = selectedChannelIds.includes(
                          ch.channel_id,
                        );

                        return (
                          <button
                            key={ch.id}
                            onClick={() => {
                              setSelectedChannelIds((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== ch.channel_id)
                                  : [...prev, ch.channel_id],
                              );
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl p-2 transition-all ${
                              isSelected
                                ? "bg-devo-50 text-devo-900"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                isSelected
                                  ? "border-devo-500 bg-devo-500"
                                  : "border-slate-200"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-slate-100">
                              {ch.custom_logo ? (
                                <Image
                                  src={ch.custom_logo}
                                  alt={ch.name}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <Video className="h-4 w-4 text-slate-300" />
                              )}
                            </div>

                            <span className="flex-1 truncate text-left text-[11px] font-bold">
                              {ch.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {searchQuery ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row">
              <div className="flex flex-col items-center gap-1 sm:items-start">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                  Lecture Search Results ({globalResults.length})
                </h2>
                {selectedChannelIds.length > 0 && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-devo-600">
                    Filtering by: {selectedChannelIds.length} selected teachers
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedChannelIds([]);
                }}
                className="rounded-full bg-slate-900 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-black"
              >
                Back to Library
              </button>
            </div>

            {globalResults.length === 0 && !isSearching ? (
              <div className="py-20 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <X className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  No matching lectures found in our library
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {globalResults.map((item, i) => {
                  const isPlaylist = item.type === "playlist";
                  const isLiveItem = item.type === "live";

                  return (
                    <button
                      key={item.id + i}
                      onClick={() => handleSearchResultClick(item)}
                      className="group flex flex-col text-left"
                    >
                      <div className="relative aspect-video w-full">
                        {isPlaylist && (
                          <>
                            <div className="absolute -top-1.5 left-0 right-0 -z-10 h-full translate-y-1 scale-x-[0.96] rounded-3xl border border-slate-300/30 bg-slate-200/80" />
                            <div className="absolute -top-3 left-0 right-0 -z-20 h-full translate-y-2 scale-x-[0.92] rounded-3xl border border-slate-400/20 bg-slate-300/60" />
                          </>
                        )}

                        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-100 bg-slate-200 shadow-sm transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-xl">
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            unoptimized
                          />

                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                              {isPlaylist ? (
                                <Layers className="h-6 w-6 text-white" />
                              ) : (
                                <Play className="ml-1 h-6 w-6 text-white" />
                              )}
                            </div>
                          </div>

                          <div className="absolute bottom-3 right-3 flex gap-2">
                            {isLiveItem && (
                              <div className="flex items-center gap-1.5 rounded-lg border border-red-500 bg-red-600 px-2 py-1 shadow-lg">
                                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white">
                                  Live
                                </span>
                              </div>
                            )}
                            <div className="rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white shadow-lg backdrop-blur-md">
                              {isPlaylist
                                ? `${item.playlistCount ?? 0} videos`
                                : "lecture"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5 px-1 pt-4">
                        <h3 className="line-clamp-2 font-outfit text-xs font-black leading-snug text-devo-950 transition-colors group-hover:text-devo-600 sm:text-[13px]">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100">
                            {isPlaylist ? (
                              <Layers className="h-3 w-3 text-slate-400" />
                            ) : (
                              <Video className="h-3 w-3 text-slate-400" />
                            )}
                          </div>
                          <p className="truncate text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            {item.channelTitle ?? "Devotional Library"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : !loadingChannels && channels.length === 0 ? (
          <div className="mx-auto max-w-xl px-6 py-16 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Video className="h-7 w-7 text-indigo-500" />
            </div>
            <h2 className="mb-2 text-xl font-black tracking-tight text-devo-950 sm:text-2xl">
              No channels yet
            </h2>
            <p className="text-sm leading-relaxed text-slate-500">
              You have not been assigned any YouTube channels yet. Please contact
              your ashram admin to get access to the channels approved for your
              seva.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {loadingChannels
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="space-y-4 animate-pulse">
                    <div className="h-[180px] w-full rounded-[2rem] border border-slate-100 bg-slate-200 sm:h-[240px] sm:rounded-[3rem]" />
                    <div className="flex flex-col items-center space-y-2 px-4">
                      <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                      <div className="h-2 w-1/3 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))
              : visibleChannels.map((channel, i) => (
                  <button
                    key={channel.id}
                    onClick={() => onChannelSelect(channel.channel_id)}
                    className="group flex flex-col items-center gap-4 animate-in zoom-in duration-700"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="relative h-auto w-full aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/80 bg-slate-100 shadow-xl transition-all duration-500 group-hover:scale-[1.05] group-hover:shadow-2xl active:scale-95 sm:aspect-[3/4] sm:rounded-[3rem]">
                      {channel.custom_logo ? (
                        <Image
                          src={channel.custom_logo}
                          alt={channel.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          unoptimized
                          priority={i < 8}
                          loading={i < 8 ? "eager" : "lazy"}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                          <Video className="h-12 w-12 text-slate-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>

                    <div className="space-y-0.5 px-2 text-center">
                      <h2 className="text-[11px] font-black uppercase tracking-tight text-devo-950 transition-colors group-hover:text-devo-600 sm:text-[14px]">
                        {channel.name}
                      </h2>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">
                        {channel.handle}
                      </p>
                    </div>
                  </button>
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
