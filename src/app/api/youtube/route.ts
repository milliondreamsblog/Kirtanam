import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireUser,
  getUserAllowedChannelIds,
  logActivity,
} from "@/lib/auth-server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CACHE_SECONDS = 1800; // 30 minutes

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Resolve the owning channel of a playlist or video from our synced index. */
async function lookupOwningChannel(kind: "playlist" | "video", id: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const table = kind === "playlist" ? "yt_playlists" : "yt_videos";
  const idCol = kind === "playlist" ? "playlist_id" : "video_id";
  const { data } = await supabaseAdmin
    .from(table)
    .select("channel_id")
    .eq(idCol, id)
    .single();
  return (data?.channel_id as string | undefined) ?? null;
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const channelId = searchParams.get("channelId");
  const playlistId = searchParams.get("playlistId");
  const type = searchParams.get("type") ?? "videos";
  const pageToken = searchParams.get("pageToken") ?? "";
  const maxResults = Math.min(parseInt(searchParams.get("maxResults") ?? "50"), 50);

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "API Key missing" }, { status: 503 });
  }

  const allowed = await getUserAllowedChannelIds(auth.user.id);

  // Resolve the owning channel of whatever the caller wants to access, so we
  // can check it against the monk's allowed set before hitting YouTube.
  let targetChannel: string | null = null;
  if (channelId) {
    targetChannel = channelId;
  } else if (playlistId) {
    targetChannel = await lookupOwningChannel("playlist", playlistId);
  } else if (videoId) {
    targetChannel = await lookupOwningChannel("video", videoId);
  }

  if (!targetChannel) {
    return NextResponse.json({ error: "Missing or unknown identity parameter" }, { status: 400 });
  }

  if (!allowed.includes(targetChannel)) {
    await logActivity({
      userId: auth.user.id,
      action: "access_denied",
      channelId: targetChannel,
      videoId: videoId ?? null,
      metadata: { reason: "youtube_fetch_outside_allowed", playlistId },
    });
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  // Handle single video fetch if videoId is provided
  if (videoId) {
    try {
      const apiUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      apiUrl.searchParams.set("id", videoId);
      apiUrl.searchParams.set("part", "snippet,contentDetails");
      apiUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const res = await fetch(apiUrl.toString(), { cache: "no-store" });
      const data = await res.json();
      const item = data.items?.[0];

      if (!item) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      const snippet = item.snippet;
      return NextResponse.json({
        id: item.id,
        title: snippet.title,
        thumbnail: snippet.thumbnails?.maxres?.url ??
                   snippet.thumbnails?.high?.url ??
                   snippet.thumbnails?.medium?.url ??
                   `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
        date: snippet.publishedAt ? formatRelativeDate(snippet.publishedAt) : "",
        published: snippet.publishedAt ?? "",
        type: "video"
      });
    } catch (err) {
      console.error("Single video fetch error:", err);
      return NextResponse.json({ error: "Failed to fetch video details" }, { status: 500 });
    }
  }

  try {
    let apiUrl: URL;
    let channelTitle = "";
    let channelLogo = "";

    if (channelId) {
      const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      channelUrl.searchParams.set("id", channelId);
      channelUrl.searchParams.set("key", YOUTUBE_API_KEY);
      channelUrl.searchParams.set("part", "contentDetails,snippet");
      const cRes = await fetch(channelUrl.toString(), { cache: "no-store" });
      const cData = await cRes.json();
      const channelItem = cData.items?.[0];
      if (channelItem) {
        channelTitle = channelItem.snippet?.title ?? "";
        channelLogo = channelItem.snippet?.thumbnails?.high?.url ?? "";
      }
    }

    if (playlistId) {
      apiUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      apiUrl.searchParams.set("playlistId", playlistId);
      apiUrl.searchParams.set("part", "snippet");
    } else if (type === "playlists") {
      apiUrl = new URL("https://www.googleapis.com/youtube/v3/playlists");
      apiUrl.searchParams.set("channelId", channelId!);
      apiUrl.searchParams.set("part", "snippet,contentDetails");
    } else {
      const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      channelUrl.searchParams.set("id", channelId!);
      channelUrl.searchParams.set("key", YOUTUBE_API_KEY!);
      channelUrl.searchParams.set("part", "contentDetails");
      const cRes = await fetch(channelUrl.toString());
      const cData = await cRes.json();
      const uploadsId = cData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      apiUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      apiUrl.searchParams.set("playlistId", uploadsId || "");
      apiUrl.searchParams.set("part", "snippet");
    }

    apiUrl.searchParams.set("key", YOUTUBE_API_KEY);
    apiUrl.searchParams.set("maxResults", String(maxResults));
    if (pageToken) apiUrl.searchParams.set("pageToken", pageToken);

    const response = await fetch(apiUrl.toString(), { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) return NextResponse.json({ error: "Fetch Error", details: data }, { status: 502 });

    const mappedItems = (data.items ?? [])
      .map((item: any) => {
        const snippet = item.snippet;
        if (!snippet) return null;

        const title = snippet.title ?? "";
        if (title === "Private video" || title === "Deleted video") return null;

        const isPlaylistItems = !!playlistId;
        const isPlaylistTab = type === "playlists" && !isPlaylistItems;

        let id = "";
        if (isPlaylistTab) {
          id = item.id;
        } else if (isPlaylistItems) {
          id = item.contentDetails?.videoId ?? snippet.resourceId?.videoId ?? (typeof item.id === 'string' ? item.id : item.id?.videoId);
        } else {
          id = item.id?.videoId ?? snippet.resourceId?.videoId ?? (typeof item.id === 'string' ? item.id : item.id?.videoId);
        }

        if (!id) return null;

        const isLiveNow = snippet.liveBroadcastContent === "live" || snippet.liveBroadcastContent === "completed";
        if (type === "live" && !isLiveNow) return null;

        return {
          id,
          title: title || "Untitled",
          thumbnail: snippet.thumbnails?.maxres?.url ??
            snippet.thumbnails?.high?.url ??
            snippet.thumbnails?.medium?.url ??
            `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
          date: snippet.publishedAt ? formatRelativeDate(snippet.publishedAt) : "",
          published: snippet.publishedAt ?? "",
          type: isPlaylistTab ? "playlist" : (isLiveNow ? "live" : "video"),
          playlistCount: item.contentDetails?.itemCount,
        };
      })
      .filter(Boolean);

    if (channelId) {
      logActivity({
        userId: auth.user.id,
        action: "view_channel",
        channelId: channelId,
        metadata: { type, playlistId: playlistId ?? null },
      });
    }

    return NextResponse.json(
      {
        items: mappedItems,
        nextPageToken: data.nextPageToken ?? "",
        channelTitle,
        channelLogo,
      },
      { headers: { "Cache-Control": `private, max-age=${CACHE_SECONDS}` } }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
