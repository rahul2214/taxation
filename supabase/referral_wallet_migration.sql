-- ==============================================================================
-- Polaris Tax Services - Referral Coupon & Wallet System Migration
-- Run this in your Supabase Project: Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Add referral_code, wallet_balance, and referred_by to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS referred_by TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON public.customers(referral_code);

-- 2. Add referral_code, referred_id, and reward_amount to referrals table
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS referred_id TEXT,
ADD COLUMN IF NOT EXISTS reward_amount NUMERIC(10, 2) NOT NULL DEFAULT 25.00;

CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);

-- 3. Create wallet_transactions table to track credits, debits, and bonus histories
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL,                         -- 'referral_bonus', 'welcome_bonus', 'service_discount', 'manual_adjustment'
    description TEXT,
    reference_id TEXT,                          -- e.g. referral id or invoice id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_customer ON public.wallet_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON public.wallet_transactions(created_at);

-- 4. Enable Row Level Security (RLS) on wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read/write wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Allow anon read/write wallet_transactions"
    ON public.wallet_transactions FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Backfill any existing customers with a unique referral coupon code if they don't have one
UPDATE public.customers
SET referral_code = UPPER(
    COALESCE(NULLIF(REGEXP_REPLACE(first_name, '[^a-zA-Z]', '', 'g'), ''), 'POLARIS')
) || '-' || UPPER(SUBSTRING(MD5(id || email) FROM 1 FOR 4))
WHERE referral_code IS NULL;
