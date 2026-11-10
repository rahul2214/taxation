-- ==============================================================================
-- Polaris Tax Services - Contacts table (messages from the /contact page)
-- Run in Supabase: Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',   -- 'new', 'read', 'replied', 'archived'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);

-- Row Level Security (same open anon policy as the other tables in schema.sql)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read/write contacts" ON public.contacts;
CREATE POLICY "Allow anon read/write contacts"
    ON public.contacts FOR ALL
    USING (true)
    WITH CHECK (true);

-- Make PostgREST pick up the new table immediately
NOTIFY pgrst, 'reload schema';
