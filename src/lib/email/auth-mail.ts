// SERVER ONLY: import from API routes, never from client components.
//
// Email verification and password reset emails, sent with Resend (https://resend.com).
// Logins and data stay in Supabase. The links carry a signed token (HMAC with a
// server-only secret), so no extra table is needed:
//   - verify links: { email, expiry }, valid 24 hours.
//   - reset links:  { user id, nonce, expiry }, valid 1 hour. The nonce's hash is stored
//     in the user's Supabase app_metadata and cleared once used, so each link works once
//     and only the most recent link works.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { User } from '@supabase/supabase-js';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM = process.env.RESEND_FROM_EMAIL || '';
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BRAND = 'Polaris Tax Services';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export const isAuthMailConfigured = Boolean(RESEND_API_KEY && FROM && TOKEN_SECRET && isSupabaseAdminConfigured);

export function configError() {
  const missing = [
    !RESEND_API_KEY && 'RESEND_API_KEY',
    !FROM && 'RESEND_FROM_EMAIL',
    !isSupabaseAdminConfigured && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean);
  return `Email service is not configured on the server (missing ${missing.join(', ')}).`;
}

/** An error whose message is safe to show to the customer. */
export class AuthMailError extends Error {}

function siteOrigin(req?: Request) {
  const fromReq = req ? new URL(req.url).origin : '';
  return (process.env.NEXT_PUBLIC_SITE_URL || fromReq || 'http://localhost:9002').replace(/\/+$/, '');
}

// ---------- Signed tokens ----------

function sign(data: string) {
  return createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
}

function makeToken(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function readToken(token: string, purpose: 'v' | 'r'): Record<string, any> {
  const invalid = new AuthMailError('This link is invalid or has already been used. Please request a new one.');
  const [body, sig] = token.split('.');
  if (!body || !sig) throw invalid;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw invalid;
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    throw invalid;
  }
  if (payload?.p !== purpose) throw invalid;
  if (typeof payload.x !== 'number' || Date.now() > payload.x) {
    throw new AuthMailError('This link has expired. Please request a new one.');
  }
  return payload;
}

function hashNonce(nonce: string) {
  return createHash('sha256').update(nonce).digest('hex');
}

// ---------- Resend ----------

