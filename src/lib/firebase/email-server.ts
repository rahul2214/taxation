// SERVER ONLY: import from API routes, never from client components.
//
// Firebase is used here only to SEND and VERIFY emails (email verification and
// password reset). Logins and data stay in Supabase. For every email/password
// customer we keep a "mailer" Firebase account with the same email and a password
// only the server knows (an HMAC of the email). The Firebase action codes in the
// emails are checked here through Firebase's Identity Toolkit REST API, and the
// result is applied to the Supabase account with the service role key.
import { createHmac, randomBytes } from 'crypto';
import type { User } from '@supabase/supabase-js';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/server';

const API_KEY = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
const SHADOW_SECRET = process.env.FIREBASE_SHADOW_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BASE = 'https://identitytoolkit.googleapis.com/v1/accounts';

export const isFirebaseEmailConfigured = Boolean(API_KEY && SHADOW_SECRET && isSupabaseAdminConfigured);

export function configError() {
  const missing = [
    !API_KEY && 'NEXT_PUBLIC_FIREBASE_API_KEY',
    !isSupabaseAdminConfigured && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean);
  return `Email service is not configured on the server (missing ${missing.join(', ')}).`;
}

export class FirebaseApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

function siteOrigin(req?: Request) {
  const fromReq = req ? new URL(req.url).origin : '';
  return (process.env.NEXT_PUBLIC_SITE_URL || fromReq || 'http://localhost:9002').replace(/\/+$/, '');
}

