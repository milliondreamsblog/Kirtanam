import { useInfiniteQuery } from "@tanstack/react-query";
import type { VideoContentPage } from "../types";

/**
 * Fetches paginated video/playlist content for a given channel + tab + playlist.
 *
 * Replaces:
 *  - contentCache (useState)
 *  - fetchedRef (useRef)
 *  - loading / loadMoreLoading / error (useState)
 *  - fetchContent (useCallback + manual fetch)
 *
 * Usage:
 *  const { videos, logo, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error }
 *    = useVideoContent(channel.channel_id, "videos", null);
 */
export function useVideoContent(
  channelId: string | null,
  tab: string,
  playlistId: string | null,
) {
  const query = useInfiniteQuery<VideoContentPage>({
    queryKey: ["video-content", channelId, tab, playlistId ?? "main"],

    queryFn: async ({ pageParam }) => {
      const plParam = playlistId ? `&playlistId=${playlistId}` : "";
      const ptParam = pageParam ? `&pageToken=${pageParam}` : "";
      const bust = `&_t=${Date.now()}`; // keep parity with original cache-busting

      const res = await fetch(
        `/api/youtube?channelId=${channelId}&type=${tab}${plParam}${ptParam}${bust}`,
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      return res.json() as Promise<VideoContentPage>;
    },

    initialPageParam: "" as string,

    // Return undefined (no more pages) when nextPageToken is empty
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,

    // Only run when we have a real channelId and are not on the favorites tab
    enabled: !!channelId && tab !== "favorites",

    // 30 min stale time — mirrors the Cache-Control: s-maxage=1800 on the API route
    staleTime: 30 * 60 * 1000,

    // Keep previous data visible while fetching the next page
    placeholderData: (prev) => prev,
  });

  // Flatten all pages into a single video array for easy consumption
  const videos = query.data?.pages.flatMap((page) => page.items) ?? [];

  // Channel logo lives on the first page (returned by the YouTube API alongside items)
  const channelLogo = query.data?.pages[0]?.channelLogo ?? null;

  return {
    videos,
    channelLogo,

    // Pagination
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,

    // Status flags — maps 1-to-1 with the old loading / error state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,

    // Expose the raw query for advanced consumers
    query,
  };
}
