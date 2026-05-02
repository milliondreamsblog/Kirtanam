import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireUser, getUserAllowedChannelIds } from "@/lib/auth-server";

/**
 * Landing-feed endpoint.
 *
 * Returns several pre-aggregated shelves so the landing page can render
 * multiple sections in a single request:
 *
 *   - recentUploads: top N videos balanced across all the user's allowed
 *     channels. We fetch the latest few per channel and merge by date so
 *     no single high-volume channel can dominate the shelf.
 *   - popular: a randomized mix from the broader library (excluding the
 *     recent ones already on screen). Acts as a "discover" rail until we
 *     have real view-count tracking.
 *
 * All filtering happens server-side against the user's account_channel_access
 * → only videos from channels the user is authorized to view.
 */

interface FeedVideoRow {
  video_id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string | null;
  kind: string | null;
}

interface FeedVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  date: string;
  type: "video" | "live" | "short";
  channelId: string;
  channelTitle: string;
  channelLogo: string | null;
}

const RECENT_PER_CHANNEL = 6; // how many recent uploads to pull per channel before merging
const POPULAR_POOL_SIZE = 240; // size of the random sampling pool

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return d.toLocaleDateString();
}

/** Fisher-Yates shuffle, in place. */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function toFeedVideo(
  row: FeedVideoRow,
  channelMap: Map<string, { name: string; custom_logo: string | null }>,
): FeedVideo {
  const ch = channelMap.get(row.channel_id);
  return {
    id: row.video_id,
    title: row.title || "Untitled",
    thumbnail:
      row.thumbnail_url ||
      `https://i.ytimg.com/vi/${row.video_id}/mqdefault.jpg`,
    published: row.published_at ?? "",
    date: row.published_at ? formatRelativeDate(row.published_at) : "",
    type: (row.kind === "live" ? "live" : "video") as "video" | "live",
    channelId: row.channel_id,
    channelTitle: ch?.name ?? "",
    channelLogo: ch?.custom_logo ?? null,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const allowed = await getUserAllowedChannelIds(auth.user.id);
  if (allowed.length === 0) {
    return NextResponse.json({ recentUploads: [], popular: [] });
  }

  const { searchParams } = new URL(request.url);
  const recentLimit = Math.min(
    parseInt(searchParams.get("recentLimit") ?? "16"),
    40,
  );
  const popularLimit = Math.min(
    parseInt(searchParams.get("popularLimit") ?? "16"),
    40,
  );

  // ── Step 1: fetch in parallel ────────────────────────────────────────
  // (a) per-channel "latest N" so recent uploads are balanced
  // (b) a wider random-sample pool for "popular"
  // (c) channel metadata for joining names/logos
  const [perChannelResults, poolRes, channelsRes] = await Promise.all([
    Promise.all(
      allowed.map((channelId) =>
        supabaseAdmin!
          .from("yt_videos")
          .select(
            "video_id, channel_id, title, thumbnail_url, published_at, kind",
          )
          .eq("channel_id", channelId)
          .eq("is_available", true)
          .neq("kind", "short")
          .order("published_at", { ascending: false })
          .limit(RECENT_PER_CHANNEL),
      ),
    ),
    supabaseAdmin
      .from("yt_videos")
      .select("video_id, channel_id, title, thumbnail_url, published_at, kind")
      .in("channel_id", allowed)
      .eq("is_available", true)
      .neq("kind", "short")
      .order("published_at", { ascending: false })
      .limit(POPULAR_POOL_SIZE),
    supabaseAdmin
      .from("youtube_channels")
      .select("channel_id, name, custom_logo")
      .in("channel_id", allowed),
  ]);

  const channelMap = new Map<
    string,
    { name: string; custom_logo: string | null }
  >();
  for (const ch of channelsRes.data ?? []) {
    channelMap.set(ch.channel_id as string, {
      name: (ch.name as string) ?? "",
      custom_logo: (ch.custom_logo as string | null) ?? null,
    });
  }

  // ── Step 2: build "Recent uploads" — merge per-channel sets ─────────
  const recentMerged: FeedVideoRow[] = perChannelResults.flatMap(
    (r) => (r.data as FeedVideoRow[] | null) ?? [],
  );
  recentMerged.sort((a, b) => {
    const at = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bt = b.published_at ? new Date(b.published_at).getTime() : 0;
    return bt - at;
  });

  // Round-robin so the very top isn't always the same channel.
  // (Take latest from each channel before second-latest, etc.)
  const recentUploads: FeedVideo[] = roundRobinByChannel(
    recentMerged,
    recentLimit,
  ).map((row) => toFeedVideo(row, channelMap));

  // ── Step 3: build "Popular" — random shuffle from the wider pool ────
  const recentIds = new Set(recentUploads.map((v) => v.id));
  const popularPool = ((poolRes.data as FeedVideoRow[] | null) ?? []).filter(
    (v) => !recentIds.has(v.video_id),
  );
  shuffleInPlace(popularPool);
  const popular: FeedVideo[] = popularPool
    .slice(0, popularLimit)
    .map((row) => toFeedVideo(row, channelMap));

  // ── Diagnostic meta — helps debug "why is only one channel showing" ──
  // Counts per-channel rows we actually got back from the DB.
  const videosPerChannel: Record<string, number> = {};
  for (const r of perChannelResults) {
    const rows = (r.data as FeedVideoRow[] | null) ?? [];
    if (rows.length > 0) {
      const cid = rows[0].channel_id;
      videosPerChannel[cid] = rows.length;
    }
  }
  for (const cid of allowed) {
    if (!(cid in videosPerChannel)) videosPerChannel[cid] = 0;
  }

  // Channels actually represented in the recent shelf (post round-robin)
  const recentByChannel: Record<string, number> = {};
  for (const v of recentUploads) {
    recentByChannel[v.channelId] = (recentByChannel[v.channelId] ?? 0) + 1;
  }

  // Server log so you can see this in `vercel logs` / dev console
  console.log("[/api/youtube/feed]", {
    allowedCount: allowed.length,
    videosPerChannel,
    recentByChannel,
  });

  return NextResponse.json(
    {
      recentUploads,
      popular,
      _meta: {
        allowedChannels: allowed.length,
        videosPerChannel,
        recentByChannel,
      },
    },
    {
      headers: {
        // Short cache so "popular" reshuffles regularly.
        "Cache-Control": "private, max-age=60",
      },
    },
  );
}

/**
 * Given a date-sorted-DESC list of videos that may be heavy on a single
 * channel, return a list that interleaves channels: the newest from each
 * channel, then the second-newest from each, etc. This yields a feed where
 * channel diversity is visible at the top.
 */
function roundRobinByChannel(
  videos: FeedVideoRow[],
  limit: number,
): FeedVideoRow[] {
  // Group by channel_id, preserving date order within each group.
  const byChannel = new Map<string, FeedVideoRow[]>();
  for (const v of videos) {
    const list = byChannel.get(v.channel_id) ?? [];
    list.push(v);
    byChannel.set(v.channel_id, list);
  }

  // Order channels by their freshest upload's recency so the newest channel
  // overall starts the rotation.
  const channels = Array.from(byChannel.entries()).sort(([, a], [, b]) => {
    const at = a[0]?.published_at ? new Date(a[0].published_at!).getTime() : 0;
    const bt = b[0]?.published_at ? new Date(b[0].published_at!).getTime() : 0;
    return bt - at;
  });

  const out: FeedVideoRow[] = [];
  let row = 0;
  // Keep cycling round positions (0, 1, 2, ...) until we hit the limit
  // or every channel is exhausted.
  while (out.length < limit) {
    let addedThisRound = 0;
    for (const [, list] of channels) {
      const item = list[row];
      if (item) {
        out.push(item);
        addedThisRound++;
        if (out.length >= limit) break;
      }
    }
    if (addedThisRound === 0) break;
    row++;
  }
  return out;
}
