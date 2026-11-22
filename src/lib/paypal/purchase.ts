// SERVER ONLY: shared checks for the PayPal API routes.
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest, isSupabaseAdminConfigured } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  extractCompletedCapture,
  getPayPalOrder,
  isPayPalConfigured,
  PayPalApiError,
  PAYPAL_CURRENCY,
} from '@/lib/paypal/server';

export type PayablePurchase = {
  id: string;
  customer_id: string;
  plan_name: string;
  amount_due: number;
  status: string;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
};

type Result = { purchase: PayablePurchase } | { error: NextResponse };

/** Confirms PayPal is configured, the caller is signed in, and the purchase is theirs and still payable. */
export async function loadPayablePurchase(req: Request, purchaseId: unknown): Promise<Result> {
  if (!isPayPalConfigured || !isSupabaseAdminConfigured) {
    return {
      error: NextResponse.json(
        { error: 'Online payments are not configured yet. Please contact us to pay for your order.' },
        { status: 503 }
      ),
    };
  }
  if (typeof purchaseId !== 'string' || !purchaseId) {
    return { error: NextResponse.json({ error: 'Missing purchaseId' }, { status: 400 }) };
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return { error: NextResponse.json({ error: 'Please sign in again to pay.' }, { status: 401 }) };
  }

  const { data, error } = await getSupabaseAdmin()
    .from('plan_purchases')
    .select('id, customer_id, plan_name, amount_due, status, paypal_order_id, paypal_capture_id')
    .eq('id', purchaseId)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  }
  if (!data || data.customer_id !== user.id) {
    return { error: NextResponse.json({ error: 'Order not found' }, { status: 404 }) };
  }

  return { purchase: { ...data, amount_due: Number(data.amount_due) } as PayablePurchase };
}

export type RecordOutcome =
  | { kind: 'paid'; captureId: string }
  | { kind: 'not_completed' }
  | { kind: 'mismatch' }
  | { kind: 'record_failed'; captureId: string };

/**
 * Records a PayPal order whose money has been captured against its plan purchase.
 * Checks that the capture belongs to this purchase and matches the amount and currency,
 * then marks the purchase paid (which also unlocks the referrer's bonus). Safe to repeat.
 */
export async function recordCompletedOrder(
  purchase: { id: string; amount_due: number | string },
  orderId: string,
  order: any
): Promise<RecordOutcome> {
  const capture = extractCompletedCapture(order);
  if (!capture) return { kind: 'not_completed' };
  if (
    capture.customId !== purchase.id ||
    capture.currency !== PAYPAL_CURRENCY ||
    Math.round(capture.amount * 100) !== Math.round(Number(purchase.amount_due) * 100)
  ) {
    console.error('PayPal capture mismatch', { purchaseId: purchase.id, capture });
    return { kind: 'mismatch' };
  }
  const { error } = await getSupabaseAdmin().rpc('record_paypal_payment', {
    p_purchase_id: purchase.id,
    p_paypal_order_id: orderId,
    p_capture_id: capture.captureId,
    p_amount: capture.amount,
  });
  if (error) {
    // Money was captured but not recorded: log loudly so an admin can reconcile.
    console.error('PayPal capture recorded FAILED', { purchaseId: purchase.id, captureId: capture.captureId, error });
    return { kind: 'record_failed', captureId: capture.captureId };
  }
  return { kind: 'paid', captureId: capture.captureId };
}

/** Thrown when cancelling is refused because PayPal may already have the money. */
export class CancelBlockedError extends Error {}

/**
 * Before a pending purchase is cancelled: if it has a PayPal order, ask PayPal whether that
 * order was already paid. A paid order is recorded instead of cancelled, so a customer who
 * paid is never cancelled (and refunded wallet credit) by mistake. Throws CancelBlockedError,
 * with a message for the user, when the order must not be cancelled.
 */
export async function guardCancelAgainstPayPal(db: SupabaseClient, purchaseId: string) {
  const { data: purchase, error } = await db
    .from('plan_purchases')
    .select('id, amount_due, status, paypal_order_id')
    .eq('id', purchaseId)
    .maybeSingle();
  if (error) throw new CancelBlockedError(error.message || 'Could not load the order.');
  if (!purchase) throw new CancelBlockedError('Order not found.');
  if (!purchase.paypal_order_id || purchase.status !== 'pending') return;
  if (!isPayPalConfigured) {
    throw new CancelBlockedError(
      'This order was sent to PayPal, and PayPal is not configured on the server to check it. Check the payment in PayPal first.'
    );
  }

  let order: any;
  try {
    order = await getPayPalOrder(purchase.paypal_order_id);
  } catch (err) {
    // PayPal no longer knows the order (expired before payment): nothing was paid.
    if (err instanceof PayPalApiError && err.status === 404) return;
    throw new CancelBlockedError("Couldn't check this order's PayPal payment. Please try again in a minute.");
  }

  const outcome = await recordCompletedOrder(purchase, purchase.paypal_order_id, order);
  switch (outcome.kind) {
    case 'not_completed':
      return; // Never paid: fine to cancel.
    case 'paid':
      throw new CancelBlockedError('This order was already paid through PayPal, so it has been marked paid instead of cancelled.');
    case 'record_failed':
      throw new CancelBlockedError(
        `PayPal shows this order as paid (capture ${outcome.captureId}), so it can't be cancelled. Please try again to record the payment.`
      );
    case 'mismatch':
      throw new CancelBlockedError('PayPal shows a payment on this order that does not match it. Check it in PayPal before cancelling.');
  }
}
