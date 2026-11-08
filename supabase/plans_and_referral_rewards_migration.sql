-- ==============================================================================
-- Polaris Tax Services - Plans, Plan Purchases & Locked Referral Rewards
-- Run this in your Supabase Project: Dashboard -> SQL Editor -> New Query -> Run
-- Safe to re-run (idempotent).
--
-- New referral rules:
--   * A new user who signs up with a referral code gets the bonus immediately
--     in wallet_balance (usable right away).
--   * The referrer also gets the bonus, but it is held in locked_wallet_balance
--     and CANNOT be used until the referred user pays for any plan.
--   * When a purchase by the referred user is marked "paid" (with a cash amount
--     > 0), the referrer's locked bonus moves into their usable wallet_balance.
--
-- All money movement happens inside the Postgres functions below so balances,
-- ledger rows and reward statuses always change together (atomically).
-- ==============================================================================

-- 1. Customer locked balance --------------------------------------------------
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS locked_wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- Ledger column used by the functions below (exists if customer_uuid_and_userid_migration ran)
ALTER TABLE public.wallet_transactions
ADD COLUMN IF NOT EXISTS customer_userid BIGINT;

-- 2. Referral reward amount setting (used by the app; ensure the column exists)
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS referral_reward_amount NUMERIC(10, 2) DEFAULT 25.00;

-- 3. PLANS (managed by admins) ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    billing_period TEXT NOT NULL DEFAULT 'one_time',   -- 'one_time', 'monthly', 'yearly'
    features JSONB NOT NULL DEFAULT '[]'::jsonb,         -- array of feature strings
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_active_sort ON public.plans(is_active, sort_order);

-- Seed starter plans only when the table is empty (admins can edit/delete them)
INSERT INTO public.plans (name, description, price, billing_period, features, is_popular, sort_order)
-- Prices match the plans published on the website (homepage and /pricing).
SELECT * FROM (VALUES
    ('Basic Filing', 'Federal + one state return for W-2 earners.', 99.00, 'one_time',
        '["Federal return (Form 1040)","One state return","W-2 income","Standard deduction review"]'::jsonb, FALSE, 1),
    ('Standard Filing', 'For itemizers, investors and multiple income sources.', 199.00, 'one_time',
        '["Everything in Basic","Itemized deductions","1099 / investment income","Up to 2 state returns","Priority support"]'::jsonb, TRUE, 2),
    ('Premium Filing', 'Self-employed, rental property and complex situations.', 349.00, 'one_time',
        '["Everything in Standard","Schedule C / self-employment","Rental property (Schedule E)","Unlimited state returns","Audit support"]'::jsonb, FALSE, 3)
) AS seed(name, description, price, billing_period, features, is_popular, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.plans);

