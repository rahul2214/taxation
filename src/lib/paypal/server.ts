// SERVER ONLY: import this from API routes, never from client components (uses the PayPal secret).
// PayPal REST API (Orders v2). Set PAYPAL_ENV=live for real payments; anything else uses the sandbox.
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

export const PAYPAL_CURRENCY = 'USD';
export const isPayPalConfigured = Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);

export class PayPalApiError extends Error {
  constructor(message: string, public status: number, public details?: any) {
    super(message);
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new PayPalApiError('Could not authenticate with PayPal', res.status, data);
  }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 0) * 1000 };
  return cachedToken.value;
}

async function paypalFetch(path: string, init: RequestInit & { requestId?: string } = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.requestId ? { 'PayPal-Request-Id': init.requestId } : {}),
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const issue = data?.details?.[0]?.issue;
    throw new PayPalApiError(issue || data?.message || 'PayPal request failed', res.status, data);
  }
  return data;
}

export async function createPayPalOrder(params: {
  purchaseId: string;
  amount: number;
  description: string;
}): Promise<{ id: string; status: string }> {
  return paypalFetch('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.purchaseId,
          custom_id: params.purchaseId,
          description: params.description.slice(0, 127),
          amount: { currency_code: PAYPAL_CURRENCY, value: params.amount.toFixed(2) },
        },
      ],
      application_context: {
        brand_name: 'Polaris Tax Services',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    }),
  });
}

export async function getPayPalOrder(orderId: string) {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
}

export async function capturePayPalOrder(orderId: string) {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    requestId: `capture-${orderId}`,
  });
}

/** Pulls the completed capture out of a PayPal order/capture response. */
export function extractCompletedCapture(order: any) {
  const unit = order?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.find((c: any) => c.status === 'COMPLETED');
  if (!capture) return null;
  return {
    captureId: String(capture.id),
    amount: Number(capture.amount?.value),
    currency: String(capture.amount?.currency_code || ''),
    customId: String(capture.custom_id || unit?.custom_id || unit?.reference_id || ''),
  };
}
