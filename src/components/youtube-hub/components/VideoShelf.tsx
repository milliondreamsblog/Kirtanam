"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Layers, Play } from "lucide-react";
import type { VideoItem } from "../types";

interface VideoShelfProps {
  title: string;
  /** Optional subtitle / count next to the title */
  subtitle?: string;
  videos: VideoItem[];
  isLoading?: boolean;
  /** "See all" link text + handler. If both provided, the link renders. */
  seeAllLabel?: string;
  onSeeAll?: () => void;
  /** Called when the user clicks a card */
  onSelect: (video: VideoItem) => void;
  /** Empty state label */
  emptyLabel?: string;
}

/**
 * Horizontal-scrolling shelf of video cards. Spotify/Netflix pattern:
 * no row wrapping, scrollable cards, optional left/right arrow controls
 * that fade in based on scroll position.
 */
export default function VideoShelf({
  title,
  subtitle,
  videos,
  isLoading = false,
  seeAllLabel,
  onSeeAll,
  onSelect,
  emptyLabel,
}: VideoShelfProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Track scroll position to enable/disable arrow buttons
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [videos.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8 * direction;
    el.scrollBy({ left: step, behavior: "smooth" });
  };

  if (!isLoading && videos.length === 0 && !emptyLabel) {
    return null;
  }

  return (
    <section className="space-y-2.5">
      {/* Header row */}
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="font-display text-[18px] sm:text-[20px] font-semibold text-[#3E4A45]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[12px] text-neutral-500">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {seeAllLabel && onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="rounded-md px-2 h-7 text-[12px] text-[#7A8F78] hover:bg-[#e6ebe2] hover:text-[#3E4A45] transition-colors"
            >
              {seeAllLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canLeft}
            aria-label="Scroll left"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canRight}
            aria-label="Scroll right"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable rail */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 -mx-4 px-4 sm:-mx-8 sm:px-8"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-[240px] sm:w-[260px] animate-pulse"
              >
                <div className="aspect-video w-full rounded-lg bg-neutral-200" />
                <div className="mt-2 h-3 w-3/4 rounded bg-neutral-200" />
                <div className="mt-1.5 h-2.5 w-1/2 rounded bg-neutral-100" />
              </div>
            ))
          : videos.length === 0
            ? (
              <div className="snap-start shrink-0 flex h-[150px] w-full items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
                <p className="text-[12px] text-neutral-500">{emptyLabel}</p>
              </div>
            )
            : videos.map((video) => (
                <ShelfCard
                  key={`${video.id}-${video.type}`}
                  video={video}
                  onSelect={onSelect}
                />
              ))}
      </div>
    </section>
  );
}

function ShelfCard({
  video,
  onSelect,
}: {
  video: VideoItem;
  onSelect: (video: VideoItem) => void;
}) {
  const isPlaylist = video.type === "playlist";
  const isLive = video.type === "live";

  return (
    <button
      type="button"
      onClick={() => onSelect(video)}
      className="group snap-start shrink-0 w-[240px] sm:w-[260px] text-left flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg ring-1 ring-black/5 bg-neutral-100">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            {isPlaylist ? (
              <Layers className="h-4 w-4 text-[#3E4A45]" />
            ) : (
              <Play className="ml-0.5 h-4 w-4 text-[#3E4A45] fill-[#3E4A45]" />
            )}
          </div>
        </div>

        {/* Live / playlist badge */}
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
                {video.playlistCount ?? 0}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-2 px-0.5">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-neutral-900 group-hover:text-[#3E4A45] transition-colors">
          {video.title}
        </p>
        <p className="mt-1 truncate text-[11px] text-neutral-500">
          {video.channelTitle && (
            <span>
              {video.channelTitle}
              {video.date && " · "}
            </span>
          )}
          {video.date}
        </p>
      </div>
    </button>
  );
}
