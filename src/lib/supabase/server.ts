// SERVER ONLY: import this from API routes, never from client components.
import { createClient, SupabaseClient, type User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

let adminClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key.
 * Never import this from a client component: the key bypasses RLS.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseAdminConfigured) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server.');
  }
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

/**
 * Faster variant for hot paths (login, dashboard entry): verifies the access token's
 * signature locally with the project's cached public keys when the project uses
 * asymmetric JWT keys, instead of a round trip to Supabase Auth. Falls back to a
 * getUser() call otherwise (supabase-js does this inside getClaims).
 * Returns the user as described by the token (id, email, app/user metadata).
 */
export async function getUserClaimsFromRequest(req: Request): Promise<User | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getClaims(token);
  const claims = data?.claims as Record<string, any> | undefined;
  if (error || !claims?.sub) return null;
  return {
    id: String(claims.sub),
    email: claims.email,
    phone: claims.phone,
    app_metadata: claims.app_metadata || {},
    user_metadata: claims.user_metadata || {},
    aud: String(claims.aud || 'authenticated'),
    role: claims.role,
    created_at: '',
  } as User;
}

/** Resolves the signed-in Supabase user from an "Authorization: Bearer <access token>" header. */
export async function getUserFromRequest(req: Request) {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
