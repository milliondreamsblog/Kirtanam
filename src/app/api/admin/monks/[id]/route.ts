import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-server";

type ChannelRecord = {
  channel_id: string;
  name: string;
  handle: string | null;
  custom_logo: string | null;
  is_active: boolean;
};

type AccountRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accent_color: string;
  is_active: boolean;
};

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
    { data: accountAccess },
    { data: accountChannels },
    { data: favorites },
    { data: counts },
  ] = await Promise.all([
    supabaseAdmin
      .from("user_channel_access")
      .select("channel_id, granted_at, granted_by")
      .eq("user_id", userId),
    supabaseAdmin
      .from("user_account_access")
      .select("account_id, granted_at, granted_by")
      .eq("user_id", userId),
    supabaseAdmin.from("account_channel_access").select("account_id, channel_id"),
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
  const accountIds = (accountAccess ?? []).map((r) => r.account_id as string);
  let channelMap = new Map<string, ChannelRecord>();
  let accountMap = new Map<string, AccountRecord>();
  if (channelIds.length) {
    const { data: channels } = await supabaseAdmin
      .from("youtube_channels")
      .select("channel_id, name, handle, custom_logo, is_active")
      .in("channel_id", channelIds);
    channelMap = new Map((channels ?? []).map((c) => [c.channel_id as string, c]));
  }

  if (accountIds.length) {
    const { data: accounts } = await supabaseAdmin
      .from("channel_accounts")
      .select("id, slug, name, description, accent_color, is_active")
      .in("id", accountIds);
    accountMap = new Map((accounts ?? []).map((account) => [account.id as string, account]));
  }

  const assignedChannels = (access ?? []).map((r) => ({
    ...(channelMap.get(r.channel_id as string) ?? { name: "(removed)", handle: null, custom_logo: null, is_active: false }),
    channel_id: r.channel_id,
    granted_at: r.granted_at,
    granted_by: r.granted_by,
  }));

  const assignedAccounts = (accountAccess ?? []).map((r) => {
    const accountId = r.account_id as string;
    const channelsForAccount = (accountChannels ?? []).filter(
      (channel) => channel.account_id === accountId,
    );
    return {
      account_id: accountId,
      granted_at: r.granted_at,
      granted_by: r.granted_by,
      channel_count: channelsForAccount.length,
      ...(accountMap.get(accountId) ?? {
        slug: "(removed)",
        name: "(removed)",
        description: null,
        accent_color: "#64748b",
        is_active: false,
      }),
    };
  });

  const effectiveMap = new Map<
    string,
    {
      channel_id: string;
      direct: boolean;
      accounts: string[];
    }
  >();

  for (const channel of assignedChannels) {
    effectiveMap.set(channel.channel_id as string, {
      channel_id: channel.channel_id as string,
      direct: true,
      accounts: [],
    });
  }

  for (const account of assignedAccounts) {
    const accountId = account.account_id as string;
    const accountName = account.name as string;
    for (const row of accountChannels ?? []) {
      if (row.account_id !== accountId) continue;
      const channelId = row.channel_id as string;
      const existing = effectiveMap.get(channelId);
      if (existing) {
        existing.accounts.push(accountName);
      } else {
        effectiveMap.set(channelId, {
          channel_id: channelId,
          direct: false,
          accounts: [accountName],
        });
      }
    }
  }

  const effectiveChannels = Array.from(effectiveMap.values()).map((entry) => ({
    ...entry,
    ...(channelMap.get(entry.channel_id) ?? {
      name: "(removed)",
      handle: null,
      custom_logo: null,
      is_active: false,
    }),
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
    assignedAccounts,
    effectiveChannels,
    favorites: favorites ?? [],
    activity30d: actionCounts,
  });
}
