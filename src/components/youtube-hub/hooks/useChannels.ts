import { useQuery } from "@tanstack/react-query";
import type { Channel } from "../types";

async function fetchChannels(): Promise<Channel[]> {
  const res = await fetch("/api/youtube/channels");
  if (!res.ok) throw new Error("Failed to load channels");
  const data = await res.json();
  return data.channels ?? [];
}

/**
 * Fetches the admin-approved YouTube channel list from the database.
 *
 * - Cached for 10 minutes (channels rarely change)
 * - Returns an empty array while loading so callers don't need null checks
 *
 * @example
 * const { channels, isLoading, error } = useChannels();
 */
export function useChannels() {
  const query = useQuery<Channel[]>({
    queryKey: ["youtube-channels"],
    queryFn: fetchChannels,
    staleTime: 10 * 60 * 1000, // 10 minutes — channel list rarely changes
  });

  return {
    channels: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
