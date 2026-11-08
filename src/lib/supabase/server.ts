// SERVER ONLY: import this from API routes, never from client components.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

/** Resolves the signed-in Supabase user from an "Authorization: Bearer <access token>" header. */
export async function getUserFromRequest(req: Request) {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
