-- =============================================================================
-- PHASE 1 — Per-user YouTube channel access + activity log
-- =============================================================================
-- Purpose: restrict each monk to only see their assigned YouTube channels,
-- and give admins a full audit trail of monk activity.
--
-- Requires: profiles, youtube_channels, yt_videos, yt_playlists, is_admin()
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. user_channel_access — junction table (monk <-> allowed channel)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_channel_access (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL REFERENCES public.youtube_channels(channel_id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_user_channel_access_user ON public.user_channel_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_channel_access_channel ON public.user_channel_access(channel_id);

ALTER TABLE public.user_channel_access ENABLE ROW LEVEL SECURITY;

-- Monks can see only their own assignments.
DROP POLICY IF EXISTS "Users can read their own channel access" ON public.user_channel_access;
CREATE POLICY "Users can read their own channel access"
ON public.user_channel_access
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can do everything (assign, revoke, read all).
DROP POLICY IF EXISTS "Admins manage all channel access" ON public.user_channel_access;
CREATE POLICY "Admins manage all channel access"
ON public.user_channel_access
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- -----------------------------------------------------------------------------
-- 2. user_activity_log — admin audit trail of monk actions
-- -----------------------------------------------------------------------------
-- action values:
--   'view_channel'   — monk opened a channel page
--   'play_video'     — monk started playing a video
--   'search'         — monk ran a search query
--   'access_denied'  — monk tried to access a blocked resource
--   'open_external'  — monk clicked share / watch-on-YouTube
--
-- channel_id / video_id are plain TEXT (no FK) so we can log denials for
-- channels the monk doesn't have access to, and keep history after deletes.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN (
        'view_channel', 'play_video', 'search', 'access_denied', 'open_external'
    )),
    channel_id TEXT,
    video_id TEXT,
    query TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_created
    ON public.user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action_created
    ON public.user_activity_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_channel_created
    ON public.user_activity_log(channel_id, created_at DESC);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the log. Writes happen exclusively through service-role
-- API routes (supabaseAdmin), which bypass RLS — so no INSERT policy is needed
-- for regular users. This prevents client-side log tampering.
DROP POLICY IF EXISTS "Admins can read activity log" ON public.user_activity_log;
CREATE POLICY "Admins can read activity log"
ON public.user_activity_log
FOR SELECT
USING (public.is_admin());


-- -----------------------------------------------------------------------------
-- 3. Helper — get the set of channel_ids a user is allowed to see.
--    Admins get everything; viewers get their assignments.
--    Used by API routes AND by RLS policies on yt_videos / yt_playlists.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_allowed_channel_ids(uid UUID)
RETURNS SETOF TEXT AS $$
    SELECT channel_id FROM public.youtube_channels WHERE public.is_admin()
    UNION
    SELECT channel_id FROM public.user_channel_access WHERE user_id = uid;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Convenience predicate for RLS.
CREATE OR REPLACE FUNCTION public.user_can_see_channel(cid TEXT)
RETURNS BOOLEAN AS $$
    SELECT public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.user_channel_access
            WHERE user_id = auth.uid() AND channel_id = cid
        );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;


-- -----------------------------------------------------------------------------
-- 4. Tighten RLS on yt_videos / yt_playlists — defense in depth.
--    Previously these were "public read". Now users only see rows belonging
--    to channels they've been granted.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Read Access for yt_videos" ON public.yt_videos;
DROP POLICY IF EXISTS "Users can read allowed yt_videos" ON public.yt_videos;
CREATE POLICY "Users can read allowed yt_videos"
ON public.yt_videos
FOR SELECT
USING (public.user_can_see_channel(channel_id));

DROP POLICY IF EXISTS "Public Read Access for yt_playlists" ON public.yt_playlists;
DROP POLICY IF EXISTS "Users can read allowed yt_playlists" ON public.yt_playlists;
CREATE POLICY "Users can read allowed yt_playlists"
ON public.yt_playlists
FOR SELECT
USING (public.user_can_see_channel(channel_id));


-- -----------------------------------------------------------------------------
-- 5. Tighten RLS on youtube_channels — monks only see channels assigned to
--    them. Admins see everything. Service role bypasses RLS so the cron sync
--    and admin APIs continue to work.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read youtube channels" ON public.youtube_channels;
DROP POLICY IF EXISTS "Users can read allowed channels" ON public.youtube_channels;
CREATE POLICY "Users can read allowed channels"
ON public.youtube_channels
FOR SELECT
USING (public.user_can_see_channel(channel_id));
