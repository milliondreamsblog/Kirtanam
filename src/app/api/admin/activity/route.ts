import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-server";

/**
 * GET /api/admin/activity
 * Global activity feed, newest first. Filterable by action / userId / channelId.
 * Returns rows enriched with the monk's display info for UI convenience.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 500);
  const before = searchParams.get("before");
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");
  const channelId = searchParams.get("channelId");

  let q = supabaseAdmin
    .from("user_activity_log")
    .select("id, user_id, action, channel_id, video_id, query, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) q = q.lt("created_at", before);
  if (action) q = q.eq("action", action);
  if (userId) q = q.eq("user_id", userId);
  if (channelId) q = q.eq("channel_id", channelId);

  const { data: entries, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!entries?.length) return NextResponse.json({ entries: [] });

  // Enrich with profile display name + channel name in one trip each.
  const userIds = Array.from(new Set(entries.map((e) => e.user_id as string)));
  const channelIds = Array.from(
    new Set(entries.map((e) => e.channel_id).filter((x): x is string => !!x))
  );

  const [{ data: profiles }, { data: channels }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, email, full_name").in("id", userIds),
    channelIds.length
      ? supabaseAdmin.from("youtube_channels").select("channel_id, name").in("channel_id", channelIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const channelMap = new Map((channels ?? []).map((c) => [c.channel_id as string, c]));

  const enriched = entries.map((e) => ({
    ...e,
    user: profileMap.get(e.user_id as string) ?? { email: "(unknown)", full_name: null },
    channel_name: e.channel_id ? channelMap.get(e.channel_id as string)?.name ?? null : null,
  }));

  return NextResponse.json({ entries: enriched });
}
