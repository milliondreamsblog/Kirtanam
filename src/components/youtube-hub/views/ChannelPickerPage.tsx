"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Loader2,
  X,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Layers,
  Play,
  Video,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useChannels } from "../hooks/useChannels";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import type { VideoItem } from "../types";

interface ChannelPickerPageProps {
  /** Called when the user clicks a channel card */
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
    selectedChannelIds
  );

  // Close filter dropdown when clicking outside
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
    <div className="min-h-screen bg-slate-50 py-10 sm:py-16 px-4">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-16">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center space-y-3 sm:space-y-5 mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl sm:text-6xl font-outfit font-black text-devo-950 tracking-tight leading-tight">
            Spiritual{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-devo-600 to-accent-gold">
              Library
            </span>
          </h1>
          <p className="text-xs sm:text-base text-devo-800 font-bold opacity-60 uppercase tracking-[0.2em]">
            Select a channel or search below
          </p>

          {/* ── Controls Row ─────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-8 sm:mt-12 max-w-4xl mx-auto px-4">

            {/* Search Bar */}
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-devo-500/10 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-devo-400" />
                <input
                  type="text"
                  placeholder="Search across wisdom library..."
                  className="w-full pl-14 pr-6 py-4 sm:py-5 bg-white border-2 border-slate-100 rounded-[2rem] font-bold text-sm sm:text-base shadow-xl focus:border-devo-500 outline-none transition-all placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-devo-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Action Group */}
            <div className="flex items-center gap-3">
              {/* Favorites Shortcut */}
              <button
                onClick={() => router.push(`${pathname}?tab=favorites`)}
                className="flex-1 sm:flex-none h-[52px] sm:h-[60px] px-6 flex items-center justify-center gap-2.5 bg-white border-2 border-red-50 hover:border-red-100 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-red-500 shadow-xl transition-all hover:scale-[1.02] hover:bg-red-50/30 active:scale-95 whitespace-nowrap group"
              >
                <Heart className="w-4 h-4 fill-red-500 group-hover:scale-125 transition-transform" />
                <span>My Favorites</span>
              </button>

              {/* Channel Filter */}
              <div className="relative flex-1 sm:flex-none" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`h-[52px] sm:h-[60px] w-full sm:w-auto px-6 flex items-center justify-center gap-3 bg-white border-2 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${
                    selectedChannelIds.length > 0
                      ? "border-devo-500 text-devo-600 bg-devo-50/50"
                      : "border-slate-100 text-slate-400"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>
                    {selectedChannelIds.length === 0
                      ? "All Channels"
                      : `${selectedChannelIds.length} Teachers`}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-300 ${
                      isFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Filter Dropdown */}
                {isFilterOpen && (
                  <div className="absolute top-full mt-4 right-0 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Filter Teachers
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            setSelectedChannelIds(
                              channels.map((c) => c.channel_id)
                            )
                          }
                          className="text-[9px] font-black text-devo-600 hover:text-devo-950 uppercase"
                        >
                          All
                        </button>
                        <button
                          onClick={() => setSelectedChannelIds([])}
                          className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                      {channels.map((ch) => {
                        const isSelected = selectedChannelIds.includes(
                          ch.channel_id
                        );
                        return (
                          <button
                            key={ch.id}
                            onClick={() => {
                              setSelectedChannelIds((prev) =>
                                isSelected
                                  ? prev.filter(
                                      (id) => id !== ch.channel_id
                                    )
                                  : [...prev, ch.channel_id]
                              );
                            }}
                            className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${
                              isSelected
                                ? "bg-devo-50 text-devo-900"
                                : "hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            {/* Checkbox */}
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                                isSelected
                                  ? "bg-devo-500 border-devo-500"
                                  : "border-slate-200"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>

                            {/* Logo */}
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-100 bg-slate-100 flex items-center justify-center">
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
                                <Video className="w-4 h-4 text-slate-300" />
                              )}
                            </div>

                            <span className="text-[11px] font-bold truncate text-left flex-1">
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

        {/* ── Content Area ─────────────────────────────────────────────────── */}
        {searchQuery ? (
          /* Search Results */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Results header */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-6 gap-4">
              <div className="flex flex-col items-center sm:items-start gap-1">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                  LECTURE SEARCH RESULTS ({globalResults.length})
                </h2>
                {selectedChannelIds.length > 0 && (
                  <p className="text-[10px] font-bold text-devo-600 uppercase tracking-widest">
                    Filtering by: {selectedChannelIds.length} Selected Teachers
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedChannelIds([]);
                }}
                className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
              >
                Back to Library
              </button>
            </div>

            {/* Results grid or empty state */}
            {globalResults.length === 0 && !isSearching ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                  No matching lectures found in our library
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {globalResults.map((item, i) => {
                  const isPlaylist = item.type === "playlist";
                  const isLiveItem = item.type === "live";

                  return (
                    <button
                      key={item.id + i}
                      onClick={() => handleSearchResultClick(item)}
                      className="group flex flex-col text-left"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full aspect-video">
                        {/* Playlist stack effect */}
                        {isPlaylist && (
                          <>
                            <div className="absolute -top-1.5 left-0 right-0 h-full bg-slate-200/80 rounded-3xl -z-10 translate-y-1 scale-x-[0.96] border border-slate-300/30" />
                            <div className="absolute -top-3 left-0 right-0 h-full bg-slate-300/60 rounded-3xl -z-20 translate-y-2 scale-x-[0.92] border border-slate-400/20" />
                          </>
                        )}

                        <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-sm group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-500 border border-slate-100 bg-slate-200">
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-1000"
                            unoptimized
                          />

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {isPlaylist ? (
                                <Layers className="w-6 h-6 text-white" />
                              ) : (
                                <Play className="w-6 h-6 text-white ml-1" />
                              )}
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="absolute bottom-3 right-3 flex gap-2">
                            {isLiveItem && (
                              <div className="px-2 py-1 bg-red-600 rounded-lg flex items-center gap-1.5 shadow-lg border border-red-500">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">
                                  LIVE
                                </span>
                              </div>
                            )}
                            <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/20 shadow-lg">
                              {isPlaylist
                                ? `${item.playlistCount ?? 0} VIDEOS`
                                : "LECTURE"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="pt-4 px-1 space-y-2.5">
                        <h3 className="font-outfit font-black text-xs sm:text-[13px] text-devo-950 line-clamp-2 leading-snug group-hover:text-devo-600 transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                            {isPlaylist ? (
                              <Layers className="w-3 h-3 text-slate-400" />
                            ) : (
                              <Video className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest">
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
          /* No channels assigned — admin must grant access first */
          <div className="max-w-xl mx-auto text-center py-16 px-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-6">
              <Video className="w-7 h-7 text-indigo-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-devo-950 tracking-tight mb-2">
              No channels yet
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              You haven't been assigned any YouTube channels yet. Please contact
              your ashram admin to get access to the channels approved for your
              seva.
            </p>
          </div>
        ) : (
          /* Channel Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-8 gap-x-4 sm:gap-x-6">
            {loadingChannels
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="space-y-4 animate-pulse">
                    <div className="w-full h-[180px] sm:h-[240px] rounded-[2rem] sm:rounded-[3rem] bg-slate-200 border border-slate-100" />
                    <div className="space-y-2 px-4 flex flex-col items-center">
                      <div className="h-3 bg-slate-200 rounded-full w-2/3" />
                      <div className="h-2 bg-slate-100 rounded-full w-1/3" />
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
                    {/* Card */}
                    <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] h-auto rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:scale-[1.05] active:scale-95 border border-slate-100 bg-slate-100">
                      {channel.custom_logo ? (
                        <Image
                          src={channel.custom_logo}
                          alt={channel.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          unoptimized
                          priority={i < 8}
                          loading={i < 8 ? "eager" : "lazy"}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
                          <Video className="w-12 h-12 text-slate-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    {/* Name */}
                    <div className="text-center space-y-0.5 px-2">
                      <h2 className="text-[11px] sm:text-[14px] font-black text-devo-950 leading-tight group-hover:text-devo-600 transition-colors uppercase tracking-tight">
                        {channel.name}
                      </h2>
                      <p className="text-slate-400 font-bold text-[8px] sm:text-[10px] uppercase tracking-widest">
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
