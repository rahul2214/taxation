/**
 * Browser side of the admin console's server data path.
 *
 * Admin pages have no Supabase session, and RLS gives the anon key no access to
 * other customers' rows or admin tables. So admin reads/writes go to
 * /api/admin/data, which checks the httpOnly admin cookie set by /api/admin/session
 * and runs the query with the service role.
 */

/** True on /admin pages: shared data functions route through the admin API there. */
export function isAdminContext() {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
}

export async function adminApi<T = any>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch('/api/admin/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ op, args }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(body?.error || 'Request failed'), { code: body?.code, status: res.status });
  }
  return body.data as T;
}

export interface AdminSessionInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  role_id: number;
}

/** The current admin (from the server-checked cookie), or null. */
export async function getAdminSession(): Promise<AdminSessionInfo | null> {
  try {
    const res = await fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.admin || null;
  } catch {
    return null;
  }
}

export async function adminLogin(email: string, password: string): Promise<AdminSessionInfo> {
  const res = await fetch('/api/admin/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || 'Invalid administrator credentials.');
  return body.admin;
}

export async function adminLogout() {
  try {
    await fetch('/api/admin/session', { method: 'DELETE', credentials: 'same-origin' });
  } catch {
    // Cookie expires on its own.
  }
}
