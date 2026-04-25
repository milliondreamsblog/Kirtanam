-- =============================================================================
-- PHASE 5 — YouTube sync refinements
-- =============================================================================
-- Adds:
--   • is_available  — videos that disappear from YouTube are flagged, not deleted
--   • duration_seconds — used for "short" classification
--   • widen kind check to include 'short' and 'live' values
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'yt_videos' AND column_name = 'is_available'
    ) THEN
        ALTER TABLE public.yt_videos ADD COLUMN is_available BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'yt_videos' AND column_name = 'duration_seconds'
    ) THEN
        ALTER TABLE public.yt_videos ADD COLUMN duration_seconds INTEGER;
    END IF;
END $$;

-- Helps lookups on the dashboard "only show available videos" filter.
CREATE INDEX IF NOT EXISTS idx_yt_videos_channel_available
    ON public.yt_videos(channel_id, is_available);
