"use client";

import { useCallback, useEffect, useState } from "react";
import type { VideoItem } from "../types";

const STORAGE_KEY = "kritaman.recentlyWatched";
const MAX_ITEMS = 12;

interface StoredItem {
  id: string;
  title: string;
  thumbnail: string;
  channelId?: string;
  channelTitle?: string;
  type: "video" | "live" | "short" | "playlist";
  watchedAt: number;
}

function safeRead(): StoredItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is StoredItem =>
        i && typeof i.id === "string" && typeof i.title === "string",
    );
  } catch {
    return [];
  }
}

function safeWrite(items: StoredItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded or storage disabled — silently drop.
  }
}

/**
 * Tracks the videos the user has recently played, persisted in localStorage.
 *
 * No backend / no schema change. Survives sessions, scoped per browser.
 * Holds the most recent `MAX_ITEMS` plays, deduped by video id.
 */
export function useRecentlyWatched() {
  const [items, setItems] = useState<StoredItem[]>([]);

  // Hydrate from storage on mount
  useEffect(() => {
    setItems(safeRead());
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(safeRead());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Insert (or refresh) a video at the top of the list. */
  const trackPlay = useCallback((video: VideoItem) => {
    if (!video?.id) return;
    setItems((prev) => {
      const without = prev.filter((i) => i.id !== video.id);
      const next: StoredItem[] = [
        {
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          channelId: video.channelId,
          channelTitle: video.channelTitle,
          type: video.type,
          watchedAt: Date.now(),
        },
        ...without,
      ].slice(0, MAX_ITEMS);
      safeWrite(next);
      return next;
    });
  }, []);

  /** Remove every entry. */
  const clear = useCallback(() => {
    safeWrite([]);
    setItems([]);
  }, []);

  /** Convert stored items to VideoItem shape for shared shelf rendering. */
  const recentlyWatched: VideoItem[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    thumbnail: i.thumbnail,
    type: i.type,
    published: "",
    channelId: i.channelId,
    channelTitle: i.channelTitle,
  }));

  return { recentlyWatched, trackPlay, clear };
}
