import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireUser,
  getUserAllowedChannelIds,
  logActivity,
} from "@/lib/auth-server";

/**
 * Search videos + playlists. The client may pass `channelId` (comma-separated)
 * to narrow the search, but we always intersect it with the user's allowed
 * channel set on the server — a monk can never search into channels they
 * haven't been granted.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const channelIdParam = searchParams.get("channelId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10) || 200, 500);

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  try {
    const allowed = await getUserAllowedChannelIds(auth.user.id);
    if (allowed.length === 0) {
      // Monk has no channels assigned — nothing is searchable.
      return NextResponse.json({ items: [], count: 0 });
    }

    // Intersect the client-supplied channel filter with the monk's allowed set.
    const requested = channelIdParam ? channelIdParam.split(",").filter(Boolean) : null;
    const effective = requested
      ? requested.filter((c) => allowed.includes(c))
      : allowed;

    if (effective.length === 0) {
      // Client asked for channels the monk isn't allowed to see.
      await logActivity({
        userId: auth.user.id,
        action: "access_denied",
        query,
        metadata: { reason: "search_outside_allowed_channels", requested },
      });
      return NextResponse.json({ items: [], count: 0 });
    }

    const { data, error } = await supabaseAdmin.rpc("search_youtube_content", {
      query_text: query,
      channel_ids: effective,
      max_limit: limit,
    });

    if (error) {
      console.error("[/api/youtube/search] RPC error:", error);
      throw error;
    }

    const results = (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      published: item.published,
      type: item.type,
      playlistCount: item.playlist_count,
      channelTitle: item.channel_title,
      channelId: item.channel_id,
    }));

    // Fire and forget — don't block the response on logging.
    logActivity({
      userId: auth.user.id,
      action: "search",
      query,
      metadata: { resultCount: results.length, scope: requested ? "filtered" : "all" },
    });

    return NextResponse.json({ items: results, count: results.length });
  } catch (error: any) {
    console.error("[/api/youtube/search] error:", error);
    return NextResponse.json({ error: "Internal Search Error" }, { status: 500 });
  }
}
