import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * Shared server-side helpers for authenticating requests, resolving the
 * current monk's allowed YouTube channels, and writing to the activity log.
 *
 * Pattern mirrors the existing requireAdmin helpers: clients send a Bearer
 * token, we verify it with the anon client, and then use supabaseAdmin
 * (service role) for data access so RLS auth.uid() quirks don't bite us.
 */

type AuthedUser = { id: string; email: string | null };

export type RequireUserResult =
  | { user: AuthedUser; token: string }
  | { error: NextResponse };

/** Verify the Bearer token and return the authenticated user. */
export async function requireUser(request: NextRequest): Promise<RequireUserResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
  }

  return { user: { id: data.user.id, email: data.user.email ?? null }, token };
}

export type RequireAdminResult =
  | { user: AuthedUser; token: string }
  | { error: NextResponse };

/** Require the caller to be a Super Admin (role 1). */
export async function requireAdmin(request: NextRequest): Promise<RequireAdminResult> {
  const authed = await requireUser(request);
  if ("error" in authed) return authed;
  const role = await getUserRole(authed.user.id);
  if (role !== 1) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return authed;
}

/** Fetch the integer role for a profile (1 = Super Admin, 6 = Viewer/monk). */
export async function getUserRole(userId: string): Promise<number | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data.role as number;
}

/**
 * Return the set of YouTube channel_ids the user is allowed to watch.
 * - Admins (role 1) get every active channel.
 * - Everyone else gets exactly the channels in user_channel_access.
 *
 * Channel IDs are the YouTube format (e.g. "UCxxxx"), not the DB UUID.
 */
export async function getUserAllowedChannelIds(userId: string): Promise<string[]> {
  if (!supabaseAdmin) return [];

  const role = await getUserRole(userId);
  if (role === 1) {
    const { data, error } = await supabaseAdmin
      .from("youtube_channels")
      .select("channel_id")
      .eq("is_active", true);
    if (error || !data) return [];
    return data.map((r) => r.channel_id as string);
  }

  const { data, error } = await supabaseAdmin
    .from("user_channel_access")
    .select("channel_id")
    .eq("user_id", userId);
  if (error || !data) return [];
  return data.map((r) => r.channel_id as string);
}

export type ActivityAction =
  | "view_channel"
  | "play_video"
  | "search"
  | "access_denied"
  | "open_external";

export interface ActivityEntry {
  userId: string;
  action: ActivityAction;
  channelId?: string | null;
  videoId?: string | null;
  query?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget write to user_activity_log. Never throws — a broken log
 * should never break the user-facing request.
 */
export async function logActivity(entry: ActivityEntry): Promise<void> {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from("user_activity_log").insert({
      user_id: entry.userId,
      action: entry.action,
      channel_id: entry.channelId ?? null,
      video_id: entry.videoId ?? null,
      query: entry.query ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (err) {
    console.error("[logActivity] failed:", err);
  }
}
