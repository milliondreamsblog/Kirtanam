import { createClient } from "@supabase/supabase-js";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse ISO-8601 durations like "PT1H2M30S" into seconds. Returns null for
 * live streams or malformed input (liveBroadcastContent=live has no duration).
 */
function isoDurationToSeconds(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return null;
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + min * 60 + s;
}

/**
 * fetch() with exponential backoff on 403 / 429 / 5xx from the YouTube API.
 * Throws on final failure so the caller can mark the sync as errored.
 */
async function fetchWithBackoff(url: string, attempts = 4): Promise<Response> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url);
    if (res.ok) return res;

    // Retry on throttling / transient server errors.
    if (res.status === 403 || res.status === 429 || res.status >= 500) {
      const waitMs = 500 * Math.pow(2, i); // 500, 1000, 2000, 4000
      console.warn(`[YouTube Sync] ${res.status} on attempt ${i + 1}, retrying in ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
      lastErr = new Error(`HTTP ${res.status}`);
      continue;
    }

    // Non-retryable — surface the error.
    return res;
  }
  throw lastErr ?? new Error("fetchWithBackoff exhausted retries");
}

/**
 * Try to atomically claim the sync lock. Returns true if we grabbed it,
 * false if another process is already syncing this channel.
 */
async function acquireSyncLock(channelId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("youtube_channels")
    .update({ sync_status: "syncing", sync_error: null })
    .eq("channel_id", channelId)
    .neq("sync_status", "syncing") // atomic: only transition if not already syncing
    .select("channel_id");

  if (error) {
    console.error(`[YouTube Sync] Lock error for ${channelId}:`, error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

/**
 * Fetch video details (duration + liveBroadcastContent) in batches of 50, so
 * we can classify short / live / video accurately.
 */
async function hydrateVideoKinds(videoIds: string[]): Promise<Map<string, { kind: string; duration: number | null }>> {
  const out = new Map<string, { kind: string; duration: number | null }>();
  if (videoIds.length === 0 || !YOUTUBE_API_KEY) return out;

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("part", "contentDetails,snippet");
    url.searchParams.set("key", YOUTUBE_API_KEY);

    try {
      const res = await fetchWithBackoff(url.toString());
      if (!res.ok) {
        console.warn(`[YouTube Sync] hydrateVideoKinds batch failed: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      for (const item of data.items ?? []) {
        const duration = isoDurationToSeconds(item.contentDetails?.duration);
        const live = item.snippet?.liveBroadcastContent;
        let kind = "video";
        if (live === "live") kind = "live";
        else if (duration !== null && duration > 0 && duration <= 60) kind = "short";
        out.set(item.id, { kind, duration });
      }
    } catch (err) {
      console.warn(`[YouTube Sync] hydrateVideoKinds error:`, err);
    }
  }

  return out;
}

