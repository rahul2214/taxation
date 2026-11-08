-- ==============================================================================
-- Polaris Tax Services - PayPal payments for plan purchases
-- Run AFTER plans_and_referral_rewards_migration.sql
-- Supabase Dashboard -> SQL Editor -> New Query -> Run. Safe to re-run.
--
-- PayPal payments are recorded only by the website's server (using the
-- SUPABASE_SERVICE_ROLE_KEY), after it has captured and verified the payment
-- with PayPal. Browsers cannot call record_paypal_payment directly.
-- ==============================================================================

ALTER TABLE public.plan_purchases
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_purchases_paypal_order ON public.plan_purchases(paypal_order_id) WHERE paypal_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_purchases_paypal_capture ON public.plan_purchases(paypal_capture_id) WHERE paypal_capture_id IS NOT NULL;

-- Records a verified PayPal capture, marks the purchase paid and (through
-- mark_plan_purchase_paid) unlocks the referrer's locked bonus. Idempotent.
CREATE OR REPLACE FUNCTION public.record_paypal_payment(
    p_purchase_id UUID,
    p_paypal_order_id TEXT,
    p_capture_id TEXT,
    p_amount NUMERIC
)
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

    -- Same capture recorded twice (e.g. retried request): return as-is
    IF v_purchase.status = 'paid' AND v_purchase.paypal_capture_id = p_capture_id THEN
        RETURN v_purchase;
    END IF;

    IF v_purchase.status <> 'pending' THEN
        RAISE EXCEPTION 'Purchase is % and cannot accept a PayPal payment', v_purchase.status;
    END IF;
    IF v_purchase.paypal_order_id IS DISTINCT FROM p_paypal_order_id THEN
        RAISE EXCEPTION 'PayPal order does not match this purchase';
    END IF;
    IF ROUND(p_amount, 2) <> ROUND(v_purchase.amount_due, 2) THEN
        RAISE EXCEPTION 'Paid amount % does not match amount due %', p_amount, v_purchase.amount_due;
    END IF;

    UPDATE public.plan_purchases
       SET paypal_capture_id = p_capture_id, updated_at = NOW()
     WHERE id = p_purchase_id;

    RETURN public.mark_plan_purchase_paid(p_purchase_id, 'PayPal', p_capture_id);
END;
$$;

REVOKE ALL ON FUNCTION public.record_paypal_payment(UUID, TEXT, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_paypal_payment(UUID, TEXT, TEXT, NUMERIC) TO service_role;

-- A purchase that already has a PayPal checkout started should not be
-- cancellable from the browser while PayPal may still be capturing it.
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

NOTIFY pgrst, 'reload schema';
