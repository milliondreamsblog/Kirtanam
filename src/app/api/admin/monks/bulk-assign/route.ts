import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-server";

/**
 * POST /api/admin/monks/bulk-assign
 * Body: { userIds: string[], channelIds: string[], mode: "assign" | "revoke" }
 * Assigns or revokes the Cartesian product of the two lists. Idempotent.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    userIds?: string[];
    channelIds?: string[];
    mode?: "assign" | "revoke";
  };

  const userIds = (body.userIds ?? []).filter(Boolean);
  const channelIds = (body.channelIds ?? []).filter(Boolean);
  const mode = body.mode ?? "assign";

  if (userIds.length === 0 || channelIds.length === 0) {
    return NextResponse.json(
      { error: "userIds and channelIds required" },
      { status: 400 }
    );
  }

  if (mode === "assign") {
    const rows = userIds.flatMap((uid) =>
      channelIds.map((cid) => ({
        user_id: uid,
        channel_id: cid,
        granted_by: auth.user.id,
      }))
    );
    const { error } = await supabaseAdmin
      .from("user_channel_access")
      .upsert(rows, { onConflict: "user_id,channel_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, assigned: rows.length });
  }

  // revoke
  const { error } = await supabaseAdmin
    .from("user_channel_access")
    .delete()
    .in("user_id", userIds)
    .in("channel_id", channelIds);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
