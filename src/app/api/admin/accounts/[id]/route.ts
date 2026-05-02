import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { id } = await context.params;

  const [
    { data: account, error: accountError },
    { data: accountChannels },
    { data: userAccounts },
  ] = await Promise.all([
    supabaseAdmin.from("channel_accounts").select("*").eq("id", id).single(),
    supabaseAdmin
      .from("account_channel_access")
      .select("channel_id")
      .eq("account_id", id),
    supabaseAdmin
      .from("user_account_access")
      .select("user_id, granted_at")
      .eq("account_id", id),
  ]);

  if (accountError || !account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const channelIds = (accountChannels ?? []).map((row) => row.channel_id as string);
  const userIds = (userAccounts ?? []).map((row) => row.user_id as string);

  type ProfileRow = {
    id: string;
    email: string | null;
    full_name: string | null;
    temple: string | null;
    role: number | null;
  };

  const [{ data: channels }, { data: users }] = await Promise.all([
    channelIds.length
      ? supabaseAdmin
          .from("youtube_channels")
          .select("id, channel_id, name, handle, custom_logo, is_active")
          .in("channel_id", channelIds)
      : Promise.resolve({ data: [] as unknown[] }),
    userIds.length
      ? supabaseAdmin
          .from("profiles")
          .select("id, email, full_name, temple, role")
          .in("id", userIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
  ]);

  return NextResponse.json({
    account,
    channels: channels ?? [],
    users: ((users ?? []) as ProfileRow[]).map((user) => {
      const linked = (userAccounts ?? []).find((row) => row.user_id === user.id);
      return {
        ...user,
        granted_at: linked?.granted_at ?? null,
      };
    }),
  });
}
