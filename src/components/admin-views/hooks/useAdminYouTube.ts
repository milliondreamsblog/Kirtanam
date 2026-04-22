"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YTChannel {
  id: string;
  channel_id: string;
  name: string;
  handle: string;
  custom_logo: string;
  banner_style: string;
  is_active: boolean;
  order_index: number;
  sync_status: "idle" | "syncing" | "completed" | "error";
  last_sync_at: string | null;
  sync_error: string | null;
}

export interface YTChannelDraft {
  id?: string;
  channel_id?: string;
  name?: string;
  handle?: string;
  custom_logo?: string;
  banner_style?: string;
  is_active?: boolean;
  order_index?: number;
}

// ---------------------------------------------------------------------------
// Internal response shapes
// ---------------------------------------------------------------------------

interface ChannelsResponse {
  channels: YTChannel[];
}

interface SyncResponse {
  success: boolean;
  totalSynced: number;
}

interface YouTubeInfoResponse {
  channelTitle: string;
  channelLogo: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANNELS_QUERY_KEY = ["admin-yt-channels"] as const;

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function fetchChannels(): Promise<YTChannel[]> {
  const res = await fetch("/api/admin/youtube-channels");

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}: Failed to fetch channels`);
  }

  const data: ChannelsResponse = await res.json();
  return data.channels;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminYouTube(accessToken: string | null) {
  const queryClient = useQueryClient();

  // Local-only UI state – which channel_ids are mid-sync right now
  const [syncingChannels, setSyncingChannels] = useState<Set<string>>(new Set());

  // -------------------------------------------------------------------------
  // Main query – all channels
  // -------------------------------------------------------------------------

  const { data: channels = [], isLoading } = useQuery<YTChannel[]>({
    queryKey: CHANNELS_QUERY_KEY,
    queryFn: fetchChannels,
    staleTime: 0,
    enabled: !!accessToken,
  });

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function invalidateChannels(): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY });
  }

  async function parseErrorBody(res: Response): Promise<string> {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    return (body as { error?: string }).error ?? `HTTP ${res.status}`;
  }

  // -------------------------------------------------------------------------
  // saveChannel – POST (create) or PUT (update)
  // -------------------------------------------------------------------------

  async function saveChannel(draft: YTChannelDraft): Promise<void> {
    const isUpdate = !!draft.id;
    const method = isUpdate ? "PUT" : "POST";

    const res = await fetch("/api/admin/youtube-channels", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!res.ok) {
      const message = await parseErrorBody(res);
      throw new Error(`Failed to ${isUpdate ? "update" : "create"} channel: ${message}`);
    }

    await invalidateChannels();
  }

  // -------------------------------------------------------------------------
  // deleteChannel – DELETE with native confirm dialog
  // -------------------------------------------------------------------------

  async function deleteChannel(id: string): Promise<void> {
    const confirmed = window.confirm(
      "Are you sure you want to delete this channel? This action cannot be undone."
    );
    if (!confirmed) return;

    const res = await fetch(
      `/api/admin/youtube-channels?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const message = await parseErrorBody(res);
      throw new Error(`Failed to delete channel: ${message}`);
    }

    await invalidateChannels();
  }

  // -------------------------------------------------------------------------
  // syncChannel – triggers sync, manages syncingChannels set
  // -------------------------------------------------------------------------

  async function syncChannel(channelId: string): Promise<{ totalSynced: number }> {
    // Mark as syncing (immutable Set update)
    setSyncingChannels((prev) => {
      const next = new Set(prev);
      next.add(channelId);
      return next;
    });

    try {
      const res = await fetch("/api/admin/youtube/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });

      if (!res.ok) {
        const message = await parseErrorBody(res);
        throw new Error(`Sync failed: ${message}`);
      }

      const data: SyncResponse = await res.json();
      return { totalSynced: data.totalSynced };
    } finally {
      // Always clear the syncing flag, even on error
      setSyncingChannels((prev) => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  }

  // -------------------------------------------------------------------------
  // fetchYouTubeInfo – one-off fetch, NOT cached via React Query
  // -------------------------------------------------------------------------

  async function fetchYouTubeInfo(
    channelId: string
  ): Promise<{ channelTitle: string; channelLogo: string }> {
    const res = await fetch(
      `/api/youtube?channelId=${encodeURIComponent(channelId)}`
    );

    if (!res.ok) {
      const message = await parseErrorBody(res);
      throw new Error(`Failed to fetch YouTube info: ${message}`);
    }

    const data: YouTubeInfoResponse = await res.json();
    return {
      channelTitle: data.channelTitle,
      channelLogo: data.channelLogo,
    };
  }

  // -------------------------------------------------------------------------
  // swapChannelOrder – two parallel PUTs then invalidate
  // -------------------------------------------------------------------------

  async function swapChannelOrder(
    channelA: YTChannel,
    channelB: YTChannel
  ): Promise<void> {
    const [resA, resB] = await Promise.all([
      fetch("/api/admin/youtube-channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: channelA.id,
          order_index: channelB.order_index,
        }),
      }),
      fetch("/api/admin/youtube-channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: channelB.id,
          order_index: channelA.order_index,
        }),
      }),
    ]);

    if (!resA.ok || !resB.ok) {
      const failedChannel = !resA.ok ? channelA.name : channelB.name;
      throw new Error(`Failed to swap order for channel "${failedChannel}"`);
    }

    await invalidateChannels();
  }

  // -------------------------------------------------------------------------
  // uploadLogo – Supabase Storage upload, returns public URL
  // -------------------------------------------------------------------------

  async function uploadLogo(file: File, channelId: string): Promise<string> {
    const ext = file.name.split(".").pop() ?? "png";
    const storagePath = `logos/${channelId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("youtube-assets")
      .upload(storagePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(`Logo upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("youtube-assets")
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  }

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    channels,
    isLoading,
    syncingChannels,
    saveChannel,
    deleteChannel,
    syncChannel,
    fetchYouTubeInfo,
    swapChannelOrder,
    uploadLogo,
  };
}
