import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-server";

interface AccountAccessBody {
  accountIds?: string[];
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

  const { id: userId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as AccountAccessBody;
  const accountIds = (body.accountIds ?? []).filter(Boolean);

  if (accountIds.length === 0) {
    return NextResponse.json({ error: "accountIds required" }, { status: 400 });
  }

  const rows = accountIds.map((accountId) => ({
    user_id: userId,
    account_id: accountId,
    granted_by: auth.user.id,
  }));

  const { error } = await supabaseAdmin
    .from("user_account_access")
    .upsert(rows, { onConflict: "user_id,account_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, assigned: accountIds.length });
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

  const { id: userId } = await context.params;
  const { searchParams } = new URL(request.url);
  const singleId = searchParams.get("accountId");

  let accountIds: string[] = [];
  if (singleId) {
    accountIds = [singleId];
  } else {
    const body = (await request.json().catch(() => ({}))) as AccountAccessBody;
    accountIds = (body.accountIds ?? []).filter(Boolean);
  }

  if (accountIds.length === 0) {
    return NextResponse.json({ error: "accountId(s) required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("user_account_access")
    .delete()
    .eq("user_id", userId)
    .in("account_id", accountIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, revoked: accountIds.length });
}
