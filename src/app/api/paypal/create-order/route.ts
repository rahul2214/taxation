import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { createPayPalOrder, getPayPalOrder, PayPalApiError } from '@/lib/paypal/server';
import { loadPayablePurchase } from '@/lib/paypal/purchase';

export const dynamic = 'force-dynamic';

/**
 * Creates a PayPal order for a pending plan purchase.
 * The amount always comes from the database (amount_due), never from the browser.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await loadPayablePurchase(req, body?.purchaseId);
    if ('error' in result) return result.error;
    const { purchase } = result;

    if (purchase.status !== 'pending') {
      return NextResponse.json({ error: `This order is already ${purchase.status}.` }, { status: 409 });
    }
    if (!(purchase.amount_due > 0)) {
      return NextResponse.json({ error: 'Nothing to pay on this order.' }, { status: 400 });
    }

    // Reuse a PayPal order that is still open for this purchase
    if (purchase.paypal_order_id) {
      try {
        const existing = await getPayPalOrder(purchase.paypal_order_id);
        if (existing?.status === 'CREATED' || existing?.status === 'APPROVED') {
          return NextResponse.json({ id: existing.id });
        }
      } catch {
        // Expired or unknown order: create a new one below
      }
    }

    const order = await createPayPalOrder({
      purchaseId: purchase.id,
      amount: purchase.amount_due,
      description: `Polaris Tax Services - ${purchase.plan_name}`,
    });

    const { error } = await getSupabaseAdmin()
      .from('plan_purchases')
      .update({ paypal_order_id: order.id, updated_at: new Date().toISOString() })
      .eq('id', purchase.id)
      .eq('status', 'pending');
    if (error) throw error;

    return NextResponse.json({ id: order.id });
  } catch (err: any) {
    console.error('PayPal create-order error:', err?.details || err);
    const status = err instanceof PayPalApiError ? 502 : 500;
    return NextResponse.json({ error: 'Could not start PayPal checkout. Please try again.' }, { status });
  }
}