async function call(endpoint: string, body: Record<string, unknown>, req?: Request) {
  const res = await fetch(`${BASE}:${endpoint}?key=${encodeURIComponent(API_KEY)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // API keys restricted to HTTP referrers need this to accept server calls.
      Referer: `${siteOrigin(req)}/`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // e.g. "EMAIL_EXISTS", "INVALID_OOB_CODE", "EXPIRED_OOB_CODE", "WEAK_PASSWORD : ..."
    const code = String(data?.error?.message || `HTTP_${res.status}`).split(' ')[0];
    throw new FirebaseApiError(code);
  }
  return data;
}

function shadowPassword(email: string) {
  return createHmac('sha256', SHADOW_SECRET).update(email.toLowerCase()).digest('base64url');
}

/** Signs in to (or creates) the mailer Firebase account for this email; returns its ID token. */
async function shadowIdToken(email: string, req?: Request): Promise<{ idToken: string; emailVerified: boolean }> {
  const password = shadowPassword(email);
  try {
    const r = await call('signInWithPassword', { email, password, returnSecureToken: true }, req);
    const look = await call('lookup', { idToken: r.idToken }, req);
    return { idToken: r.idToken, emailVerified: Boolean(look?.users?.[0]?.emailVerified) };
  } catch (err) {
    const code = err instanceof FirebaseApiError ? err.code : '';
    if (code === 'EMAIL_NOT_FOUND' || code === 'INVALID_LOGIN_CREDENTIALS') {
      try {
        const r = await call('signUp', { email, password, returnSecureToken: true }, req);
        return { idToken: r.idToken, emailVerified: false };
      } catch (signUpErr) {
        // EMAIL_EXISTS: the Firebase password was changed (e.g. reset on Firebase's own page).
        throw signUpErr;
      }
    }
    throw err;
  }
}

/** Finds the Supabase auth user + customer row for an email. */
export async function findAccount(email: string) {
  const authUser = await findAuthUserByEmail(email);
  if (!authUser) return null;
  const customer = await ensureCustomerRow(authUser);
  return customer ? { customer, authUser } : null;
}

/** Finds the Supabase login account for an email (the source of truth, not the customers table). */
async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = getSupabaseAdmin();
  const target = email.toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < 1000) break;
  }
  return null;
}

/**
 * Returns the customers row for this login account, creating it if missing.
 * A row left behind by a deleted account with the same email (its id no longer
 * matches any login) blocks the email's unique key, so it is removed first.
 */
export async function ensureCustomerRow(authUser: User) {
  const admin = getSupabaseAdmin();
  const { data: own } = await admin.from('customers').select('*').eq('id', authUser.id).maybeSingle();
  if (own) return own;

  const email = (authUser.email || '').toLowerCase();
  const { data: sameEmail } = await admin.from('customers').select('id').ilike('email', email).maybeSingle();
  if (sameEmail && sameEmail.id !== authUser.id) {
    const { data: owner } = await admin.auth.admin.getUserById(sameEmail.id);
    if (owner?.user) return null; // Belongs to a different live account: leave it alone.
    await admin.from('customers').delete().eq('id', sameEmail.id);
  }

  const meta = authUser.user_metadata || {};
  const fullName = String(meta.full_name || meta.name || '').trim();
  const first = String(meta.first_name || meta.given_name || fullName.split(/\s+/)[0] || email.split('@')[0]);
  const last = String(meta.last_name || meta.family_name || fullName.split(/\s+/).slice(1).join(' ') || '');
  const prefix = first.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'POLARIS';
  const { data: created, error } = await admin
    .from('customers')
    .insert({
      id: authUser.id,
      email,
      first_name: first,
      last_name: last,
      phone: meta.phone || null,
      role: 'customer',
      role_id: 2,
      referral_code: meta.referral_code || `${prefix}-${randomBytes(2).toString('hex').toUpperCase()}`,
      heard_about: meta.heard_about || null,
      // Only email/password accounts need to verify; Google already verified the address.
      email_verified: authUser.app_metadata?.provider !== 'email',
    })
    .select('*')
    .single();
  if (error) {
    // Lost a race with the signup page or the database trigger: read what they wrote.
    const { data: again } = await admin.from('customers').select('*').eq('id', authUser.id).maybeSingle();
    return again;
  }
  return created;
}

/** True when this login account may use the site: Google accounts always, email accounts once verified. */
export async function isAccountVerified(authUser: User, req?: Request) {
  if (authUser.app_metadata?.provider !== 'email') return true;
  const customer = await ensureCustomerRow(authUser);
  if (customer?.email_verified === true) return true;
  // Verified on Firebase's own page (no custom action URL): copy that over.
  return refreshVerifiedFromFirebase(authUser.email || '', req);
}

export async function markEmailVerified(email: string) {
  const account = await findAccount(email);
  if (!account) return false;
  const admin = getSupabaseAdmin();
  await admin.from('customers').update({ email_verified: true, updated_at: new Date().toISOString() }).eq('id', account.authUser.id);
  if (!account.authUser.email_confirmed_at) {
    await admin.auth.admin.updateUserById(account.authUser.id, { email_confirm: true });
  }
  return true;
}

export async function sendVerificationEmail(email: string, req?: Request) {
  const { idToken, emailVerified } = await shadowIdToken(email, req);
  if (emailVerified) {
    await markEmailVerified(email);
    return { alreadyVerified: true };
  }
  await call(
    'sendOobCode',
    { requestType: 'VERIFY_EMAIL', idToken, continueUrl: `${siteOrigin(req)}/login?verified=1` },
    req
  );
  return { alreadyVerified: false };
}

/**
 * True when the user verified through Firebase's hosted page (the site never saw
 * the code). Used at login so verification works even without a custom action URL.
 */
export async function refreshVerifiedFromFirebase(email: string, req?: Request) {
  try {
    const { emailVerified } = await shadowIdToken(email, req);
    if (emailVerified) await markEmailVerified(email);
    return emailVerified;
  } catch {
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, req?: Request) {
  await shadowIdToken(email, req).catch(() => undefined); // make sure the Firebase account exists
  await call(
    'sendOobCode',
    { requestType: 'PASSWORD_RESET', email, continueUrl: `${siteOrigin(req)}/login?reset=1` },
    req
  );
}

/** Applies a VERIFY_EMAIL code from the email link. Returns the verified email. */
export async function applyVerifyCode(oobCode: string, req?: Request) {
  const r = await call('update', { oobCode }, req);
  const email = String(r.email || '').toLowerCase();
  if (email) await markEmailVerified(email);
  return email;
}

/** Checks a PASSWORD_RESET code without using it. Returns the account email. */
export async function checkResetCode(oobCode: string, req?: Request) {
  const r = await call('resetPassword', { oobCode }, req);
  return String(r.email || '').toLowerCase();
}

/** Uses a PASSWORD_RESET code: sets the new password on the Supabase account. */
export async function applyResetCode(oobCode: string, newPassword: string, req?: Request) {
  const email = await checkResetCode(oobCode, req);
  const account = await findAccount(email);
  if (!account) throw new FirebaseApiError('EMAIL_NOT_FOUND');
  // Consume the code; the Firebase account keeps the server-only password.
  await call('resetPassword', { oobCode, newPassword: shadowPassword(email) }, req);
  const { error } = await getSupabaseAdmin().auth.admin.updateUserById(account.authUser.id, {
    password: newPassword,
    // Getting the reset email proves they own the address.
    email_confirm: true,
  });
  if (error) throw error;
  await markEmailVerified(email);
  return email;
}

/**
 * If someone reset their password on Firebase's own page (no custom action URL),
 * Firebase has the new password and Supabase doesn't. When Supabase rejects a
 * login, this checks the password against Firebase and copies it over.
 */
export async function syncPasswordFromFirebase(email: string, password: string, req?: Request) {
  if (password === shadowPassword(email)) return false;
  let idToken: string;
  try {
    const r = await call('signInWithPassword', { email, password, returnSecureToken: true }, req);
    idToken = r.idToken;
  } catch {
    return false;
  }
  const account = await findAccount(email);
  if (!account) return false;
  const { error } = await getSupabaseAdmin().auth.admin.updateUserById(account.authUser.id, { password, email_confirm: true });
  if (error) return false;
  await markEmailVerified(email);
  // Put the Firebase account back on the server-only password.
  await call('update', { idToken, password: shadowPassword(email), returnSecureToken: false }, req).catch(() => undefined);
  return true;
}

/** Maps Firebase error codes to messages a customer can act on. */
export function friendlyError(err: unknown) {
  const code = err instanceof FirebaseApiError ? err.code : '';
  switch (code) {
    case 'EXPIRED_OOB_CODE':
      return 'This link has expired. Please request a new one.';
    case 'INVALID_OOB_CODE':
      return 'This link is invalid or has already been used. Please request a new one.';
    case 'WEAK_PASSWORD':
      return 'Please choose a stronger password (at least 8 characters).';
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'Too many requests. Please wait a few minutes and try again.';
    case 'OPERATION_NOT_ALLOWED':
    case 'PASSWORD_LOGIN_DISABLED':
      return 'Email sign-in is turned off in Firebase (Authentication -> Sign-in method -> Email/Password).';
    case 'API_KEY_INVALID':
    case 'API_KEY_HTTP_REFERRER_BLOCKED':
      return 'The Firebase API key is invalid or restricted for this site.';
    default:
      return err instanceof Error && err.message && !/^[A-Z_]+$/.test(err.message)
        ? err.message
        : 'Something went wrong. Please try again.';
  }
}
