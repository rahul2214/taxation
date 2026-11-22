/**
 * Google sign-in / sign-up via Supabase OAuth.
 *
 * A Google user lands back on the site with a Supabase session but, unlike the
 * email signup form, nothing has written their row to public.customers yet.
 * `ensureCustomerProfile` closes that gap: it creates the row (name, referral
 * code, wallet, heard_about) the first time it sees the account, and applies a
 * referral code the visitor entered on /signup before leaving for Google.
 * The `google_oauth_migration.sql` trigger does the same inside the database;
 * the server's /api/account "ensure-profile" action covers the rest (and is the
 * only place the referral code is applied, since RLS keeps wallet writes off the browser).
 */
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './client';
import { apiCache, ensureProfileOnServer, getCustomer, type CustomerRecord } from './services';

const PENDING_KEY = 'polaris:pending-oauth-signup';
const WELCOME_KEY = 'polaris:oauth-welcome';
// A row this young counts as a brand-new signup (referral bonus, welcome toast).
const NEW_ACCOUNT_WINDOW_MS = 15 * 60 * 1000;

interface PendingSignup {
  referralCode?: string;
  heardAbout?: string;
  savedAt: number;
}

export interface OAuthWelcome {
  referralCode?: string;
  bonus?: number;
}

function readPending(): PendingSignup | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    // Ignore stale data from an abandoned Google redirect long ago.
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > 60 * 60 * 1000) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // Storage blocked: nothing to clear.
  }
}

/** Redirects to Google. Anything from the signup form is kept until the user returns. */
export async function startGoogleAuth(opts: {
  returnPath: string;
  referralCode?: string;
  heardAbout?: string;
}) {
  try {
    const pending: PendingSignup = { savedAt: Date.now() };
    if (opts.referralCode?.trim()) pending.referralCode = opts.referralCode.trim().toUpperCase();
    if (opts.heardAbout?.trim()) pending.heardAbout = opts.heardAbout.trim();
    if (pending.referralCode || pending.heardAbout) {
      localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    } else {
      localStorage.removeItem(PENDING_KEY);
    }
  } catch {
    // Storage blocked: sign-in still works, the referral just isn't carried over.
  }

  // If Google is switched off in Supabase, the redirect lands on a raw JSON error page.
  // Ask the auth server first so the user gets a readable message instead.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
      if (res.ok) {
        const settings = await res.json();
        if (settings?.external && settings.external.google === false) {
          throw new Error('Google sign-in is not available right now. Please use your email and password, or try again later.');
        }
      }
    }
  } catch (err: any) {
    if (err?.message?.startsWith('Google sign-in is not available')) throw err;
    // Settings endpoint unreachable: try the redirect anyway.
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${opts.returnPath}`,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
}

/** First/last name from Google's profile metadata (or what the email form stored). */
export function namesFromAuthUser(user: Pick<SupabaseAuthUser, 'email' | 'user_metadata'>) {
  const meta = user.user_metadata || {};
  if (meta.first_name) {
    return { first: String(meta.first_name), last: String(meta.last_name || '') };
  }
  const given = meta.given_name || meta.custom_claims?.given_name;
  const family = meta.family_name || meta.custom_claims?.family_name;
  if (given) return { first: String(given), last: String(family || '') };

  const full = String(meta.full_name || meta.name || '').trim();
  if (full) {
    const [first, ...rest] = full.split(/\s+/);
    return { first, last: rest.join(' ') };
  }
  return { first: user.email?.split('@')[0] || '', last: '' };
}

export function displayNameFromAuthUser(user: Pick<SupabaseAuthUser, 'email' | 'user_metadata'>) {
  const { first, last } = namesFromAuthUser(user);
  return `${first} ${last}`.trim() || user.email?.split('@')[0] || null;
}

function isRecent(customer: CustomerRecord) {
  const stamp = customer.created_at || customer.signup_date;
  if (!stamp) return false;
  return Date.now() - new Date(stamp).getTime() < NEW_ACCOUNT_WINDOW_MS;
}

function setWelcome(welcome: OAuthWelcome) {
  try {
    sessionStorage.setItem(WELCOME_KEY, JSON.stringify(welcome));
  } catch {
    // Storage blocked: the welcome toast is optional.
  }
}

/** Returns (once) the welcome info for a Google account created in this browser session. */
export function takeOAuthWelcome(): OAuthWelcome | null {
  try {
    const raw = sessionStorage.getItem(WELCOME_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(WELCOME_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const inFlight = new Map<string, Promise<CustomerRecord | null>>();
const confirmed = new Set<string>();

/**
 * Makes sure the signed-in Supabase user has a public.customers row and returns it.
 * Safe to call from several places at once: concurrent calls share one request.
 */
export function ensureCustomerProfile(authUser?: SupabaseAuthUser | null): Promise<CustomerRecord | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);

  const run = async (user: SupabaseAuthUser | null | undefined) => {
    if (!user?.id || !user.email) return null;
    // Already confirmed this session: use the cached row instead of re-querying on every auth event.
    if (confirmed.has(user.id)) return getCustomer(user.id);
    const existing = inFlight.get(user.id);
    if (existing) return existing;
    const p = createIfMissing(user).finally(() => inFlight.delete(user.id));
    inFlight.set(user.id, p);
    return p;
  };

  if (authUser) return run(authUser);
  // getSession reads the local session (no network round trip, unlike getUser).
  return supabase.auth.getSession().then(({ data }) => run(data.session?.user));
}

async function createIfMissing(user: SupabaseAuthUser): Promise<CustomerRecord | null> {
  const pending = readPending();

  let customer = await getCustomer(user.id, { forceRefresh: true });
  let bonus = 0;

  // The row, referral bonus and heard_about are written by the server (service role):
  // the browser can't create customer rows or move wallet money under RLS.
  const needsServer = !customer || (isRecent(customer) && (pending?.referralCode || (pending?.heardAbout && !customer.heard_about)));
  if (needsServer) {
    try {
      const result = await ensureProfileOnServer({
        referralCode: pending?.referralCode,
        heardAbout: pending?.heardAbout || user.user_metadata?.heard_about,
      });
      if (result.isAdmin) {
        // Admins sign in through /admin/login; they don't get a customer row.
        clearPending();
        return null;
      }
      bonus = Number(result.bonus || 0);
      if (result.customer) {
        customer = result.customer;
        apiCache.set(`customer:${user.id}`, customer, 120_000);
      }
    } catch (err) {
      console.warn('Could not set up customer profile:', err);
    }
  }

  if (!customer) return null;

  if (customer.id === user.id && isRecent(customer)) {
    // Email signups get their welcome dialog on /signup; only greet Google signups here, once.
    const greetedKey = `polaris:greeted:${user.id}`;
    let greeted = false;
    try {
      greeted = Boolean(localStorage.getItem(greetedKey));
      localStorage.setItem(greetedKey, '1');
    } catch {
      // Storage blocked: greet anyway.
    }
    if (user.app_metadata?.provider === 'google' && !greeted) {
      setWelcome({ referralCode: customer.referral_code, bonus });
    }
  }

  clearPending();
  confirmed.add(user.id);
  return customer;
}
