import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-server";

interface AccountPayload {
  id?: string;
  slug?: string;
  name?: string;
  description?: string | null;
  accent_color?: string;
  is_active?: boolean;
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const [{ data: accounts, error: accountError }, { data: accountChannels }, { data: userAccounts }] =
    await Promise.all([
      supabaseAdmin
        .from("channel_accounts")
        .select("*")
        .order("name", { ascending: true }),
      supabaseAdmin.from("account_channel_access").select("account_id, channel_id"),
      supabaseAdmin.from("user_account_access").select("account_id, user_id"),
    ]);

  if (accountError) {
    return NextResponse.json({ error: accountError.message }, { status: 500 });
  }

  const channelCounts = new Map<string, number>();
  for (const row of accountChannels ?? []) {
    const accountId = row.account_id as string;
    channelCounts.set(accountId, (channelCounts.get(accountId) ?? 0) + 1);
  }

  const userCounts = new Map<string, number>();
  for (const row of userAccounts ?? []) {
    const accountId = row.account_id as string;
    userCounts.set(accountId, (userCounts.get(accountId) ?? 0) + 1);
  }

  return NextResponse.json({
    accounts: (accounts ?? []).map((account) => ({
      ...account,
      channel_count: channelCounts.get(account.id as string) ?? 0,
      user_count: userCounts.get(account.id as string) ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = (await request.json()) as AccountPayload;
  const name = body.name?.trim();
  const slug = normalizeSlug(body.slug?.trim() || name || "");

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("channel_accounts")
    .insert({
      name,
      slug,
      description: body.description?.trim() || null,
      accent_color: body.accent_color || "#ff4e45",
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ account: data });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = (await request.json()) as AccountPayload;
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.slug !== undefined) updates.slug = normalizeSlug(body.slug);
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.accent_color !== undefined) updates.accent_color = body.accent_color;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  const { data, error } = await supabaseAdmin
    .from("channel_accounts")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ account: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("channel_accounts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
