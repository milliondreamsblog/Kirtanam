import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-server";

/**
 * GET /api/admin/monks
 * List every monk (role 6) with summary: assigned-channel count, last active.
 * Also accepts ?role=all to include every user, for admin convenience.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get("role"); // "all" | null (defaults to 6)

  let profilesQuery = supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, mobile, temple, role, created_at")
    .order("created_at", { ascending: false });

  if (roleParam !== "all") {
    profilesQuery = profilesQuery.eq("role", 6);
  }

  const { data: profiles, error: pErr } = await profilesQuery;
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!profiles?.length) return NextResponse.json({ monks: [] });

  const ids = profiles.map((p) => p.id);

  // Pull channel-access counts + last-activity in parallel.
  const [{ data: access }, { data: lastActs }] = await Promise.all([
    supabaseAdmin
      .from("user_channel_access")
      .select("user_id")
      .in("user_id", ids),
    supabaseAdmin
      .from("user_activity_log")
      .select("user_id, created_at")
      .in("user_id", ids)
      .order("created_at", { ascending: false })
      .limit(2000), // enough to find the latest row per user in a small deployment
  ]);

  const channelCount = new Map<string, number>();
  for (const row of access ?? []) {
    channelCount.set(row.user_id as string, (channelCount.get(row.user_id as string) ?? 0) + 1);
  }

  const lastActive = new Map<string, string>();
  for (const row of lastActs ?? []) {
    const uid = row.user_id as string;
    if (!lastActive.has(uid)) lastActive.set(uid, row.created_at as string);
  }

  const monks = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    mobile: p.mobile,
    temple: p.temple,
    role: p.role,
    created_at: p.created_at,
    assigned_channel_count: channelCount.get(p.id) ?? 0,
    last_active_at: lastActive.get(p.id) ?? null,
  }));

  return NextResponse.json({ monks });
}
