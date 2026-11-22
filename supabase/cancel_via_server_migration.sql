-- ==============================================================================
-- Cancel plan orders only through the server
-- ==============================================================================
-- Customers now cancel an order through /api/account (action "cancel-purchase"), which
-- first asks PayPal whether the order was already paid. A paid order is recorded as paid
-- instead of being cancelled, so a customer who paid can't cancel and get their wallet
-- credit back by mistake.
--
-- Until now customers could also call cancel_plan_purchase straight from the browser,
-- which skips that check. This removes that direct access; the server (service role)
-- and admins (also through the server) keep it.
--
-- Run AFTER the code from the same commit is deployed (the old code cancels directly).
-- Safe to run more than once.
-- ==============================================================================

-- Skips quietly if the function isn't there yet (plans/PayPal migrations not run).
DO $$
BEGIN
    IF to_regprocedure('public.cancel_plan_purchase(uuid)') IS NULL THEN
        RAISE NOTICE 'cancel_plan_purchase(uuid) does not exist yet: run plans_and_referral_rewards_migration.sql, paypal_migration.sql and rls_hardening_migration.sql first, then this file again.';
    ELSE
        REVOKE ALL ON FUNCTION public.cancel_plan_purchase(UUID) FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.cancel_plan_purchase(UUID) TO service_role;
    END IF;
END $$;

-- Check (expect only service_role / postgres in the list):
-- SELECT grantee, privilege_type FROM information_schema.routine_privileges
--  WHERE routine_schema = 'public' AND routine_name = 'cancel_plan_purchase';
