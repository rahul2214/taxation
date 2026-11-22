-- ==============================================================================
-- Basic information documents
-- ==============================================================================
-- Files the team uploads once for every client (welcome pack, checklists, how-to
-- guides...). Clients see them under "Your return -> Basic information" in the portal;
-- admins manage them under "Manage -> Basic information".
--
-- The files themselves live in Cloudflare R2 under basic_info/; file_url holds the app
-- link (/api/files/basic_info/...), which only signed-in users can open.
--
-- Access:
--   signed-in clients : read active documents
--   visitors (anon)   : nothing
--   admins            : everything, through the server (service role)
--
-- Supabase Dashboard -> SQL Editor -> New Query -> Run. Safe to run more than once.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.basic_info_documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    description TEXT,
    file_url    TEXT NOT NULL,
    file_name   TEXT,
    file_size   BIGINT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_basic_info_documents_active_sort
    ON public.basic_info_documents (is_active, sort_order, created_at DESC);

ALTER TABLE public.basic_info_documents ENABLE ROW LEVEL SECURITY;

-- Only signed-in clients can read, and only active documents. Writes go through the server.
REVOKE ALL ON public.basic_info_documents FROM anon, authenticated;
GRANT SELECT ON public.basic_info_documents TO authenticated;
GRANT ALL ON public.basic_info_documents TO service_role;

DROP POLICY IF EXISTS "Clients read active basic info documents" ON public.basic_info_documents;
CREATE POLICY "Clients read active basic info documents" ON public.basic_info_documents
    FOR SELECT TO authenticated USING (is_active);

-- Check:
-- SELECT id, title, file_name, is_active FROM public.basic_info_documents ORDER BY sort_order, created_at DESC;
