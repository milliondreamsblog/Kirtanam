import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireUser, getUserAllowedChannelIds } from "@/lib/auth-server";

/**
 * Returns only the active YouTube channels that the authenticated monk is
 * assigned to watch. Admins see every active channel. No token = 401.
 *
 * This is the only endpoint the frontend uses to populate the channel list,
 * so filtering here is the primary gate; RLS on youtube_channels is defense
 * in depth for any direct client reads.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const allowed = await getUserAllowedChannelIds(auth.user.id);

    if (allowed.length === 0) {
      return NextResponse.json({ channels: [] });
    }

    const { data, error } = await supabaseAdmin
      .from("youtube_channels")
      .select("*")
      .eq("is_active", true)
      .in("channel_id", allowed)
      .order("order_index", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ channels: data ?? [] });
  } catch (error) {
    console.error("[/api/youtube/channels] error:", error);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}
