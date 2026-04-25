import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireUser,
  getUserAllowedChannelIds,
  logActivity,
} from "@/lib/auth-server";

/**
 * Called by the player when a monk clicks "Watch on YouTube" (or any other
 * link that leaves the safe space). Records the event so admins can see
 * how often monks step outside the app.
 *
 * Body: { videoId: string }
 * The route resolves the owning channel from yt_videos and verifies the
 * monk can actually see it — otherwise the log entry becomes access_denied.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let body: { videoId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const videoId = body.videoId?.trim();
  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  const { data: video } = await supabaseAdmin
    .from("yt_videos")
    .select("channel_id, title")
    .eq("video_id", videoId)
    .single();

  const channelId = (video?.channel_id as string | undefined) ?? null;
  const allowed = await getUserAllowedChannelIds(auth.user.id);

  if (!channelId || !allowed.includes(channelId)) {
    await logActivity({
      userId: auth.user.id,
      action: "access_denied",
      videoId,
      channelId,
      metadata: { reason: "external_open_outside_allowed" },
    });
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  await logActivity({
    userId: auth.user.id,
    action: "open_external",
    videoId,
    channelId,
    metadata: { title: video?.title ?? null, target: "youtube" },
  });

  return NextResponse.json({ ok: true });
}
