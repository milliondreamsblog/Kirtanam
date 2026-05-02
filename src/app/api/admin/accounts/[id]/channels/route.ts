import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-server";

interface ChannelAccessBody {
  channelIds?: string[];
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { id: accountId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as ChannelAccessBody;
  const channelIds = (body.channelIds ?? []).filter(Boolean);

  if (channelIds.length === 0) {
    return NextResponse.json({ error: "channelIds required" }, { status: 400 });
  }

  const rows = channelIds.map((channelId) => ({
    account_id: accountId,
    channel_id: channelId,
  }));

  const { error } = await supabaseAdmin
    .from("account_channel_access")
    .upsert(rows, { onConflict: "account_id,channel_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, assigned: channelIds.length });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { id: accountId } = await context.params;
  const { searchParams } = new URL(request.url);
  const singleId = searchParams.get("channelId");

  let channelIds: string[] = [];
  if (singleId) {
    channelIds = [singleId];
  } else {
    const body = (await request.json().catch(() => ({}))) as ChannelAccessBody;
    channelIds = (body.channelIds ?? []).filter(Boolean);
  }

  if (channelIds.length === 0) {
    return NextResponse.json({ error: "channelId(s) required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("account_channel_access")
    .delete()
    .eq("account_id", accountId)
    .in("channel_id", channelIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, revoked: channelIds.length });
}
