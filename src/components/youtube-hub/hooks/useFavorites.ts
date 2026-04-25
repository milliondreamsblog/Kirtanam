import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FavoritesData, VideoItem } from "../types";

// ─── Auth Helper ─────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFavorites() {
  const queryClient = useQueryClient();

  // ── Query: fetch favorites list ──────────────────────────────────────────
  const query = useQuery<FavoritesData>({
    queryKey: ["favorites"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) return { items: [], favoriteIds: [] };

      const res = await fetch("/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch favorites");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ── Mutation: toggle a video in/out of favorites ─────────────────────────
  const toggleMutation = useMutation<
    { action: "added" | "removed"; video_id: string },
    Error,
    string, // videoId
    { previous?: FavoritesData }
  >({
    mutationFn: async (videoId: string) => {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/user/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ video_id: videoId }),
      });

      if (!res.ok) throw new Error("Failed to update favorite");
      return res.json();
    },

    // Optimistic update so the UI reacts instantly
    onMutate: async (videoId) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });

      const previous = queryClient.getQueryData<FavoritesData>(["favorites"]);

      queryClient.setQueryData<FavoritesData>(["favorites"], (old) => {
        if (!old) return { items: [], favoriteIds: [] };

        const isAlreadyFav = old.favoriteIds.includes(videoId);

        return {
          favoriteIds: isAlreadyFav
            ? old.favoriteIds.filter((id) => id !== videoId)
            : [videoId, ...old.favoriteIds],
          items: isAlreadyFav
            ? old.items.filter((v) => v.id !== videoId)
            : old.items, // New item metadata will be filled in on next refetch
        };
      });

      return { previous };
    },

    // Roll back on error
    onError: (
      _err,
      _videoId,
      context: { previous?: FavoritesData } | undefined,
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(["favorites"], context.previous);
      }
    },

    // Always refetch after settle so metadata is up to date
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Returns true if the given video ID is in the favorites list */
  const isFavorite = (videoId: string): boolean =>
    (query.data?.favoriteIds ?? []).includes(videoId);

  /** Add a specific VideoItem to the local cache immediately (used when toggling
   *  from a search result that isn't yet in yt_videos table) */
  const preloadVideoIntoCache = (video: VideoItem) => {
    queryClient.setQueryData<FavoritesData>(["favorites"], (old) => {
      if (!old) return { items: [video], favoriteIds: [video.id] };
      if (old.favoriteIds.includes(video.id)) return old;
      return {
        favoriteIds: [video.id, ...old.favoriteIds],
        items: [video, ...old.items],
      };
    });
  };

  return {
    /** Ordered list of favorite VideoItem objects */
    favoriteVideos: query.data?.items ?? [],
    /** Ordered list of favorite video ID strings */
    favoriteIds: query.data?.favoriteIds ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    /** Toggle a video's favorite status by its YouTube ID */
    toggle: toggleMutation.mutate,
    /** Same as toggle but returns a Promise (useful for async/await flows) */
    toggleAsync: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    /** Convenience checker */
    isFavorite,
    /** Optimistically insert a VideoItem before the server confirms */
    preloadVideoIntoCache,
  };
}
