import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-server";

/**
 * GET /api/admin/monks/[id]
 * Full detail for one monk: profile, assigned channels (joined with channel
 * metadata), favorites count, and quick activity counters for the last 30d.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { id: userId } = await context.params;

  const { data: profile, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, mobile, temple, role, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (pErr || !profile) {
    return NextResponse.json({ error: "Monk not found" }, { status: 404 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: access },
    { data: favorites },
    { data: counts },
  ] = await Promise.all([
    supabaseAdmin
      .from("user_channel_access")
      .select("channel_id, granted_at, granted_by")
      .eq("user_id", userId),
    supabaseAdmin
      .from("user_favorites")
      .select("video_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("user_activity_log")
      .select("action")
      .eq("user_id", userId)
      .gte("created_at", since),
  ]);

  // Enrich channel_id -> full channel metadata in one trip.
  const channelIds = (access ?? []).map((r) => r.channel_id as string);
  let channelMap = new Map<string, any>();
  if (channelIds.length) {
    const { data: channels } = await supabaseAdmin
      .from("youtube_channels")
      .select("channel_id, name, handle, custom_logo, is_active")
      .in("channel_id", channelIds);
    channelMap = new Map((channels ?? []).map((c) => [c.channel_id as string, c]));
  }

  const assignedChannels = (access ?? []).map((r) => ({
    channel_id: r.channel_id,
    granted_at: r.granted_at,
    granted_by: r.granted_by,
    ...(channelMap.get(r.channel_id as string) ?? { name: "(removed)", handle: null, custom_logo: null, is_active: false }),
  }));

  // Tally actions for the last 30 days.
  const actionCounts: Record<string, number> = {};
  for (const row of counts ?? []) {
    const k = row.action as string;
    actionCounts[k] = (actionCounts[k] ?? 0) + 1;
  }

  return NextResponse.json({
    profile,
    assignedChannels,
    favorites: favorites ?? [],
    activity30d: actionCounts,
  });
}
