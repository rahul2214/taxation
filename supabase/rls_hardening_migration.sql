-- ==============================================================================
-- Polaris Tax Services - Row Level Security hardening
-- Run AFTER every other migration in this folder (schema.sql, roles, plans_and_referral_rewards,
-- paypal, contacts, feedback, master_data, email_verification, google_oauth, ...).
-- Supabase Dashboard -> SQL Editor -> New Query -> Run. Safe to re-run.
--
-- Before this migration every core table had "FOR ALL USING (true) WITH CHECK (true)"
-- and the money functions were granted to anon, so anyone holding the public anon key
-- could read every customer, read admin passwords, set email_verified, credit wallets
-- or mark orders paid.
--
-- After it:
--   anon (visitors)        : read roles, site_settings, master_data, active plans;
--                            insert appointments, contacts, feedback (status 'new'/'Pending' only).
--   authenticated (clients): the above, plus their OWN customers row (read; update name,
--                            phone, address, heard_about only), own tax documents
--                            (read, upload, delete own uploads), own appointments, wallet
--                            transactions, plan purchases and referral rewards (read);
--                            create_plan_purchase / cancel_plan_purchase for their own orders.
--   service_role (server)  : everything (bypasses RLS). Used by /api/admin/*, /api/account,
--                            /api/auth/email, /api/paypal/*.
--   admins table           : no browser access at all.
--
-- The app code that goes with this lives in src/app/api/admin, src/app/api/account and
-- src/lib/server. Deploy that code BEFORE (or together with) running this file, or the
-- admin console and signup referral bonus will stop working until it is deployed.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Enable RLS and drop every existing policy on the app tables
--    (catches the old open policies and any added by hand in the dashboard).
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t TEXT;
    p RECORD;
    tables TEXT[] := ARRAY[
        'roles', 'customers', 'tax_documents', 'appointments', 'wallet_transactions',
        'site_settings', 'admins', 'contacts', 'feedback', 'master_data',
        'plans', 'plan_purchases', 'referral_rewards'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF to_regclass('public.' || t) IS NULL THEN
            RAISE NOTICE 'Skipping missing table public.%', t;
            CONTINUE;
        END IF;
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
        END LOOP;
        -- Start from no table privileges for browser roles; granted back below.
        EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
        EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    END LOOP;
END $$;

-- Small helper: the current customer's int8 userid (for the customer_userid columns).
CREATE OR REPLACE FUNCTION public.current_customer_userid()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT userid FROM public.customers WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.current_customer_userid() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_customer_userid() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. Public reference data (read-only for everyone)
-- ------------------------------------------------------------------------------
GRANT SELECT ON public.roles TO anon, authenticated;
CREATE POLICY "Public read roles" ON public.roles FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.site_settings TO anon, authenticated;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

DO $$ BEGIN
    IF to_regclass('public.master_data') IS NOT NULL THEN
        GRANT SELECT ON public.master_data TO anon, authenticated;
        CREATE POLICY "Public read master_data" ON public.master_data FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF to_regclass('public.plans') IS NOT NULL THEN
        GRANT SELECT ON public.plans TO anon, authenticated;
        CREATE POLICY "Public read active plans" ON public.plans FOR SELECT TO anon, authenticated USING (is_active);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Customers: own row only; only harmless profile columns are writable.
--    No INSERT/DELETE from the browser (rows are created by the auth trigger or the
--    server), and email, role, wallet, referral and email_verified columns are not
--    updatable, so a customer cannot verify themselves or credit their wallet.
-- ------------------------------------------------------------------------------
GRANT SELECT ON public.customers TO authenticated;
GRANT UPDATE (first_name, last_name, phone, address, heard_about, updated_at) ON public.customers TO authenticated;

CREATE POLICY "Customers read own row" ON public.customers
    FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Customers update own profile" ON public.customers
    FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- 4. Tax documents: customers see and upload their own; delete only their own uploads.
--    Status changes and admin uploads go through the server.
-- ------------------------------------------------------------------------------
GRANT SELECT, INSERT, DELETE ON public.tax_documents TO authenticated;

CREATE POLICY "Customers read own tax documents" ON public.tax_documents
    FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Customers upload own tax documents" ON public.tax_documents
    FOR INSERT TO authenticated
    WITH CHECK (
        customer_id = auth.uid()
        AND (customer_userid IS NULL OR customer_userid = public.current_customer_userid())
        AND uploader = 'customer'
        AND status = 'Pending'
    );
CREATE POLICY "Customers delete own uploads" ON public.tax_documents
    FOR DELETE TO authenticated USING (customer_id = auth.uid() AND uploader = 'customer');

-- ------------------------------------------------------------------------------
-- 5. Appointments: anyone can book (as a guest, or linked to their own account);
--    customers read their own. Status changes go through the server.
-- ------------------------------------------------------------------------------
GRANT INSERT ON public.appointments TO anon, authenticated;
GRANT SELECT ON public.appointments TO authenticated;

CREATE POLICY "Anyone can book an appointment" ON public.appointments
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        (customer_id IS NULL OR customer_id = auth.uid())
        AND (customer_userid IS NULL OR customer_userid = public.current_customer_userid())
        AND LOWER(COALESCE(status, 'pending')) = 'pending'
    );
CREATE POLICY "Customers read own appointments" ON public.appointments
    FOR SELECT TO authenticated
    USING (
        customer_id = auth.uid()
        OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
    );

-- ------------------------------------------------------------------------------
-- 6. Contact messages and feedback: write-only from the browser.
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    IF to_regclass('public.contacts') IS NOT NULL THEN
        GRANT INSERT ON public.contacts TO anon, authenticated;
        CREATE POLICY "Anyone can send a contact message" ON public.contacts
            FOR INSERT TO anon, authenticated WITH CHECK (COALESCE(status, 'new') = 'new');
    END IF;
    IF to_regclass('public.feedback') IS NOT NULL THEN
        GRANT INSERT ON public.feedback TO anon, authenticated;
        CREATE POLICY "Anyone can send feedback" ON public.feedback
            FOR INSERT TO anon, authenticated
            WITH CHECK (COALESCE(status, 'new') = 'new' AND (customer_id IS NULL OR customer_id = auth.uid()));
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7. Money tables: read-only, own rows. All writes happen inside the SECURITY
--    DEFINER functions below or on the server.
-- ------------------------------------------------------------------------------
GRANT SELECT ON public.wallet_transactions TO authenticated;
CREATE POLICY "Customers read own wallet transactions" ON public.wallet_transactions
    FOR SELECT TO authenticated USING (customer_id = auth.uid());

DO $$ BEGIN
    IF to_regclass('public.plan_purchases') IS NOT NULL THEN
        GRANT SELECT ON public.plan_purchases TO authenticated;
        CREATE POLICY "Customers read own plan purchases" ON public.plan_purchases
            FOR SELECT TO authenticated USING (customer_id = auth.uid());
    END IF;
    IF to_regclass('public.referral_rewards') IS NOT NULL THEN
        GRANT SELECT ON public.referral_rewards TO authenticated;
        CREATE POLICY "Customers read own referral rewards" ON public.referral_rewards
            FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid());
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 8. Admins: no policies and no grants -> invisible to anon and authenticated.
--    Admin login and admin data go through /api/admin/* with the service role.
-- ------------------------------------------------------------------------------

-- ------------------------------------------------------------------------------
-- 9. Functions
-- ------------------------------------------------------------------------------

-- Who is calling: 'anon', 'authenticated', 'service_role', or 'direct' (SQL editor /
-- a direct database connection, where no API JWT is set).
CREATE OR REPLACE FUNCTION public._api_caller_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(auth.jwt() ->> 'role', 'direct');
$$;
REVOKE ALL ON FUNCTION public._api_caller_role() FROM PUBLIC, anon, authenticated;

-- a) create_plan_purchase: customers may only order for themselves.
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
    IF public._api_caller_role() NOT IN ('service_role', 'direct')
       AND (auth.uid() IS NULL OR auth.uid() <> p_customer_id) THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;

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

-- b) cancel_plan_purchase: customers may only cancel their own pending order
--    (same body as paypal_migration.sql, plus the ownership check).
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
    IF public._api_caller_role() NOT IN ('service_role', 'direct')
       AND (auth.uid() IS NULL OR auth.uid() <> v_purchase.customer_id) THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    IF v_purchase.status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending purchases can be cancelled';
    END IF;
    IF v_purchase.paypal_capture_id IS NOT NULL THEN
        RAISE EXCEPTION 'This order has a PayPal payment and cannot be cancelled';
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

-- c) Grants. Postgres grants EXECUTE to PUBLIC by default (and Supabase also to anon /
--    authenticated), so revoke from all three, then grant back only what is needed.
REVOKE ALL ON FUNCTION public.create_plan_purchase(UUID, UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_plan_purchase(UUID, UUID, BOOLEAN) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cancel_plan_purchase(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_plan_purchase(UUID) TO authenticated, service_role;

-- Server only (service role): referral bonus, marking paid, admin overrides, PayPal.
REVOKE ALL ON FUNCTION public.apply_referral_signup(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_signup(UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.mark_plan_purchase_paid(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_plan_purchase_paid(UUID, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.admin_set_referral_reward_status(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_referral_reward_status(UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public._unlock_referral_reward(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._unlock_referral_reward(UUID, UUID) TO service_role;

-- Optional functions from other migrations (skipped if not installed).
DO $$
DECLARE
    f TEXT;
BEGIN
    FOREACH f IN ARRAY ARRAY[
        'public.record_paypal_payment(uuid, text, text, numeric)',
        'public.handle_new_auth_user()',
        'public.sync_customer_role()',
        'public.sync_admin_role()'
    ] LOOP
        IF to_regprocedure(f) IS NOT NULL THEN
            EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
        ELSE
            RAISE NOTICE 'Skipping missing function %', f;
        END IF;
    END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- Admin users (run separately, once):
--   Only a super administrator can add, change or remove admins (checked on the server
--   against this table). If nobody is superadmin yet, promote one existing admin:
--
--   UPDATE public.admins SET role = 'superadmin', role_id = 3 WHERE email = 'you@example.com';
--
--   Admin passwords are now stored as scrypt hashes. Rows still in plaintext are hashed
--   automatically the next time ANY admin signs in. Change the seeded default
--   admin@polaris.com password (from schema.sql) from the Admin users page.
-- ==============================================================================

-- ==============================================================================
-- Checks (run separately after the migration; both should return no rows):
--
--   -- policies that still allow everything
--   SELECT tablename, policyname, roles, cmd, qual, with_check
--   FROM pg_policies WHERE schemaname = 'public' AND (qual = 'true' OR with_check = 'true')
--     AND cmd <> 'SELECT';
--
--   -- functions anon can still execute
--   SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND has_function_privilege('anon', p.oid, 'EXECUTE')
--     AND p.proname IN ('apply_referral_signup', 'mark_plan_purchase_paid',
--                       'admin_set_referral_reward_status', 'create_plan_purchase',
--                       'cancel_plan_purchase', 'record_paypal_payment', '_unlock_referral_reward');
-- ==============================================================================
