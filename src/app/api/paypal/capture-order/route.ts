import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import {
  capturePayPalOrder,
  extractCompletedCapture,
  getPayPalOrder,
  PayPalApiError,
  PAYPAL_CURRENCY,
} from '@/lib/paypal/server';
import { loadPayablePurchase } from '@/lib/paypal/purchase';

export const dynamic = 'force-dynamic';

/**
 * Captures an approved PayPal order, verifies it against the purchase, and records it.
 * Recording the payment marks the purchase paid and unlocks the referrer's locked bonus.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
    const result = await loadPayablePurchase(req, body?.purchaseId);
    if ('error' in result) return result.error;
    const { purchase } = result;

    if (!orderId || purchase.paypal_order_id !== orderId) {
      return NextResponse.json({ error: 'PayPal order does not match this purchase.' }, { status: 400 });
    }
    if (purchase.status === 'paid') {
      return NextResponse.json({ status: 'paid' });
    }
    if (purchase.status !== 'pending') {
      return NextResponse.json({ error: `This order is ${purchase.status}.` }, { status: 409 });
    }

    let order: any;
    try {
      order = await capturePayPalOrder(orderId);
    } catch (err) {
      // A retried request after a successful capture: read the order instead
      if (err instanceof PayPalApiError && err.message === 'ORDER_ALREADY_CAPTURED') {
        order = await getPayPalOrder(orderId);
      } else if (err instanceof PayPalApiError && err.message === 'INSTRUMENT_DECLINED') {
        // Buyer can pick another funding source in the PayPal popup
        return NextResponse.json({ error: 'INSTRUMENT_DECLINED' }, { status: 422 });
      } else {
        throw err;
      }
    }

    const capture = extractCompletedCapture(order);
    if (!capture) {
      return NextResponse.json({ error: 'PayPal did not complete the payment.' }, { status: 402 });
    }
    if (
      capture.customId !== purchase.id ||
      capture.currency !== PAYPAL_CURRENCY ||
      Math.round(capture.amount * 100) !== Math.round(purchase.amount_due * 100)
    ) {
      console.error('PayPal capture mismatch', { purchaseId: purchase.id, capture });
      return NextResponse.json(
        { error: 'Payment details did not match your order. Please contact support.' },
        { status: 409 }
      );
    }

    const { error } = await getSupabaseAdmin().rpc('record_paypal_payment', {
      p_purchase_id: purchase.id,
      p_paypal_order_id: orderId,
      p_capture_id: capture.captureId,
      p_amount: capture.amount,
    });
    if (error) {
      // Money was captured but not recorded: log loudly so an admin can reconcile
      console.error('PayPal capture recorded FAILED', { purchaseId: purchase.id, captureId: capture.captureId, error });
      return NextResponse.json(
        { error: 'Your payment went through but we could not update your order. Our team will confirm it shortly.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'paid', captureId: capture.captureId });
  } catch (err: any) {
    console.error('PayPal capture-order error:', err?.details || err);
    return NextResponse.json({ error: 'Could not complete the PayPal payment. Please try again.' }, { status: 500 });
  }
}
