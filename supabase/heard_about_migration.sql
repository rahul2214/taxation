-- ==============================================================================
-- Polaris Tax Services - "How did you hear about us?" Migration
-- Run this in your Supabase Project: Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- Stores the answer given at signup, e.g. 'Google search' or 'Other: Local newspaper'
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS heard_about TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_heard_about ON public.customers(heard_about);
