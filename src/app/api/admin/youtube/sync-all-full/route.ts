import { NextRequest, NextResponse } from "next/server";
import { syncYouTubeChannel } from "@/lib/youtube-sync";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

/**
 * Weekly full-sync cron. Same as sync-all but runs in non-incremental mode so
 * it picks up edited titles, removed videos (flags is_available=false), and
 * full playlist changes. Serialized channel-by-channel to stay inside quota.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("[Sync All Full] Unauthorized");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { data: channels, error: fetchError } = await supabase
      .from("youtube_channels")
      .select("channel_id, name")
      .eq("is_active", true);

    if (fetchError) throw fetchError;

    console.log(`[Sync All Full] Starting full sync for ${channels?.length || 0} channels`);

    const results: any[] = [];
    for (const channel of channels || []) {
      try {
        const r = await syncYouTubeChannel(channel.channel_id, false);
        results.push({ channel: channel.name, success: true, videos: r.totalSynced, skipped: r.skipped ?? false });
        console.log(`[Sync All Full] OK: ${channel.name} (${r.totalSynced})`);
      } catch (err: any) {
        console.error(`[Sync All Full] FAIL: ${channel.name} — ${err.message}`);
        results.push({ channel: channel.name, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      channelsCount: channels?.length || 0,
      results,
    });
  } catch (error: any) {
    console.error("[Sync All Full Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
