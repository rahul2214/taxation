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

REVOKE ALL ON FUNCTION public.cancel_plan_purchase(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_plan_purchase(UUID) TO service_role;

-- Check (expect only service_role / postgres in the list):
-- SELECT grantee, privilege_type FROM information_schema.routine_privileges
--  WHERE routine_schema = 'public' AND routine_name = 'cancel_plan_purchase';
