// SERVER ONLY: import from API routes, never from client components.
//
// Admin console sessions. Admins log in through /api/admin/session, which checks
// the password on the server and sets an httpOnly cookie holding a signed token
// (HMAC with a server-only secret). Every admin data request is checked against
// that cookie, so the browser never needs (or gets) direct access to admin tables.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.AUTH_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const ADMIN_COOKIE = 'polaris_admin_token';
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: string; // 'admin' | 'superadmin'
  role_id: number;
}

function sign(data: string) {
  return createHmac('sha256', SECRET).update(`admin:${data}`).digest('base64url');
}

export function createAdminToken(admin: AdminSession) {
  if (!SECRET) throw new Error('AUTH_TOKEN_SECRET / SUPABASE_SERVICE_ROLE_KEY is not configured on the server.');
  const body = Buffer.from(JSON.stringify({ ...admin, x: Date.now() + TTL_MS })).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function readAdminToken(token: string | undefined | null): AdminSession | null {
  if (!token || !SECRET) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload?.x !== 'number' || Date.now() > payload.x) return null;
    const { x: _x, ...admin } = payload;
    return admin as AdminSession;
  } catch {
    return null;
  }
}

export function getAdminSession(req: NextRequest): AdminSession | null {
  return readAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export function setAdminCookie(res: NextResponse, admin: AdminSession) {
  res.cookies.set(ADMIN_COOKIE, createAdminToken(admin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TTL_MS / 1000,
  });
}

export function clearAdminCookie(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

/** Constant-time string compare (for legacy plaintext admins.password values). */
export function safeEqual(a: string, b: string) {
  const ha = createHmac('sha256', 'cmp').update(a).digest();
  const hb = createHmac('sha256', 'cmp').update(b).digest();
  return timingSafeEqual(ha, hb);
}

// ---------- Admin password hashing (admins.password) ----------
// Stored as "scrypt$N$r$p$<salt b64url>$<hash b64url>". Rows still holding a plaintext
// password are accepted once and re-hashed on that login (see /api/admin/session).
const SCRYPT = { N: 16384, r: 8, p: 1, keyLen: 64 };

export function isHashedPassword(stored: string) {
  return stored.startsWith('scrypt$');
}

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT.keyLen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

/** Checks a password against a stored value (scrypt hash, or legacy plaintext). */
export function verifyAdminPassword(stored: string, password: string) {
  if (!isHashedPassword(stored)) return safeEqual(stored, password);
  const [, n, r, p, saltB64, hashB64] = stored.split('$');
  if (!saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64url');
  try {
    const actual = scryptSync(password, Buffer.from(saltB64, 'base64url'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export const MIN_ADMIN_PASSWORD_LENGTH = 10;
