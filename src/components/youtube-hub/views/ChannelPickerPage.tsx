"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Heart,
  Layers,
  Loader2,
  Search,
  Video,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

// ─── Śrīla Prabhupāda quotes ─────────────────────────────────────────────────
// Drawn from his lectures, letters, and conversations. Sources where known.
interface Quote {
  text: string;
  lecture?: string; // e.g. "BG 2.13 lecture", "SB 1.7.6 lecture", "Letter to Hayagriva"
  year?: string;
  place?: string;
}

const PRABHUPADA_QUOTES: Quote[] = [
  {
    text: "Chant Hare Kṛṣṇa and your life will be sublime.",
    lecture: "Public address",
    year: "1966",
    place: "New York",
  },
  {
    text: "Spiritual life means absence of anxiety.",
    lecture: "BG 2.40 lecture",
    year: "1972",
    place: "London",
  },
  {
    text: "The mind is the cause of bondage, and the mind is the cause of liberation.",
    lecture: "BG 6.5 lecture",
    year: "1969",
    place: "Los Angeles",
  },
  {
    text: "Don't be sorry for any past mistakes. Kṛṣṇa is so kind that He has given the chance now to rectify.",
    lecture: "Letter to a disciple",
    year: "1969",
    place: "Los Angeles",
  },
  {
    text: "Real beauty means anything which gives us inspiration to advance in Kṛṣṇa consciousness.",
    lecture: "Conversation",
    year: "1975",
    place: "Vṛndāvana",
  },
  {
    text: "Your real life begins when you understand that you are an eternal servant of Kṛṣṇa.",
    lecture: "BG 4.11 lecture",
    year: "1973",
    place: "New York",
  },
  {
    text: "If we want peace, we must be conscious of Kṛṣṇa.",
    lecture: "BG 5.29 lecture",
    year: "1969",
    place: "London",
  },
  {
    text: "Just see the Lord in everything and everything in the Lord.",
    lecture: "SB 1.5.20 lecture",
    year: "1974",
    place: "Bombay",
  },
  {
    text: "The whole secret of success in life is to take refuge of the Supreme Lord.",
    lecture: "BG 18.66 lecture",
    year: "1973",
    place: "Hawaii",
  },
  {
    text: "We are not these bodies but spirit souls, eternally related to the Supreme.",
    lecture: "BG 2.13 lecture",
    year: "1972",
    place: "Pittsburgh",
  },
  {
    text: "Whatever you do, do it for Kṛṣṇa, and your life will become sublime.",
    lecture: "BG 9.27 lecture",
    year: "1970",
    place: "Hamburg",
  },
  {
    text: "By chanting alone, one can attain perfection.",
    lecture: "Caitanya-caritāmṛta lecture",
    year: "1975",
    place: "Māyāpura",
  },
];
import { useChannels } from "../hooks/useChannels";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import { useFeed } from "../hooks/useFeed";
import { useFavorites } from "../hooks/useFavorites";
import { useRecentlyWatched } from "../hooks/useRecentlyWatched";
import VideoShelf from "../components/VideoShelf";
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

  const { channels, isLoading: loadingChannels } = useChannels();
  const { results: globalResults, isSearching } = useGlobalSearch(
    searchQuery,
    [],
  );
  const {
    recentUploads,
    popular,
    isLoading: loadingFeed,
  } = useFeed();
  const { favoriteVideos, isLoading: loadingFavorites } = useFavorites();
  const { recentlyWatched } = useRecentlyWatched();

  // ── Hero quote: rotates daily, deterministic per day ─────────────────────
  // Computed once on mount inside an effect so SSR + hydration don't disagree
  // on the value (otherwise the day rolls over and the server sends a
  // different index than the client computes).
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteFading, setQuoteFading] = useState(false);

  useEffect(() => {
    const dayBucket = Math.floor(Date.now() / 86_400_000); // unique per UTC day
    setQuoteIndex(dayBucket % PRABHUPADA_QUOTES.length);
  }, []);

  const cycleQuote = () => {
    setQuoteFading(true);
    window.setTimeout(() => {
      setQuoteIndex((prev) => (prev + 1) % PRABHUPADA_QUOTES.length);
      setQuoteFading(false);
    }, 220);
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const openVideo = (item: VideoItem) => {
    const query = new URLSearchParams();
    if (item.channelId) query.set("channel", item.channelId);
    if (item.type === "playlist") {
      query.set("playlist", item.id);
    } else {
      query.set("v", item.id);
    }
    router.push(`${pathname}?${query.toString()}`);
  };

  const goToChannel = (channelId: string) => {
    onChannelSelect(channelId);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="border-b border-neutral-200 bg-[#EEE6DA]/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 sm:py-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-medium tracking-[0.18em] text-[#7A8F78]">
              hare kṛṣṇa
            </p>
            <button
              type="button"
              onClick={cycleQuote}
              aria-label="Show another quote"
              className="group mt-3 block w-full text-left"
            >
              <h1
                className={`font-display text-2xl sm:text-3xl lg:text-[34px] italic font-medium leading-snug text-[#3E4A45] transition-all duration-200 ease-out ${
                  quoteFading
                    ? "opacity-0 translate-y-1"
                    : "opacity-100 translate-y-0"
                }`}
              >
                <span className="text-[#7A8F78] mr-1.5 not-italic">“</span>
                {PRABHUPADA_QUOTES[quoteIndex].text}
                <span className="text-[#7A8F78] ml-1.5 not-italic">”</span>
              </h1>
              <div
                className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-neutral-500 transition-opacity duration-200 ${
                  quoteFading ? "opacity-0" : "opacity-100"
                }`}
              >
                <span className="tracking-[0.18em] uppercase">
                  — Śrīla Prabhupāda
                </span>
                {(() => {
                  const q = PRABHUPADA_QUOTES[quoteIndex];
                  const parts: string[] = [];
                  if (q.lecture) parts.push(q.lecture);
                  if (q.place) parts.push(q.place);
                  if (q.year) parts.push(q.year);
                  if (parts.length === 0) return null;
                  return (
                    <span className="text-neutral-400 italic">
                      · {parts.join(", ")}
                    </span>
                  );
                })()}
                <span className="text-[10px] text-[#7A8F78] opacity-0 transition-opacity group-hover:opacity-100">
                  click for another
                </span>
              </div>
            </button>
          </div>

          {/* Search */}
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search across the library"
                className="w-full rounded-md border border-neutral-200 bg-white pl-10 pr-10 h-10 text-[13px] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                </div>
              )}
              {searchQuery && !isSearching && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-6 pb-16 space-y-10">
        {searchQuery ? (
          <SearchResults
            results={globalResults}
            isSearching={isSearching}
            onSelect={openVideo}
            onClear={() => setSearchQuery("")}
          />
        ) : !loadingChannels && channels.length === 0 ? (
          <EmptyAccess />
        ) : (
          <>
            {/* Recently Watched (only if there's any history) */}
            {recentlyWatched.length > 0 && (
              <VideoShelf
                title="Continue watching"
                subtitle="Pick up where you left off"
                videos={recentlyWatched}
                onSelect={openVideo}
              />
            )}

            {/* Recent uploads from subscribed channels */}
            <VideoShelf
              title="Recently uploaded"
              subtitle="Latest across all your channels"
              videos={recentUploads}
              isLoading={loadingFeed}
              onSelect={openVideo}
              emptyLabel="Nothing new yet."
            />

            {/* Popular — random shuffle from across the library */}
            {(popular.length > 0 || loadingFeed) && (
              <VideoShelf
                title="From the library"
                subtitle="A fresh mix every visit"
                videos={popular}
                isLoading={loadingFeed}
                onSelect={openVideo}
              />
            )}

            {/* Favorites */}
            {(favoriteVideos.length > 0 || loadingFavorites) && (
              <VideoShelf
                title="Your favorites"
                subtitle={
                  favoriteVideos.length
                    ? `${favoriteVideos.length} saved`
                    : undefined
                }
                videos={favoriteVideos}
                isLoading={loadingFavorites}
                onSelect={openVideo}
                seeAllLabel="See all"
                onSeeAll={() => router.push(`${pathname}?tab=favorites`)}
              />
            )}

            {/* Channels grid */}
            <ChannelsSection
              channels={channels}
              loading={loadingChannels}
              onSelect={goToChannel}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Channels grid ────────────────────────────────────────────────────────────

function ChannelsSection({
  channels,
  loading,
  onSelect,
}: {
  channels: Array<{
    id: string;
    channel_id: string;
    name: string;
    handle: string;
    custom_logo: string;
  }>;
  loading: boolean;
  onSelect: (channelId: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="font-display text-[18px] sm:text-[20px] font-semibold text-[#3E4A45]">
            All channels
          </h2>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            Browse by teacher
          </p>
        </div>
        {!loading && (
          <p className="text-[12px] text-neutral-500">
            {channels.length} {channels.length === 1 ? "channel" : "channels"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="aspect-square w-full rounded-lg bg-neutral-200" />
                <div className="h-3 w-2/3 rounded-full bg-neutral-200" />
                <div className="h-2 w-1/3 rounded-full bg-neutral-100" />
              </div>
            ))
          : channels.map((channel, i) => (
              <button
                key={channel.id}
                onClick={() => onSelect(channel.channel_id)}
                className="group flex flex-col text-left"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg ring-1 ring-black/5 bg-neutral-100 transition-all duration-300 group-hover:ring-2 group-hover:ring-[#7A8F78]/40">
                  {channel.custom_logo ? (
                    <Image
                      src={channel.custom_logo}
                      alt={channel.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      unoptimized
                      priority={i < 6}
                      loading={i < 6 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#EEE6DA]">
                      <Video className="h-6 w-6 text-[#7A8F78]/60" />
                    </div>
                  )}
                </div>
                <div className="mt-2 px-0.5">
                  <p className="truncate text-[13px] font-medium text-neutral-900 group-hover:text-[#3E4A45] transition-colors">
                    {channel.name}
                  </p>
                  <p className="truncate text-[11px] text-neutral-500">
                    {channel.handle || "—"}
                  </p>
                </div>
              </button>
            ))}
      </div>
    </section>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyAccess() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e6ebe2]">
        <Video className="h-5 w-5 text-[#7A8F78]" />
      </div>
      <h2 className="text-[16px] font-semibold text-[#3E4A45]">
        No channels yet
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
        You have not been assigned any YouTube channels yet. Please contact your
        ashram admin to get access to channels approved for your seva.
      </p>
    </div>
  );
}

// ─── Search results grid ──────────────────────────────────────────────────────

function SearchResults({
  results,
  isSearching,
  onSelect,
  onClear,
}: {
  results: VideoItem[];
  isSearching: boolean;
  onSelect: (item: VideoItem) => void;
  onClear: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[18px] font-semibold text-[#3E4A45]">
          {isSearching
            ? "Searching…"
            : `${results.length} ${results.length === 1 ? "result" : "results"}`}
        </h2>
        <button
          onClick={onClear}
          className="rounded-md border border-neutral-200 px-2.5 h-7 text-[12px] text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Clear
        </button>
      </div>

      {results.length === 0 && !isSearching ? (
        <div className="py-16 text-center">
          <p className="text-[13px] text-neutral-500">No matches found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((item, i) => {
            const isPlaylist = item.type === "playlist";
            const isLive = item.type === "live";
            return (
              <button
                key={item.id + i}
                onClick={() => onSelect(item)}
                className="group flex flex-col text-left"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg ring-1 ring-black/5 bg-neutral-100">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    unoptimized
                  />
                  {(isLive || isPlaylist) && (
                    <div className="absolute bottom-1.5 left-1.5">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 rounded bg-[#C97064] px-1.5 py-0.5 text-[10px] font-medium text-white">
                          <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                          <Layers className="h-2.5 w-2.5" />
                          {item.playlistCount ?? 0}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-2 px-0.5">
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug text-neutral-900 group-hover:text-[#3E4A45] transition-colors">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-neutral-500">
                    {item.channelTitle ?? "Library"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

// Suppress unused warning for Heart icon import (kept for future use).
void Heart;