export async function syncYouTubeChannel(channelId: string, isIncremental = false) {
  if (!channelId) throw new Error("Missing channelId");
  if (!YOUTUBE_API_KEY) throw new Error("YouTube API Key missing");

  console.log(
    `[YouTube Sync] Starting sync for channel ${channelId} (Mode: ${isIncremental ? "Incremental" : "Full"})`
  );

  const locked = await acquireSyncLock(channelId);
  if (!locked) {
    console.warn(`[YouTube Sync] Skipped ${channelId} — already syncing.`);
    return { success: false, totalSynced: 0, skipped: true };
  }

  try {
    // 1. Get the "Uploads" playlist ID
    const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelUrl.searchParams.set("id", channelId);
    channelUrl.searchParams.set("key", YOUTUBE_API_KEY);
    channelUrl.searchParams.set("part", "contentDetails");

    const cRes = await fetchWithBackoff(channelUrl.toString());
    const cData = await cRes.json();
    const uploadsId = cData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsId) {
      throw new Error(`Could not find uploads playlist for channel ${channelId}`);
    }

    // 2. Paginate through uploads. Collect IDs we saw this run so we can mark
    //    anything else as unavailable later (full-sync only).
    const seenVideoIds = new Set<string>();
    let nextPageToken = "";
    let totalSynced = 0;

    do {
      const itemsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      itemsUrl.searchParams.set("playlistId", uploadsId);
      itemsUrl.searchParams.set("part", "snippet,contentDetails");
      itemsUrl.searchParams.set("maxResults", "50");
      itemsUrl.searchParams.set("key", YOUTUBE_API_KEY);
      if (nextPageToken) itemsUrl.searchParams.set("pageToken", nextPageToken);

      const itemsRes = await fetchWithBackoff(itemsUrl.toString());
      const itemsData = await itemsRes.json();

      if (!itemsRes.ok) {
        throw new Error(`YouTube API Error: ${itemsData.error?.message || "Unknown error"}`);
      }

      const pageVideoIds: string[] = (itemsData.items || [])
        .map((item: any) => item.contentDetails?.videoId)
        .filter(Boolean);

      // Hydrate kind + duration for this page (one extra API call per 50 videos).
      const kindMap = await hydrateVideoKinds(pageVideoIds);

      const videos = (itemsData.items || [])
        .map((item: any) => {
          const vid = item.contentDetails?.videoId;
          if (!vid) return null;
          seenVideoIds.add(vid);
          const hydrated = kindMap.get(vid);
          return {
            video_id: vid,
            channel_id: channelId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail_url:
              item.snippet.thumbnails?.high?.url ||
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url,
            published_at: item.contentDetails.videoPublishedAt || item.snippet.publishedAt,
            kind: hydrated?.kind ?? "video",
            duration_seconds: hydrated?.duration ?? null,
            is_available: true,
            updated_at: new Date().toISOString(),
          };
        })
        .filter(Boolean);

      if (videos.length > 0) {
        const { error: upsertError } = await supabase
          .from("yt_videos")
          .upsert(videos, { onConflict: "video_id" });

        if (upsertError) throw upsertError;
        totalSynced += videos.length;
      }

      // Incremental (daily cron) only fetches the first page — latest 50.
      if (isIncremental) {
        nextPageToken = "";
      } else {
        nextPageToken = itemsData.nextPageToken;
      }
    } while (nextPageToken);

    // 3. Full sync only: flag any DB rows for this channel that didn't appear
    //    this run as unavailable. Preserves history (favorites, activity logs).
    if (!isIncremental && seenVideoIds.size > 0) {
      const { data: existing } = await supabase
        .from("yt_videos")
        .select("video_id")
        .eq("channel_id", channelId);

      const missing = (existing ?? [])
        .map((r) => r.video_id as string)
        .filter((id) => !seenVideoIds.has(id));

      if (missing.length > 0) {
        console.log(`[YouTube Sync] Marking ${missing.length} videos unavailable for ${channelId}`);
        await supabase
          .from("yt_videos")
          .update({ is_available: false, updated_at: new Date().toISOString() })
          .in("video_id", missing);
      }
    }

    // 4. Sync playlists (full sync only)
    if (!isIncremental) {
      const playlistsUrl = new URL("https://www.googleapis.com/youtube/v3/playlists");
      playlistsUrl.searchParams.set("channelId", channelId);
      playlistsUrl.searchParams.set("part", "snippet,contentDetails");
      playlistsUrl.searchParams.set("maxResults", "50");
      playlistsUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const pRes = await fetchWithBackoff(playlistsUrl.toString());
      const pData = await pRes.json();

      if (pRes.ok && pData.items) {
        const playlists = pData.items.map((item: any) => ({
          playlist_id: item.id,
          channel_id: channelId,
          title: item.snippet.title,
          thumbnail_url:
            item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
          video_count: item.contentDetails.itemCount,
          updated_at: new Date().toISOString(),
        }));

        if (playlists.length > 0) {
          const { error: pUpsertError } = await supabase
            .from("yt_playlists")
            .upsert(playlists, { onConflict: "playlist_id" });
          if (pUpsertError) console.error("Playlist upsert error:", pUpsertError);
        }
      }
    }

    await supabase
      .from("youtube_channels")
      .update({
        sync_status: "completed",
        last_sync_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq("channel_id", channelId);

    return { success: true, totalSynced };
  } catch (error: any) {
    console.error(`[YouTube Sync Error] Channel ${channelId}:`, error);

    await supabase
      .from("youtube_channels")
      .update({ sync_status: "error", sync_error: error.message })
      .eq("channel_id", channelId);

    throw error;
  }
}
