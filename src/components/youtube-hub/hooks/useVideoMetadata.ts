import { useQuery } from "@tanstack/react-query";
import type { VideoItem } from "../types";

/**
 * Fetches metadata for a single video by its YouTube ID.
 *
 * This is used as a fallback when a video ID is present in the URL (e.g. ?v=abc123)
 * but that video isn't in the currently loaded channel content cache — for example,
 * when a user opens a direct shared link.
 *
 * staleTime is set to Infinity because video metadata (title, thumbnail) never changes.
 */
export function useVideoMetadata(videoId: string | null) {
  return useQuery<VideoItem>({
    queryKey: ["video-metadata", videoId],
    queryFn: async () => {
      const res = await fetch(`/api/youtube?videoId=${videoId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Failed to fetch video metadata (HTTP ${res.status})`);
      }
      return res.json();
    },
    enabled: !!videoId,
    staleTime: Infinity,   // Video title/thumbnail never changes — cache forever
    gcTime: Infinity,      // Keep in cache for the entire session
    retry: 1,
  });
}
