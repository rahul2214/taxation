-- ==============================================================================
-- Polaris Tax Services - Feedback table (website, client portal and mobile app)
-- Run in Supabase: Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID,                          -- Supabase auth user id when signed in (no FK: guests can send feedback)
    name TEXT,
    email TEXT,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    category TEXT,                             -- 'general', 'bug', 'feature', 'service', 'other'
    message TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'website',    -- 'website', 'client_portal', 'mobile_app'
    platform TEXT,                             -- 'web', 'ios', 'android'
    device TEXT,                               -- 'desktop', 'mobile', 'tablet'
    page TEXT,                                 -- path or screen the feedback was sent from
    app_version TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'new',        -- 'new', 'reviewed', 'resolved', 'archived'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON public.feedback(source);

-- Row Level Security (same open anon policy as contacts and the other tables in schema.sql)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read/write feedback" ON public.feedback;
CREATE POLICY "Allow anon read/write feedback"
    ON public.feedback FOR ALL
    USING (true)
    WITH CHECK (true);

-- Make PostgREST pick up the new table immediately
NOTIFY pgrst, 'reload schema';
