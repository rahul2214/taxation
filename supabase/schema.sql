-- ==============================================================================
-- Polaris Tax Services - Supabase Database Schema
-- Run this in your Supabase Project: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CUSTOMERS TABLE (Linked to Firebase Auth UID as primary key)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,                       -- Firebase user.uid
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    role TEXT NOT NULL DEFAULT 'customer',      -- 'customer' or 'admin'
    signup_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_role ON public.customers(role);

-- 2. TAX DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tax_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    document_type TEXT NOT NULL,               -- e.g., 'W-2', '1099', 'Tax Estimation'
    tax_year INTEGER,
    category TEXT NOT NULL DEFAULT 'Customer Upload', -- 'Customer Upload', 'Tax Estimation', 'Tax Return Draft', 'Final Document'
    uploader TEXT NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
    status TEXT NOT NULL DEFAULT 'Pending',    -- 'Pending', 'Approved', 'Rejected'
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_documents_customer_id ON public.tax_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_tax_documents_status ON public.tax_documents(status);
CREATE INDEX IF NOT EXISTS idx_tax_documents_category ON public.tax_documents(category);

-- 3. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    service TEXT,
    appointment_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',    -- 'Pending', 'Confirmed', 'Completed', 'Cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);

-- 4. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    referrer_name TEXT,
    referrer_email TEXT,
    referred_email TEXT NOT NULL,
    referred_name TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',    -- 'Pending', 'Accepted', 'Rewarded'
    referral_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- 5. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    current_year_form_url TEXT,
    prior_year_form_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default site_settings row if it doesn't exist
INSERT INTO public.site_settings (id, current_year_form_url, prior_year_form_url)
VALUES ('global', null, null)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read of site settings
CREATE POLICY "Allow public read site_settings"
    ON public.site_settings FOR SELECT
    USING (true);

-- Allow authenticated read/write with anon key (or custom policies)
CREATE POLICY "Allow anon read/write for all tables"
    ON public.customers FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon read/write tax_documents"
    ON public.tax_documents FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon read/write appointments"
    ON public.appointments FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon read/write referrals"
    ON public.referrals FOR ALL
    USING (true)
    WITH CHECK (true);
