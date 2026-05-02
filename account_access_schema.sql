-- =============================================================================
-- PHASE 2 - Reusable YouTube Accounts + User Account Access
-- =============================================================================
-- Purpose:
-- 1. Create reusable account bundles such as "Engineering Student Monk"
-- 2. Attach many YouTube channels to one account
-- 3. Attach many users to one account
-- 4. Allow effective channel access to come from either direct assignment
--    (user_channel_access) or reusable accounts
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.channel_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    accent_color TEXT NOT NULL DEFAULT '#ff4e45',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_accounts_slug
    ON public.channel_accounts(slug);

CREATE TABLE IF NOT EXISTS public.account_channel_access (
    account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL REFERENCES public.youtube_channels(channel_id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_account_channel_access_account
    ON public.account_channel_access(account_id);

CREATE INDEX IF NOT EXISTS idx_account_channel_access_channel
    ON public.account_channel_access(channel_id);

CREATE TABLE IF NOT EXISTS public.user_account_access (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_user_account_access_user
    ON public.user_account_access(user_id);

CREATE INDEX IF NOT EXISTS idx_user_account_access_account
    ON public.user_account_access(account_id);

ALTER TABLE public.channel_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_channel_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_account_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage channel accounts" ON public.channel_accounts;
CREATE POLICY "Admins manage channel accounts"
ON public.channel_accounts
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage account channel access" ON public.account_channel_access;
CREATE POLICY "Admins manage account channel access"
ON public.account_channel_access
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can read their own account access" ON public.user_account_access;
CREATE POLICY "Users can read their own account access"
ON public.user_account_access
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all user account access" ON public.user_account_access;
CREATE POLICY "Admins manage all user account access"
ON public.user_account_access
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.get_user_allowed_channel_ids(uid UUID)
RETURNS SETOF TEXT AS $$
    SELECT channel_id FROM public.youtube_channels WHERE public.is_admin()
    UNION
    SELECT channel_id FROM public.user_channel_access WHERE user_id = uid
    UNION
    SELECT aca.channel_id
    FROM public.user_account_access uaa
    JOIN public.account_channel_access aca ON aca.account_id = uaa.account_id
    JOIN public.channel_accounts ca ON ca.id = uaa.account_id
    WHERE uaa.user_id = uid
      AND ca.is_active = TRUE;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_can_see_channel(cid TEXT)
RETURNS BOOLEAN AS $$
    SELECT public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.user_channel_access uca
            WHERE uca.user_id = auth.uid() AND uca.channel_id = cid
        )
        OR EXISTS (
            SELECT 1
            FROM public.user_account_access uaa
            JOIN public.account_channel_access aca ON aca.account_id = uaa.account_id
            JOIN public.channel_accounts ca ON ca.id = uaa.account_id
            WHERE uaa.user_id = auth.uid()
              AND aca.channel_id = cid
              AND ca.is_active = TRUE
        );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
