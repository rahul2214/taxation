// SERVER ONLY: shared checks for the PayPal API routes.
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest, isSupabaseAdminConfigured } from '@/lib/supabase/server';
import { isPayPalConfigured } from '@/lib/paypal/server';

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
