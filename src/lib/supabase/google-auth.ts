/**
 * Google sign-in / sign-up via Supabase OAuth.
 *
 * A Google user lands back on the site with a Supabase session but, unlike the
 * email signup form, nothing has written their row to public.customers yet.
 * `ensureCustomerProfile` closes that gap: it creates the row (name, referral
 * code, wallet, heard_about) the first time it sees the account, and applies a
 * referral code the visitor entered on /signup before leaving for Google.
 * The `google_oauth_migration.sql` trigger does the same inside the database;
 * this client path covers projects where that migration has not been run.
 */
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './client';
import {
  apiCache,
  applyReferralSignup,
  generateReferralCode,
  getAdminByEmail,
  getCustomer,
  upsertCustomer,
  type CustomerRecord,
} from './services';

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

/**
 * Makes sure the signed-in Supabase user has a public.customers row and returns it.
 * Safe to call from several places at once: concurrent calls share one request.
 */
export function ensureCustomerProfile(authUser?: SupabaseAuthUser | null): Promise<CustomerRecord | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);

  const run = async (user: SupabaseAuthUser | null | undefined) => {
    if (!user?.id || !user.email) return null;
    const existing = inFlight.get(user.id);
    if (existing) return existing;
    const p = createIfMissing(user).finally(() => inFlight.delete(user.id));
    inFlight.set(user.id, p);
    return p;
  };

  if (authUser) return run(authUser);
  return supabase.auth.getUser().then(({ data }) => run(data.user));
}

async function createIfMissing(user: SupabaseAuthUser): Promise<CustomerRecord | null> {
  const email = user.email!.trim().toLowerCase();
  const pending = readPending();

  let customer = await getCustomer(user.id, { forceRefresh: true });

  if (!customer) {
    // Admins sign in through /admin/login; don't give them a customer row by accident.
    try {
      if (await getAdminByEmail(email)) {
        clearPending();
        return null;
      }
    } catch {
      // Admin table missing or unreachable: carry on as a customer.
    }

    const { first, last } = namesFromAuthUser(user);
    const meta = user.user_metadata || {};
    const base: CustomerRecord = {
      id: user.id,
      email,
      first_name: first,
      last_name: last,
      phone: meta.phone || undefined,
      role: 'customer',
      wallet_balance: 0,
      heard_about: pending?.heardAbout || meta.heard_about || undefined,
    };

    // referral_code is unique, so retry with a fresh code if one collides.
    for (let attempt = 0; attempt < 3 && !customer; attempt++) {
      try {
        customer = await upsertCustomer({
          ...base,
          referral_code: attempt === 0 && meta.referral_code ? meta.referral_code : generateReferralCode(first, email),
        });
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (err?.code === '23505' && msg.includes('email')) {
          // A row with this email exists under another id (e.g. created by an admin). Use it as is.
          console.warn('Customer with this email already exists under a different id:', email);
          customer = await getCustomer(email, { forceRefresh: true });
          break;
        }
        if (err?.code !== '23505') {
          console.warn('Could not create customer profile:', err);
          break;
        }
      }
    }
  }

  if (!customer) return null;

  // Brand-new account: apply the referral code typed on /signup, and queue a welcome toast.
  if (customer.id === user.id && isRecent(customer)) {
    let bonus = 0;
    if (pending?.referralCode) {
      try {
        const result = await applyReferralSignup(user.id, pending.referralCode);
        if (result.applied) bonus = Number(result.amount || 0);
      } catch (err) {
        console.warn('Referral code could not be applied after Google signup:', err);
      }
    }
    if (pending?.heardAbout && !customer.heard_about && 'heard_about' in customer) {
      try {
        await supabase.from('customers').update({ heard_about: pending.heardAbout }).eq('id', user.id);
      } catch {
        // The dashboard prompt will ask again.
      }
    }
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
    if (bonus > 0 || pending?.heardAbout) {
      apiCache.invalidate(`customer:${user.id}`);
      customer = (await getCustomer(user.id, { forceRefresh: true })) || customer;
    }
  }

  clearPending();
  return customer;
}
