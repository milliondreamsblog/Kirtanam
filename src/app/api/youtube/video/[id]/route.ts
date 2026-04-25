import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireUser,
  getUserAllowedChannelIds,
  logActivity,
} from "@/lib/auth-server";

/**
 * Guard for direct video access. Returns video metadata only if the monk is
 * allowed to watch the channel it belongs to. Any denial is logged as
 * access_denied so admins can see probing attempts.
 *
 * The frontend calls this before opening the player; if the monk sidesteps
 * the UI and goes to a video URL directly, this still blocks them because
 * RLS on yt_videos also filters by allowed channel.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { id: videoId } = await context.params;
  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  try {
    const { data: video, error } = await supabaseAdmin
      .from("yt_videos")
      .select("video_id, channel_id, title, description, thumbnail_url, published_at, kind")
      .eq("video_id", videoId)
      .single();

    if (error || !video) {
      // Unknown video — treat as denied so we don't leak existence.
      await logActivity({
        userId: auth.user.id,
        action: "access_denied",
        videoId,
        metadata: { reason: "video_not_in_index" },
      });
      return NextResponse.json({ error: "Not available" }, { status: 404 });
    }

    const allowed = await getUserAllowedChannelIds(auth.user.id);
    if (!allowed.includes(video.channel_id)) {
      await logActivity({
        userId: auth.user.id,
        action: "access_denied",
        videoId,
        channelId: video.channel_id,
        metadata: { reason: "channel_not_assigned" },
      });
      return NextResponse.json({ error: "Not available" }, { status: 403 });
    }

    logActivity({
      userId: auth.user.id,
      action: "play_video",
      videoId,
      channelId: video.channel_id,
      metadata: { title: video.title },
    });

    return NextResponse.json({
      video: {
        id: video.video_id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail_url,
        published: video.published_at,
        kind: video.kind,
        channelId: video.channel_id,
      },
    });
  } catch (err: any) {
    console.error("[/api/youtube/video/[id]] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