-- 4. PLAN PURCHASES -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plan_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_userid BIGINT,
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    plan_name TEXT NOT NULL,                 -- snapshot at purchase time
    plan_price NUMERIC(10, 2) NOT NULL,      -- snapshot at purchase time
    wallet_applied NUMERIC(10, 2) NOT NULL DEFAULT 0,
    amount_due NUMERIC(10, 2) NOT NULL,      -- plan_price - wallet_applied (cash to collect)
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'paid', 'cancelled'
    payment_method TEXT,
    payment_reference TEXT,
    notes TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT plan_purchases_status_check CHECK (status IN ('pending', 'paid', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_plan_purchases_customer ON public.plan_purchases(customer_id);
CREATE INDEX IF NOT EXISTS idx_plan_purchases_status ON public.plan_purchases(status);

-- 5. REFERRAL REWARDS (one row per referred customer) ------------------------
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
    referral_code TEXT,
    referrer_amount NUMERIC(10, 2) NOT NULL,
    referred_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'locked',   -- 'locked', 'unlocked', 'cancelled'
    unlocked_at TIMESTAMPTZ,
    unlocked_by_purchase_id UUID REFERENCES public.plan_purchases(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT referral_rewards_status_check CHECK (status IN ('locked', 'unlocked', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON public.referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON public.referral_rewards(status);

-- 6. RLS (matches the existing project convention of open anon policies) -----
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read/write plans" ON public.plans;
CREATE POLICY "Allow anon read/write plans" ON public.plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read/write plan_purchases" ON public.plan_purchases;
CREATE POLICY "Allow anon read/write plan_purchases" ON public.plan_purchases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read/write referral_rewards" ON public.referral_rewards;
CREATE POLICY "Allow anon read/write referral_rewards" ON public.referral_rewards FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- FUNCTIONS
-- ==============================================================================

-- Internal helper: unlock one referral reward row (must be called inside a txn)
CREATE OR REPLACE FUNCTION public._unlock_referral_reward(p_reward_id UUID, p_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reward public.referral_rewards%ROWTYPE;
    v_referrer public.customers%ROWTYPE;
    v_referred_name TEXT;
BEGIN
    SELECT * INTO v_reward FROM public.referral_rewards WHERE id = p_reward_id FOR UPDATE;
    IF NOT FOUND OR v_reward.status <> 'locked' THEN
        RETURN;
    END IF;

    SELECT * INTO v_referrer FROM public.customers WHERE id = v_reward.referrer_id FOR UPDATE;
    SELECT COALESCE(NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''), email)
      INTO v_referred_name FROM public.customers WHERE id = v_reward.referred_id;

    UPDATE public.customers
       SET locked_wallet_balance = GREATEST(locked_wallet_balance - v_reward.referrer_amount, 0),
           wallet_balance = wallet_balance + v_reward.referrer_amount,
           updated_at = NOW()
     WHERE id = v_reward.referrer_id;

    INSERT INTO public.wallet_transactions (customer_id, customer_userid, amount, type, description, reference_id)
    VALUES (v_reward.referrer_id, v_referrer.userid, v_reward.referrer_amount, 'referral_bonus',
            'Referral bonus unlocked: ' || COALESCE(v_referred_name, 'your friend') || ' purchased a plan',
            v_reward.id::text);

    UPDATE public.referral_rewards
       SET status = 'unlocked', unlocked_at = NOW(), unlocked_by_purchase_id = p_purchase_id, updated_at = NOW()
     WHERE id = v_reward.id;
END;
$$;

-- a) Apply a referral code to a freshly created customer -----------------------
--    Credits the new user (usable) and the referrer (locked). Idempotent per
--    referred customer: a second call returns the existing reward.
CREATE OR REPLACE FUNCTION public.apply_referral_signup(p_referred_id UUID, p_referral_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referred public.customers%ROWTYPE;
    v_referrer public.customers%ROWTYPE;
    v_amount NUMERIC(10, 2);
    v_reward public.referral_rewards%ROWTYPE;
    v_code TEXT := UPPER(TRIM(COALESCE(p_referral_code, '')));
    v_referred_name TEXT;
BEGIN
    IF v_code = '' THEN
        RETURN jsonb_build_object('applied', false, 'reason', 'empty_code');
    END IF;

    SELECT * INTO v_referred FROM public.customers WHERE id = p_referred_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('applied', false, 'reason', 'customer_not_found');
    END IF;

    SELECT * INTO v_reward FROM public.referral_rewards WHERE referred_id = p_referred_id;
    IF FOUND THEN
        RETURN jsonb_build_object('applied', false, 'reason', 'already_applied', 'amount', v_reward.referred_amount);
    END IF;

    SELECT * INTO v_referrer FROM public.customers WHERE UPPER(referral_code) = v_code FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('applied', false, 'reason', 'invalid_code');
    END IF;
    IF v_referrer.id = v_referred.id OR LOWER(v_referrer.email) = LOWER(v_referred.email) THEN
        RETURN jsonb_build_object('applied', false, 'reason', 'self_referral');
    END IF;

    SELECT COALESCE(referral_reward_amount, 25.00) INTO v_amount FROM public.site_settings WHERE id = 'global';
    v_amount := COALESCE(v_amount, 25.00);

    v_referred_name := COALESCE(NULLIF(TRIM(CONCAT(v_referred.first_name, ' ', v_referred.last_name)), ''), v_referred.email);

    -- New user: usable welcome credit + link to referrer (stores referrer's userid)
    UPDATE public.customers
       SET wallet_balance = wallet_balance + v_amount,
           referred_by = COALESCE(v_referrer.userid::text, v_referrer.id::text),
           updated_at = NOW()
     WHERE id = v_referred.id;

    -- Referrer: locked credit until the new user pays for a plan
    UPDATE public.customers
       SET locked_wallet_balance = locked_wallet_balance + v_amount,
           updated_at = NOW()
     WHERE id = v_referrer.id;

    INSERT INTO public.referral_rewards (referrer_id, referred_id, referral_code, referrer_amount, referred_amount, status)
    VALUES (v_referrer.id, v_referred.id, v_code, v_amount, v_amount, 'locked')
    RETURNING * INTO v_reward;

    INSERT INTO public.wallet_transactions (customer_id, customer_userid, amount, type, description, reference_id)
    VALUES
      (v_referred.id, v_referred.userid, v_amount, 'welcome_bonus',
       'Welcome credit for joining with code ' || v_code, v_reward.id::text),
      (v_referrer.id, v_referrer.userid, v_amount, 'referral_bonus_locked',
       'Referral bonus (locked): ' || v_referred_name || ' signed up with your code. Unlocks when they purchase a plan.',
       v_reward.id::text);

    RETURN jsonb_build_object('applied', true, 'amount', v_amount, 'reward_id', v_reward.id, 'referrer_id', v_referrer.id);
END;
$$;

-- b) Customer creates a plan purchase, optionally applying usable wallet credit
--    If wallet covers the full price, the purchase is marked paid immediately
--    (no cash collected, so it does NOT unlock the referrer's bonus).
CREATE OR REPLACE FUNCTION public.create_plan_purchase(p_customer_id UUID, p_plan_id UUID, p_use_wallet BOOLEAN DEFAULT TRUE)
RETURNS public.plan_purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customer public.customers%ROWTYPE;
    v_plan public.plans%ROWTYPE;
    v_wallet NUMERIC(10, 2) := 0;
    v_due NUMERIC(10, 2);
    v_purchase public.plan_purchases%ROWTYPE;
BEGIN
    SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Customer not found';
    END IF;

    SELECT * INTO v_plan FROM public.plans WHERE id = p_plan_id;
    IF NOT FOUND OR NOT v_plan.is_active THEN
        RAISE EXCEPTION 'This plan is not available';
    END IF;

    IF p_use_wallet THEN
        v_wallet := LEAST(GREATEST(v_customer.wallet_balance, 0), v_plan.price);
    END IF;
    v_due := v_plan.price - v_wallet;

    INSERT INTO public.plan_purchases (customer_id, customer_userid, plan_id, plan_name, plan_price, wallet_applied, amount_due, status, paid_at, payment_method)
    VALUES (v_customer.id, v_customer.userid, v_plan.id, v_plan.name, v_plan.price, v_wallet, v_due,
            CASE WHEN v_due = 0 THEN 'paid' ELSE 'pending' END,
            CASE WHEN v_due = 0 THEN NOW() ELSE NULL END,
            CASE WHEN v_due = 0 THEN 'wallet' ELSE NULL END)
    RETURNING * INTO v_purchase;

    IF v_wallet > 0 THEN
        UPDATE public.customers SET wallet_balance = wallet_balance - v_wallet, updated_at = NOW() WHERE id = v_customer.id;
        INSERT INTO public.wallet_transactions (customer_id, customer_userid, amount, type, description, reference_id)
        VALUES (v_customer.id, v_customer.userid, -v_wallet, 'service_discount',
                'Wallet credit applied to ' || v_plan.name, v_purchase.id::text);
    END IF;

    RETURN v_purchase;
END;
$$;

-- c) Admin marks a purchase as paid -> unlocks the referrer's locked bonus ----
CREATE OR REPLACE FUNCTION public.mark_plan_purchase_paid(p_purchase_id UUID, p_payment_method TEXT DEFAULT NULL, p_payment_reference TEXT DEFAULT NULL)
RETURNS public.plan_purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_purchase public.plan_purchases%ROWTYPE;
    v_reward_id UUID;
BEGIN
    SELECT * INTO v_purchase FROM public.plan_purchases WHERE id = p_purchase_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase not found';
    END IF;
    IF v_purchase.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot mark a cancelled purchase as paid';
    END IF;

    IF v_purchase.status <> 'paid' THEN
        UPDATE public.plan_purchases
           SET status = 'paid',
               paid_at = NOW(),
               payment_method = COALESCE(NULLIF(TRIM(p_payment_method), ''), payment_method),
               payment_reference = COALESCE(NULLIF(TRIM(p_payment_reference), ''), payment_reference),
               updated_at = NOW()
         WHERE id = p_purchase_id
        RETURNING * INTO v_purchase;
    END IF;

    -- A real (cash) payment by the referred user releases the referrer's bonus
    IF v_purchase.amount_due > 0 THEN
        FOR v_reward_id IN
            SELECT id FROM public.referral_rewards WHERE referred_id = v_purchase.customer_id AND status = 'locked'
        LOOP
            PERFORM public._unlock_referral_reward(v_reward_id, v_purchase.id);
        END LOOP;
    END IF;

    RETURN v_purchase;
END;
$$;

-- d) Cancel a pending purchase and refund any wallet credit used ---------------
CREATE OR REPLACE FUNCTION public.cancel_plan_purchase(p_purchase_id UUID)
RETURNS public.plan_purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_purchase public.plan_purchases%ROWTYPE;
BEGIN
    SELECT * INTO v_purchase FROM public.plan_purchases WHERE id = p_purchase_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase not found';
    END IF;
    IF v_purchase.status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending purchases can be cancelled';
    END IF;

    IF v_purchase.wallet_applied > 0 THEN
        UPDATE public.customers SET wallet_balance = wallet_balance + v_purchase.wallet_applied, updated_at = NOW()
         WHERE id = v_purchase.customer_id;
        INSERT INTO public.wallet_transactions (customer_id, customer_userid, amount, type, description, reference_id)
        VALUES (v_purchase.customer_id, v_purchase.customer_userid, v_purchase.wallet_applied, 'manual_adjustment',
                'Refund of wallet credit for cancelled order: ' || v_purchase.plan_name, v_purchase.id::text);
    END IF;

    UPDATE public.plan_purchases SET status = 'cancelled', updated_at = NOW() WHERE id = p_purchase_id
    RETURNING * INTO v_purchase;
    RETURN v_purchase;
END;
$$;

-- e) Admin override: force-release or cancel a locked referral reward ---------
CREATE OR REPLACE FUNCTION public.admin_set_referral_reward_status(p_reward_id UUID, p_status TEXT)
RETURNS public.referral_rewards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reward public.referral_rewards%ROWTYPE;
    v_referrer public.customers%ROWTYPE;
BEGIN
    SELECT * INTO v_reward FROM public.referral_rewards WHERE id = p_reward_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referral reward not found';
    END IF;
    IF v_reward.status <> 'locked' THEN
        RAISE EXCEPTION 'Only locked rewards can be changed (current status: %)', v_reward.status;
    END IF;

    IF p_status = 'unlocked' THEN
        PERFORM public._unlock_referral_reward(p_reward_id, NULL);
    ELSIF p_status = 'cancelled' THEN
        SELECT * INTO v_referrer FROM public.customers WHERE id = v_reward.referrer_id FOR UPDATE;
        UPDATE public.customers
           SET locked_wallet_balance = GREATEST(locked_wallet_balance - v_reward.referrer_amount, 0), updated_at = NOW()
         WHERE id = v_reward.referrer_id;
        INSERT INTO public.wallet_transactions (customer_id, customer_userid, amount, type, description, reference_id)
        VALUES (v_reward.referrer_id, v_referrer.userid, -v_reward.referrer_amount, 'referral_bonus_locked',
                'Locked referral bonus cancelled by admin', v_reward.id::text);
        UPDATE public.referral_rewards SET status = 'cancelled', updated_at = NOW() WHERE id = p_reward_id;
    ELSE
        RAISE EXCEPTION 'Invalid status %', p_status;
    END IF;

    SELECT * INTO v_reward FROM public.referral_rewards WHERE id = p_reward_id;
    RETURN v_reward;
END;
$$;

REVOKE ALL ON FUNCTION public._unlock_referral_reward(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_signup(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_plan_purchase(UUID, UUID, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_plan_purchase_paid(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_plan_purchase(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_referral_reward_status(UUID, TEXT) TO anon, authenticated;

-- Ask PostgREST to pick up the new tables/functions immediately
NOTIFY pgrst, 'reload schema';