async function sendMail(to: string, subject: string, html: string, text: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error('Resend error:', res.status, data);
    if (res.status === 429) throw new AuthMailError('Too many emails right now. Please wait a minute and try again.');
    throw new AuthMailError('We could not send the email. Please try again later.');
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function emailLayout(heading: string, intro: string, buttonLabel: string, url: string, footnote: string) {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f3ee;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ee;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e4e0d6;border-radius:4px">
        <tr><td style="padding:32px 32px 8px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#6b6b6b">${BRAND}</td></tr>
        <tr><td style="padding:0 32px;font-size:24px;line-height:1.3;font-weight:bold">${escapeHtml(heading)}</td></tr>
        <tr><td style="padding:16px 32px 0;font-size:15px;line-height:1.6">${escapeHtml(intro)}</td></tr>
        <tr><td style="padding:24px 32px">
          <a href="${safeUrl}" style="display:inline-block;background:#1f3a5f;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:15px;font-weight:bold">${escapeHtml(buttonLabel)}</a>
        </td></tr>
        <tr><td style="padding:0 32px 8px;font-size:13px;line-height:1.6;color:#6b6b6b">If the button doesn't work, copy this link into your browser:<br><a href="${safeUrl}" style="color:#1f3a5f;word-break:break-all">${safeUrl}</a></td></tr>
        <tr><td style="padding:16px 32px 32px;font-size:13px;line-height:1.6;color:#6b6b6b">${escapeHtml(footnote)}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ---------- Supabase accounts ----------

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
export async function isAccountVerified(authUser: User) {
  if (authUser.app_metadata?.provider !== 'email') return true;
  const customer = await ensureCustomerRow(authUser);
  return customer?.email_verified === true;
}

async function markEmailVerified(authUser: User) {
  const admin = getSupabaseAdmin();
  await admin.from('customers').update({ email_verified: true, updated_at: new Date().toISOString() }).eq('id', authUser.id);
  if (!authUser.email_confirmed_at) {
    await admin.auth.admin.updateUserById(authUser.id, { email_confirm: true });
  }
}

// ---------- Verification ----------

export async function sendVerificationEmail(email: string, req?: Request) {
  const token = makeToken({ p: 'v', e: email.toLowerCase(), x: Date.now() + VERIFY_TTL_MS });
  const url = `${siteOrigin(req)}/auth/action?mode=verifyEmail&oobCode=${encodeURIComponent(token)}`;
  await sendMail(
    email,
    `Verify your email for ${BRAND}`,
    emailLayout(
      'Verify your email address',
      `Thanks for creating your ${BRAND} account. Click the button below to confirm this is your email address.`,
      'Verify email',
      url,
      "This link expires in 24 hours. If you didn't create an account, you can ignore this email."
    ),
    `Verify your email for ${BRAND}:\n\n${url}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`
  );
}

/** Applies a verify link's token. Returns the verified email. */
export async function applyVerifyCode(token: string) {
  const { e: email } = readToken(token, 'v');
  const account = await findAccount(String(email || ''));
  if (!account) throw new AuthMailError('We could not find an account for this link.');
  await markEmailVerified(account.authUser);
  return account.authUser.email?.toLowerCase() || String(email);
}

// ---------- Password reset ----------

export async function sendPasswordResetEmail(authUser: User, req?: Request) {
  const nonce = randomBytes(24).toString('base64url');
  const expires = Date.now() + RESET_TTL_MS;
  // Only the newest link works: this replaces any earlier nonce.
  const { error } = await getSupabaseAdmin().auth.admin.updateUserById(authUser.id, {
    app_metadata: { password_reset: { hash: hashNonce(nonce), exp: expires } },
  });
  if (error) throw error;

  const token = makeToken({ p: 'r', u: authUser.id, n: nonce, x: expires });
  const url = `${siteOrigin(req)}/auth/action?mode=resetPassword&oobCode=${encodeURIComponent(token)}`;
  const email = authUser.email || '';
  await sendMail(
    email,
    `Reset your ${BRAND} password`,
    emailLayout(
      'Reset your password',
      `We received a request to reset the password for ${email}. Click the button below to choose a new one.`,
      'Reset password',
      url,
      "This link expires in 1 hour and can be used once. If you didn't ask to reset your password, you can ignore this email; your password won't change."
    ),
    `Reset your ${BRAND} password:\n\n${url}\n\nThis link expires in 1 hour and can be used once. If you didn't ask for this, ignore this email.`
  );
}

/** Checks a reset token without using it. Returns the login account. */
async function resetTarget(token: string) {
  const { u: userId, n: nonce } = readToken(token, 'r');
  const { data } = await getSupabaseAdmin().auth.admin.getUserById(String(userId || ''));
  const user = data?.user;
  const stored = user?.app_metadata?.password_reset;
  if (!user || !stored?.hash || stored.hash !== hashNonce(String(nonce || ''))) {
    throw new AuthMailError('This link is invalid or has already been used. Please request a new one.');
  }
  if (typeof stored.exp !== 'number' || Date.now() > stored.exp) {
    throw new AuthMailError('This link has expired. Please request a new one.');
  }
  return user;
}

export async function checkResetCode(token: string) {
  const user = await resetTarget(token);
  return (user.email || '').toLowerCase();
}

/** Uses a reset token: sets the new password on the Supabase account and voids the link. */
export async function applyResetCode(token: string, newPassword: string) {
  const user = await resetTarget(token);
  const { error } = await getSupabaseAdmin().auth.admin.updateUserById(user.id, {
    password: newPassword,
    // Getting the reset email proves they own the address.
    email_confirm: true,
    app_metadata: { password_reset: null },
  });
  if (error) {
    if (/weak|short|password/i.test(error.message || '')) {
      throw new AuthMailError('Please choose a stronger password (at least 8 characters).');
    }
    throw error;
  }
  await ensureCustomerRow(user);
  await markEmailVerified(user);
  return (user.email || '').toLowerCase();
}

/** A message the customer can act on, without leaking internals. */
export function friendlyError(err: unknown) {
  return err instanceof AuthMailError ? err.message : 'Something went wrong. Please try again.';
}
