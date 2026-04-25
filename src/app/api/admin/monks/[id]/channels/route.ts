import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-server";

/**
 * POST /api/admin/monks/[id]/channels
 * Body: { channelIds: string[] }  — assign (upsert) these channels to the monk.
 *
 * DELETE /api/admin/monks/[id]/channels?channelId=UCxxx
 *   or DELETE with body { channelIds: string[] } — revoke.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { id: userId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { channelIds?: string[] };
  const channelIds = (body.channelIds ?? []).filter(Boolean);

  if (channelIds.length === 0) {
    return NextResponse.json({ error: "channelIds required" }, { status: 400 });
  }

  const rows = channelIds.map((cid) => ({
    user_id: userId,
    channel_id: cid,
    granted_by: auth.user.id,
  }));

  const { error } = await supabaseAdmin
    .from("user_channel_access")
    .upsert(rows, { onConflict: "user_id,channel_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, assigned: channelIds.length });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { id: userId } = await context.params;
  const { searchParams } = new URL(request.url);
  const singleId = searchParams.get("channelId");

  let channelIds: string[] = [];
  if (singleId) {
    channelIds = [singleId];
  } else {
    const body = (await request.json().catch(() => ({}))) as { channelIds?: string[] };
    channelIds = (body.channelIds ?? []).filter(Boolean);
  }

  if (channelIds.length === 0) {
    return NextResponse.json({ error: "channelId(s) required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("user_channel_access")
    .delete()
    .eq("user_id", userId)
    .in("channel_id", channelIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, revoked: channelIds.length });
}
