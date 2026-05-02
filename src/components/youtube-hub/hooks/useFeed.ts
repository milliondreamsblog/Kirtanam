import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/auth-client";
import type { VideoItem } from "../types";

interface FeedVideoApi {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
  published: string;
  type: "video" | "live" | "short";
  channelId: string;
  channelTitle: string;
  channelLogo: string | null;
}

interface FeedMeta {
  allowedChannels: number;
  videosPerChannel: Record<string, number>;
  recentByChannel: Record<string, number>;
}

interface FeedResponse {
  recentUploads: FeedVideoApi[];
  popular: FeedVideoApi[];
  _meta?: FeedMeta;
}

/**
 * Server-aggregated landing shelves: recent uploads from across all the
 * channels the current user has access to. Cached client-side for 2 min.
 */
export function useFeed() {
  const query = useQuery<FeedResponse>({
    queryKey: ["landing-feed"],
    queryFn: async () => {
      const res = await authFetch("/api/youtube/feed");
      if (!res.ok) throw new Error("Failed to load feed");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const toVideoItem = (v: FeedVideoApi): VideoItem => ({
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnail,
    date: v.date,
    published: v.published,
    type: v.type,
    channelId: v.channelId,
    channelTitle: v.channelTitle,
  });

  return {
    recentUploads: (query.data?.recentUploads ?? []).map(toVideoItem),
    popular: (query.data?.popular ?? []).map(toVideoItem),
    meta: query.data?._meta,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
