import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { authFetch } from "@/lib/auth-client";
import type { VideoItem } from "../types";

interface SearchResult {
  items: VideoItem[];
  count: number;
}

/**
 * Debounced cross-channel search hook.
 * Searches across all synced yt_videos + yt_playlists in Supabase
 * via the /api/youtube/search RPC endpoint.
 *
 * @param query      - Raw search string from the input (debounced internally)
 * @param channelIds - Optional list of channel_id strings to filter results
 */
export function useGlobalSearch(query: string, channelIds: string[] = []) {
  const debouncedQuery = useDebounce(query, 400);

  const result = useQuery<SearchResult>({
    queryKey: ["youtube-search", debouncedQuery, channelIds],
    queryFn: async () => {
      let url = `/api/youtube/search?q=${encodeURIComponent(debouncedQuery)}`;
      if (channelIds.length > 0) {
        url += `&channelId=${channelIds.join(",")}`;
      }

      const res = await authFetch(url);
      if (res.status === 401) return { items: [], count: 0 };
      if (!res.ok) throw new Error("Search request failed");

      return res.json() as Promise<SearchResult>;
    },
    // Only fire when there's a meaningful query
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes — search results are stable enough
    // Keep the previous results visible while a new search is loading
    // (prevents the results grid from flickering to empty on each keystroke)
    placeholderData: (previousData) => previousData,
  });

  return {
    /** Flat list of matched VideoItem results */
    results: result.data?.items ?? [],
    /** True while a new search request is in-flight */
    isSearching: result.isFetching,
    /** The debounced query that was actually sent — useful for highlighting */
    debouncedQuery,
    /** Expose raw query state for consumers that need it */
    isError: result.isError,
  };
}
