import { supabase, isSupabaseConfigured } from './client';
import { apiCache, CacheOptions } from '../cache/api-cache';
import { adminApi, isAdminContext } from '../admin/api';

export { apiCache, type CacheOptions };

// Access model (see supabase/rls_hardening_migration.sql):
// - Browser + customer session: own rows only (RLS), plus public inserts (appointments,
//   contacts, feedback) and public reads (plans, site settings, roles, master data).
// - Admin pages (/admin/*): no Supabase session; their reads/writes go through
//   /api/admin/data (adminApi), checked against the admin session cookie.
// - Anything touching other customers' rows or money (signup profile, referral codes,
//   referral lists) goes through server routes using the service role.

/** POST to /api/account with the signed-in customer's access token. */
async function accountApi<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in.');
  const res = await fetch('/api/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || 'Request failed');
  return body as T;
}

/** Calls the customer's own profile setup on the server (row, referral code, heard_about). */
export async function ensureProfileOnServer(opts: { referralCode?: string; heardAbout?: string } = {}) {
  return accountApi<{ customer: CustomerRecord | null; isAdmin: boolean; bonus: number }>('ensure-profile', opts);
}

export interface RoleRecord {
  id: number; // BIGINT identity (1: admin, 2: customer, 3: superadmin)
  name: string;
  description?: string;
  created_at?: string;
}

export interface CustomerRecord {
  id: string; // Supabase Auth UUID
  userid?: number; // int8 (BIGINT) sequential identity for primary/foreign key relations
  role_id?: number; // int8 (BIGINT) foreign key to roles(id)
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  role?: string;
  referral_code?: string;
  wallet_balance?: number;
  locked_wallet_balance?: number; // Referral bonus held until the referred user pays for a plan
  referred_by?: string | number | null; // Stores referrer's int8 userid value
  heard_about?: string | null; // "How did you hear about us?" answer from signup
  signup_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaxDocumentRecord {
  id?: string;
  customer_id: string; // UUID foreign key to customers(id)
  customer_userid?: number | null; // int8 foreign key to customers(userid)
  document_name: string;
  file_url: string;
  document_type: string;
  tax_year?: number;
  category: string;
  uploader: 'customer' | 'admin';
  status?: string;
  upload_date?: string;
}

export interface AppointmentRecord {
  id?: string;
  customer_id?: string | null; // UUID foreign key to customers(id)
  customer_userid?: number | null; // int8 foreign key to customers(userid)
  name?: string;
  email: string;
  phone?: string;
  service?: string;
  service_id?: number | null; // FK to master_data(id), category 'appointment_service'
  time_slot?: string | null;
  time_slot_id?: number | null; // FK to master_data(id), category 'appointment_time'
  appointment_date: string;
  status?: string;
  notes?: string;
}

export type ContactStatus = 'new' | 'read' | 'replied' | 'archived';

export interface ContactRecord {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  topic_id?: number | null; // FK to master_data(id), category 'contact_topic'
  message: string;
  status?: ContactStatus;
  created_at?: string;
}

export interface ReferralRecord {
  id?: string;
  referrer_id?: string | null; // UUID foreign key to customers(id)
  referrer_userid?: number | null; // int8 foreign key to customers(userid)
  referrer_name?: string;
  referrer_email?: string;
  referred_id?: string | null; // UUID foreign key to customers(id)
  referred_userid?: number | null; // int8 foreign key to customers(userid)
  referred_email: string;
  referred_name?: string;
  referral_code?: string;
  reward_amount?: number;
  status?: string; // 'Locked' | 'Unlocked' | 'Cancelled' | 'Rewarded' (legacy, before locking existed)
  reward_id?: string | null; // referral_rewards.id when tracked
  unlocked_at?: string | null;
  referral_date?: string;
  created_at?: string;
}

export interface ReferralRewardRecord {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code?: string | null;
  referrer_amount: number;
  referred_amount: number;
  status: 'locked' | 'unlocked' | 'cancelled';
  unlocked_at?: string | null;
  unlocked_by_purchase_id?: string | null;
  created_at?: string;
}

export type PlanBillingPeriod = 'one_time' | 'monthly' | 'yearly';

export interface PlanRecord {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  billing_period: PlanBillingPeriod;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type PlanPurchaseStatus = 'pending' | 'paid' | 'cancelled';

export interface PlanPurchaseRecord {
  id: string;
  customer_id: string;
  customer_userid?: number | null;
  plan_id?: string | null;
  plan_name: string;
  plan_price: number;
  wallet_applied: number;
  amount_due: number;
  status: PlanPurchaseStatus;
  payment_method?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WalletTransactionRecord {
  id?: string;
  customer_id: string; // UUID foreign key to customers(id)
  customer_userid?: number | null; // int8 foreign key to customers(userid)
  amount: number;
  type: 'referral_bonus' | 'referral_bonus_locked' | 'welcome_bonus' | 'service_discount' | 'manual_adjustment';
  description: string;
  reference_id?: string;
  created_at?: string;
}

export interface SiteSettingsRecord {
  id?: string;
  current_year_form_url?: string | null;
  prior_year_form_url?: string | null;
  referral_reward_amount?: number | null;
  updated_at?: string;
}

export interface AdminRecord {
  id?: string;
  role_id?: number; // int8 (BIGINT) foreign key to roles(id)
  email: string;
  password?: string;
  name?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

// -------------------------------------------------------------
// Customers Service
// -------------------------------------------------------------

export function generateReferralCode(firstName?: string, email?: string): string {
  const cleanName = (firstName || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  const cleanEmail = (email || '').split('@')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = cleanName.slice(0, 5) || cleanEmail.slice(0, 5) || 'POLARIS';
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomSuffix}`;
}

/**
 * Saves the signed-in customer's own profile fields. Only first/last name, phone,
 * address and heard_about can be changed from the browser (RLS + column grants);
 * other fields (email, role, wallet, referral code, email_verified) are ignored.
 * The row itself is created on the server (signup route / ensureProfileOnServer).
 */
export async function upsertCustomer(customer: CustomerRecord) {
  if (!isSupabaseConfigured) return null;

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ['first_name', 'last_name', 'phone', 'address', 'heard_about'] as const) {
    if (customer[key] !== undefined) payload[key] = customer[key];
  }

  const { data, error } = await supabase
    .from('customers')
    .update(payload)
    .eq('id', customer.id)
    .select()
    .maybeSingle();
  if (error) throw error;

  apiCache.invalidate('customers:all');
  if (data) {
    apiCache.set(`customer:${customer.id}`, data, 120_000);
    if (data.userid) apiCache.set(`customer:${data.userid}`, data, 120_000);
  }
  return data;
}

export async function ensureCustomerReferralCode(
  customerId: string,
  firstName?: string,
  email?: string
): Promise<string> {
  if (!isSupabaseConfigured || !customerId) return '';

  try {
    const existing = await getCustomer(customerId);
    if (existing?.referral_code) {
      return existing.referral_code;
    }
    // The referral code is unique and not writable from the browser: the server sets it.
    const { code } = await accountApi<{ code: string }>('ensure-referral-code');
    apiCache.invalidate(`customer:${customerId}`);
    return code;
  } catch (e) {
    console.warn('ensureCustomerReferralCode fallback:', e);
    return generateReferralCode(firstName, email);
  }
}

export async function getCustomer(
  idOrUseridOrEmail: string | number,
  options?: CacheOptions
): Promise<CustomerRecord | null> {
  if (!isSupabaseConfigured || !idOrUseridOrEmail) return null;
  const cacheKey = `customer:${idOrUseridOrEmail}`;

  return apiCache.getOrFetch(
    cacheKey,
    async () => {
      try {
        if (isAdminContext()) {
          return await adminApi<CustomerRecord | null>('getCustomer', { id: idOrUseridOrEmail });
        }
        const val = String(idOrUseridOrEmail).trim();
        const isNumeric =
          typeof idOrUseridOrEmail === 'number' ||
          (!isNaN(Number(val)) && !val.includes('-'));

        let query = supabase.from('customers').select('*');
        if (isNumeric) {
          query = query.eq('userid', Number(val));
        } else if (val.includes('@')) {
          query = query.ilike('email', val);
        } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
          query = query.eq('id', val);
        } else {
          query = query.eq('id', val);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          if (error.code === 'PGRST116' || error.code === '22P02') return null; // Not found or invalid UUID syntax
          console.warn("getCustomer notice:", error.message || error.code || error);
          return null;
        }

        // Cross-populate both id, userid, and email caches
        if (data) {
          if (data.id && String(data.id) !== val) {
            apiCache.set(`customer:${data.id}`, data, 120_000);
          }
          if (data.userid && String(data.userid) !== val) {
            apiCache.set(`customer:${data.userid}`, data, 120_000);
          }
          if (data.email && data.email.toLowerCase() !== val.toLowerCase()) {
            apiCache.set(`customer:${data.email.toLowerCase()}`, data, 120_000);
          }
        }

        return data;
      } catch (err: any) {
        console.warn("getCustomer exception:", err?.message || err);
        return null;
      }
    },
    { ttlMs: 120_000, ...options } // 2 minutes TTL with deduplication
  );
}

export async function getCustomerByUserid(
  userid: number,
  options?: CacheOptions
): Promise<CustomerRecord | null> {
  return getCustomer(userid, options);
}

export async function getAllCustomers(options?: CacheOptions): Promise<CustomerRecord[]> {
  if (!isSupabaseConfigured) return [];

  return apiCache.getOrFetch(
    'customers:all',
    async () => (await adminApi<CustomerRecord[]>('getAllCustomers')) || [],
    { ttlMs: 45_000, ...options } // 45 seconds TTL
  );
}

// -------------------------------------------------------------
// Tax Documents Service
// -------------------------------------------------------------
export async function getTaxDocuments(
  customerId?: string,
  options?: CacheOptions
): Promise<TaxDocumentRecord[]> {
  if (!isSupabaseConfigured) return [];
  const cacheKey = `tax_docs:${customerId || 'all'}`;

  return apiCache.getOrFetch(
    cacheKey,
    async () => {
      try {
        if (isAdminContext()) {
          return (await adminApi<TaxDocumentRecord[]>('getTaxDocuments', { customerId })) || [];
        }
        let query = supabase.from('tax_documents').select('*');
        if (customerId) {
          const val = String(customerId).trim();
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
            query = query.eq('customer_id', val);
          } else if (/^\d+$/.test(val)) {
            query = query.eq('customer_userid', Number(val));
          }
        }
        const { data, error } = await query.order('upload_date', { ascending: false });
        if (error) {
          console.warn("getTaxDocuments notice:", error.message || error.code || error);
          return [];
        }
        return data || [];
      } catch (err: any) {
        console.warn("getTaxDocuments exception:", err?.message || err);
        return [];
      }
    },
    { ttlMs: 30_000, ...options }
  );
}

export async function createTaxDocument(doc: TaxDocumentRecord) {
  if (!isSupabaseConfigured) return null;
  if (isAdminContext()) {
    const created = await adminApi<TaxDocumentRecord>('createTaxDocument', { doc });
    apiCache.invalidate('tax_docs');
    return created;
  }
  if (doc.customer_userid == null && doc.customer_id) {
    // Keep the int8 customer_userid relation filled in alongside the UUID.
    const owner = await getCustomer(doc.customer_id);
    if (owner?.userid != null) doc = { ...doc, customer_userid: owner.userid };
  }
  const { data, error } = await supabase
    .from('tax_documents')
    .insert([doc])
    .select()
    .single();

  if (error) throw error;
  if (data?.id && ['Tax Estimation', 'Tax Return Draft', 'Final Document'].includes(data.category)) {
    // One per tax year: the server deletes the customer's previous upload in this category (row and file).
    await accountApi('remove-superseded-documents', { id: data.id }).catch((err) =>
      console.warn('Could not remove the previous document:', err?.message || err)
    );
  }
  apiCache.invalidate('tax_docs');
  return data;
}

/** Saves the "How did you hear about us?" answer for an existing customer. */
export async function updateCustomerHeardAbout(id: string, heardAbout: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('customers')
    .update({ heard_about: heardAbout, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  apiCache.invalidate('customers:all');
  apiCache.set(`customer:${id}`, data, 120_000);
  if (data?.userid) apiCache.set(`customer:${data.userid}`, data, 120_000);
  return data;
}

export async function updateTaxDocumentStatus(id: string, status: string) {
  if (!isSupabaseConfigured) return null;
  const data = await adminApi<TaxDocumentRecord>('updateTaxDocumentStatus', { id, status });
  apiCache.invalidate('tax_docs');
  return data;
}

/** Deletes a document and its file in Cloudflare R2 (done together on the server). */
export async function deleteTaxDocument(id: string) {
  if (!isSupabaseConfigured) return null;
  const result = isAdminContext()
    ? await adminApi('deleteTaxDocument', { id })
    : await accountApi('delete-document', { id });
  apiCache.invalidate('tax_docs');
  return result;
}

/**
 * Points a document at a newly uploaded file; the server deletes the old file from R2
 * and sets the status back to Pending.
 */
export async function replaceTaxDocumentFile(id: string, fileUrl: string, documentName?: string) {
  if (!isSupabaseConfigured) return null;
  const result = isAdminContext()
    ? await adminApi<TaxDocumentRecord>('replaceTaxDocumentFile', { id, fileUrl, documentName })
    : (await accountApi<{ document: TaxDocumentRecord }>('replace-document-file', { id, fileUrl, documentName })).document;
  apiCache.invalidate('tax_docs');
  return result;
}

// -------------------------------------------------------------
// Appointments Service
// -------------------------------------------------------------
export async function getAppointments(
  customerIdOrEmail?: string,
  options?: CacheOptions
): Promise<AppointmentRecord[]> {
  if (!isSupabaseConfigured) return [];
  const cacheKey = `appointments:${customerIdOrEmail || 'all'}`;

  return apiCache.getOrFetch(
    cacheKey,
    async () => {
      try {
        if (isAdminContext()) {
          return (await adminApi<AppointmentRecord[]>('getAppointments', { identifier: customerIdOrEmail })) || [];
        }
        let query = supabase.from('appointments').select('*');
        if (customerIdOrEmail) {
          const identifier = String(customerIdOrEmail).trim();
          if (identifier.includes('@')) {
            query = query.ilike('email', identifier);
          } else if (/^\d+$/.test(identifier)) {
            query = query.eq('customer_userid', Number(identifier));
          } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)) {
            query = query.eq('customer_id', identifier);
          } else {
            query = query.or(`email.ilike.%${identifier}%,name.ilike.%${identifier}%`);
          }
        }
        const { data, error } = await query.order('appointment_date', { ascending: true });
        if (error) {
          console.warn("getAppointments notice:", error.message || error.code || error);
          return [];
        }
        return data || [];
      } catch (err: any) {
        console.warn("getAppointments exception:", err?.message || err);
        return [];
      }
    },
    { ttlMs: 30_000, ...options }
  );
}

/**
 * Inserts a row, tolerating a live DB that is behind the migrations: optional columns
 * the table doesn't have yet are dropped, and optional link ids that fail a foreign key
 * or UUID check are nulled, so a form submission is never lost.
 *
 * The row's id is made here and the insert asks for nothing back: visitors may
 * insert into these tables but (under RLS) not read them, so `.select()` would fail.
 */
async function insertWithOptionalColumns<T>(
  table: string,
  row: Record<string, any>,
  optionalColumns: string[],
  linkIdColumns: string[]
): Promise<T> {
  const payload: Record<string, any> = { id: row.id || crypto.randomUUID(), ...row };

  for (let attempt = 0; attempt <= optionalColumns.length + 1; attempt++) {
    const { error } = await supabase.from(table).insert([payload]);
    if (!error) return { ...payload } as T;

    // Column missing from table / PostgREST schema cache (PGRST204, 42703)
    if (error.code === 'PGRST204' || error.code === '42703') {
      const missing = error.message?.match(/'([a-z_]+)' column|column (?:[a-z_]+\.)?([a-z_]+) does not exist/i);
      const col = missing?.[1] || missing?.[2];
      if (col && col in payload && optionalColumns.includes(col)) {
        delete payload[col];
        continue;
      }
    }

    // Foreign key violation (23503), invalid UUID (22P02), or a link to an account that
    // isn't this session's (RLS, 42501, e.g. an expired login): save it as a guest row instead
    if ((error.code === '23503' || error.code === '22P02' || error.code === '42501') && linkIdColumns.some((c) => payload[c] != null)) {
      for (const c of linkIdColumns) if (c in payload) payload[c] = null;
      continue;
    }

    console.error(`insert into ${table} failed:`, error.code, error.message, error.details ?? '');
    throw new Error(error.message || `Failed to save to ${table}`);
  }

  throw new Error(`Failed to save to ${table}`);
}

export async function createAppointment(appointment: AppointmentRecord) {
  if (!isSupabaseConfigured) return null;
  const linkIds = ['customer_id', 'customer_userid', 'service_id', 'time_slot_id'];
  const data = await insertWithOptionalColumns<AppointmentRecord>(
    'appointments',
    appointment,
    [...linkIds, 'time_slot'],
    linkIds
  );
  apiCache.invalidate('appointments');
  return data;
}

export async function updateAppointmentStatus(id: string, status: string) {
  if (!isSupabaseConfigured) return null;
  const data = await adminApi<AppointmentRecord>('updateAppointmentStatus', { id, status });
  apiCache.invalidate('appointments');
  return data;
}

// -------------------------------------------------------------
// Contacts Service (messages from the public /contact page)
// -------------------------------------------------------------
export async function createContact(contact: ContactRecord): Promise<ContactRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured');
  const data = await insertWithOptionalColumns<ContactRecord>(
    'contacts',
    { ...contact, status: contact.status || 'new' },
    ['topic_id'],
    ['topic_id']
  );
  apiCache.invalidate('contacts');
  return data;
}

export async function getContacts(options?: CacheOptions): Promise<ContactRecord[]> {
  if (!isSupabaseConfigured) return [];
  return apiCache.getOrFetch(
    'contacts:all',
    async () => (await adminApi<ContactRecord[]>('getContacts')) || [],
    { ttlMs: 30_000, ...options }
  );
}

// -------------------------------------------------------------
// Feedback Service (website widget, client portal, mobile app)
// -------------------------------------------------------------
export type FeedbackStatus = 'new' | 'reviewed' | 'resolved' | 'archived';
export type FeedbackSource = 'website' | 'client_portal' | 'mobile_app';

export interface FeedbackRecord {
  id?: string;
  customer_id?: string | null;
  name?: string | null;
  email?: string | null;
  rating?: number | null; // 1-5
  category?: string | null;
  message: string;
  source?: FeedbackSource | string;
  platform?: string | null; // 'web', 'ios', 'android'
  device?: string | null; // 'desktop', 'mobile', 'tablet'
  page?: string | null;
  app_version?: string | null;
  user_agent?: string | null;
  status?: FeedbackStatus;
  created_at?: string;
}

const FEEDBACK_OPTIONAL_COLUMNS = ['customer_id', 'platform', 'device', 'page', 'app_version', 'user_agent', 'category'];

export async function createFeedback(feedback: FeedbackRecord): Promise<FeedbackRecord> {
  if (!isSupabaseConfigured) throw new Error('Database is not configured');
  const data = await insertWithOptionalColumns<FeedbackRecord>(
    'feedback',
    { ...feedback, source: feedback.source || 'website', status: feedback.status || 'new' },
    FEEDBACK_OPTIONAL_COLUMNS,
    ['customer_id']
  );
  apiCache.invalidate('feedback');
  return data;
}

export async function getFeedback(options?: CacheOptions): Promise<FeedbackRecord[]> {
  if (!isSupabaseConfigured) return [];
  return apiCache.getOrFetch(
    'feedback:all',
    async () => (await adminApi<FeedbackRecord[]>('getFeedback')) || [],
    { ttlMs: 30_000, ...options }
  );
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  if (!isSupabaseConfigured) return null;
  const data = await adminApi<FeedbackRecord>('updateFeedbackStatus', { id, status });
  apiCache.invalidate('feedback');
  return data;
}

export async function updateContactStatus(id: string, status: ContactStatus) {
  if (!isSupabaseConfigured) return null;
  const data = await adminApi<ContactRecord>('updateContactStatus', { id, status });
  apiCache.invalidate('contacts');
  return data;
}

// -------------------------------------------------------------
// Referrals Service (Derived from customers table & wallet ledger)
// -------------------------------------------------------------
export async function getReferrals(
  referrerId?: string,
  options?: CacheOptions
): Promise<ReferralRecord[]> {
  if (!isSupabaseConfigured) return [];
  const cacheKey = `referrals:${referrerId || 'all'}`;

  return apiCache.getOrFetch(
    cacheKey,
    async () => {
      try {
        // Needs other customers' rows (the referred friends), so it is built on the server.
        if (isAdminContext()) {
          return (await adminApi<ReferralRecord[]>('getReferrals', { referrerId })) || [];
        }
        if (!referrerId) return [];
        const { referrals } = await accountApi<{ referrals: ReferralRecord[] }>('referrals');
        return referrals || [];
      } catch (err) {
        console.warn("getReferrals notice:", err);
        return [];
      }
    },
    { ttlMs: 30_000, ...options }
  );
}

export async function createReferral(_referral: ReferralRecord) {
  // Referrals operate exclusively via customers.referral_code and customers.referred_by
  return null;
}

export async function updateReferralStatus(_id: string, _status: string) {
  return null;
}

// -------------------------------------------------------------
// Wallet & Referral Rewards Service
// -------------------------------------------------------------

export async function getWalletBalance(
  customerId: string,
  options?: CacheOptions
): Promise<number> {
  if (!isSupabaseConfigured || !customerId) return 0;
  const cacheKey = `wallet_balance:${customerId}`;

  return apiCache.getOrFetch(
    cacheKey,
    async () => {
      try {
        const cust = await getCustomer(customerId, options);
        return Number(cust?.wallet_balance || 0);
      } catch (err) {
        console.warn("getWalletBalance error:", err);
        return 0;
      }
    },
    { ttlMs: 30_000, ...options }
  );
}

export async function getWalletTransactions(
  customerId: string,
  options?: CacheOptions
): Promise<WalletTransactionRecord[]> {
  if (!isSupabaseConfigured || !customerId) return [];
  const cacheKey = `wallet_txs:${customerId}`;

  return apiCache.getOrFetch(
    cacheKey,
    async () => {
      try {
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });

        if (error) {
          if (error.code === '42P01') return [];
          throw error;
        }
        return data || [];
      } catch (e) {
        console.warn("getWalletTransactions notice:", e);
        return [];
      }
    },
    { ttlMs: 30_000, ...options }
  );
}

export async function getReferralRewardAmount(options?: CacheOptions): Promise<number> {
  if (!isSupabaseConfigured) return 25.0;
  return apiCache.getOrFetch(
    'referral_reward_amount',
    async () => {
      try {
        const settings = await getSiteSettings(options);
        if (settings?.referral_reward_amount != null) {
          const val = Number(settings.referral_reward_amount);
          if (!isNaN(val) && val >= 0) {
            return val;
          }
        }
      } catch (err) {
        console.warn("getReferralRewardAmount fallback to 25.0:", err);
      }
      return 25.0;
    },
    { ttlMs: 300_000, ...options } // 5 minutes TTL
  );
}

function invalidateCustomerMoneyCaches(customerId?: string | null) {
  if (customerId) {
    apiCache.invalidate(`wallet_balance:${customerId}`);
    apiCache.invalidate(`wallet_txs:${customerId}`);
  }
  // Balances of other customers (e.g. the referrer) can change too, so drop all customer entries
  apiCache.invalidate('customer');
  apiCache.invalidate('referrals');
  apiCache.invalidate('plan_purchases');
}

/**
 * Referral codes are applied on the server only (signup route for email accounts,
 * /api/account ensure-profile for Google accounts): see src/lib/server/referrals.ts.
 */

/** Admin override for a locked referral reward: release it now, or cancel it. */
export async function setReferralRewardStatus(rewardId: string, status: 'unlocked' | 'cancelled') {
  if (!isSupabaseConfigured) return null;
  const data = await adminApi<ReferralRewardRecord>('setReferralRewardStatus', { rewardId, status });
  invalidateCustomerMoneyCaches((data as ReferralRewardRecord | null)?.referrer_id);
  return data as ReferralRewardRecord;
}

// -------------------------------------------------------------
// Plans Service (admin-managed pricing)
// -------------------------------------------------------------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres (42P01) or PostgREST (PGRST205) "table doesn't exist yet". */
const isMissingTableError = (code?: string) => code === '42P01' || code === 'PGRST205';

function normalizePlan(row: any): PlanRecord {
  return {
    ...row,
    price: Number(row.price || 0),
    features: Array.isArray(row.features) ? row.features.map(String) : [],
    is_active: Boolean(row.is_active),
    is_popular: Boolean(row.is_popular),
    sort_order: Number(row.sort_order || 0),
  };
}

export async function getPlans(
  { includeInactive = false }: { includeInactive?: boolean } = {},
  options?: CacheOptions
): Promise<PlanRecord[]> {
  if (!isSupabaseConfigured) return [];
  return apiCache.getOrFetch(
    `plans:${includeInactive ? 'all' : 'active'}`,
    async () => {
      // Inactive plans are only visible to admins (RLS shows visitors active plans only).
      if (includeInactive) {
        return ((await adminApi<any[]>('getPlans', { includeInactive: true })) || []).map(normalizePlan);
      }
      const query = supabase.from('plans').select('*').eq('is_active', true);
      const { data, error } = await query
        .order('sort_order', { ascending: true })
        .order('price', { ascending: true });
      if (error) {
        if (isMissingTableError(error.code)) return [];
        throw new Error(error.message);
      }
      return (data || []).map(normalizePlan);
    },
    { ttlMs: 60_000, ...options }
  );
}

export async function savePlan(plan: PlanRecord): Promise<PlanRecord | null> {
  if (!isSupabaseConfigured) return null;
  const payload: any = {
    name: plan.name.trim(),
    description: plan.description?.trim() || null,
    price: Number(plan.price),
    billing_period: plan.billing_period,
    features: plan.features.map(f => f.trim()).filter(Boolean),
    is_active: plan.is_active,
    is_popular: plan.is_popular,
    sort_order: Number(plan.sort_order) || 0,
    updated_at: new Date().toISOString(),
  };
  const data = await adminApi<any>('savePlan', { plan: { ...payload, id: plan.id } });
  apiCache.invalidate('plans');
  return normalizePlan(data);
}

export async function deletePlan(id: string) {
  if (!isSupabaseConfigured) return null;
  await adminApi('deletePlan', { id });
  apiCache.invalidate('plans');
  return true;
}

// -------------------------------------------------------------
// Plan Purchases Service
// -------------------------------------------------------------
function normalizePurchase(row: any): PlanPurchaseRecord {
  return {
    ...row,
    plan_price: Number(row.plan_price || 0),
    wallet_applied: Number(row.wallet_applied || 0),
    amount_due: Number(row.amount_due || 0),
  };
}

export async function getPlanPurchases(
  customerId?: string,
  options?: CacheOptions
): Promise<PlanPurchaseRecord[]> {
  if (!isSupabaseConfigured) return [];
  return apiCache.getOrFetch(
    `plan_purchases:${customerId || 'all'}`,
    async () => {
      if (isAdminContext()) {
        return ((await adminApi<any[]>('getPlanPurchases', { customerId })) || []).map(normalizePurchase);
      }
      let query = supabase.from('plan_purchases').select('*');
      if (customerId) {
        // customer_id is a UUID; a non-UUID id (e.g. an admin-table session) can't own any orders
        if (!UUID_RE.test(String(customerId))) return [];
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        if (isMissingTableError(error.code)) return [];
        throw new Error(error.message);
      }
      return (data || []).map(normalizePurchase);
    },
    { ttlMs: 30_000, ...options }
  );
}

/** Customer orders a plan. Usable wallet credit is applied first when useWallet is true. */
export async function createPlanPurchase(customerId: string, planId: string, useWallet: boolean) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('create_plan_purchase', {
    p_customer_id: customerId,
    p_plan_id: planId,
    p_use_wallet: useWallet,
  });
  if (error) throw error;
  invalidateCustomerMoneyCaches(customerId);
  return normalizePurchase(data);
}

/** Admin confirms payment. This unlocks the referrer's locked bonus, if any. */
export async function markPlanPurchasePaid(purchaseId: string, paymentMethod?: string, paymentReference?: string) {
  if (!isSupabaseConfigured) return null;
  const data = await adminApi<any>('markPlanPurchasePaid', { purchaseId, paymentMethod, paymentReference });
  invalidateCustomerMoneyCaches((data as any)?.customer_id);
  apiCache.invalidate('wallet_balance');
  apiCache.invalidate('wallet_txs');
  return normalizePurchase(data);
}

/** Cancels a pending purchase and refunds any wallet credit that was applied. */
export async function cancelPlanPurchase(purchaseId: string) {
  if (!isSupabaseConfigured) return null;
  let data: any;
  if (isAdminContext()) {
    data = await adminApi<any>('cancelPlanPurchase', { purchaseId });
  } else {
    // Through the server, which first checks PayPal so a paid order is never cancelled.
    data = (await accountApi<{ purchase: any }>('cancel-purchase', { purchaseId })).purchase;
  }
  invalidateCustomerMoneyCaches((data as any)?.customer_id);
  return normalizePurchase(data);
}

// -------------------------------------------------------------
// Basic Information Documents (shared with every client)
// -------------------------------------------------------------
export interface BasicInfoDocumentRecord {
  id: string;
  title: string;
  description?: string | null;
  file_url: string;
  file_name?: string | null;
  file_size?: number | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Admins get every document; clients get the active ones (row-level security). */
export async function getBasicInfoDocuments(options?: CacheOptions): Promise<BasicInfoDocumentRecord[]> {
  if (!isSupabaseConfigured) return [];
  const admin = isAdminContext();
  return apiCache.getOrFetch(
    `basic_info:${admin ? 'all' : 'active'}`,
    async () => {
      if (admin) return (await adminApi<BasicInfoDocumentRecord[]>('getBasicInfoDocuments')) || [];
      const { data, error } = await supabase
        .from('basic_info_documents')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('getBasicInfoDocuments notice:', error.message || error.code || error);
        return [];
      }
      return data || [];
    },
    { ttlMs: 60_000, ...options }
  );
}

export async function createBasicInfoDocument(doc: {
  title: string;
  description?: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  is_active?: boolean;
}) {
  const data = await adminApi<BasicInfoDocumentRecord>('createBasicInfoDocument', { doc });
  apiCache.invalidate('basic_info');
  return data;
}

/** Pass file_url (with file_name/file_size) to replace the file; the old file is deleted from storage. */
export async function updateBasicInfoDocument(
  id: string,
  changes: Partial<Pick<BasicInfoDocumentRecord, 'title' | 'description' | 'is_active' | 'sort_order' | 'file_url' | 'file_name' | 'file_size'>>
) {
  const data = await adminApi<BasicInfoDocumentRecord>('updateBasicInfoDocument', { id, changes });
  apiCache.invalidate('basic_info');
  return data;
}

/** Deletes the document and its file in storage. */
export async function deleteBasicInfoDocument(id: string) {
  const data = await adminApi('deleteBasicInfoDocument', { id });
  apiCache.invalidate('basic_info');
  return data;
}

// -------------------------------------------------------------
// Site Settings Service
// -------------------------------------------------------------
export async function getSiteSettings(options?: CacheOptions): Promise<SiteSettingsRecord | null> {
  if (!isSupabaseConfigured) return null;
  return apiCache.getOrFetch(
    'site_settings:global',
    async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 'global')
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST116' || error.code === '42P01') return null;
          throw error;
        }
        return data;
      } catch (err) {
        console.warn("getSiteSettings notice:", err);
        return null;
      }
    },
    { ttlMs: 300_000, ...options } // 5 minutes TTL
  );
}

export async function updateSiteSettings(settings: Partial<SiteSettingsRecord>) {
  if (!isSupabaseConfigured) return null;
  const data = await adminApi<SiteSettingsRecord>('updateSiteSettings', { settings });
  apiCache.invalidate('site_settings');
  apiCache.invalidate('referral_reward_amount');
  return data;
}

// -------------------------------------------------------------
// Admins Service
// -------------------------------------------------------------
// Admin sign-in and the admin check happen on the server: see /api/admin/session and
// src/lib/admin/api.ts (adminLogin, getAdminSession). The admins table is not
// readable from the browser.

export async function getAllAdmins(options?: CacheOptions): Promise<AdminRecord[]> {
  if (!isSupabaseConfigured) return [];

  return apiCache.getOrFetch(
    'admins:all',
    async () => (await adminApi<AdminRecord[]>('getAllAdmins')) || [],
    { ttlMs: 60_000, ...options }
  );
}

export async function createOrUpdateAdmin(admin: AdminRecord) {
  if (!isSupabaseConfigured) return null;
  const data = await adminApi<AdminRecord>('createOrUpdateAdmin', { admin });
  apiCache.invalidate('admins:all');
  return data;
}

export async function deleteAdmin(id: string) {
  if (!isSupabaseConfigured) return null;
  await adminApi('deleteAdmin', { id });
  apiCache.invalidate('admins:all');
  return true;
}

// -------------------------------------------------------------
// Roles Service
// -------------------------------------------------------------
export async function getRoles(options?: CacheOptions): Promise<RoleRecord[]> {
  const defaultRoles: RoleRecord[] = [
    { id: 1, name: 'admin', description: 'Administrator with management access' },
    { id: 2, name: 'customer', description: 'Standard client / customer account' },
    { id: 3, name: 'superadmin', description: 'Super administrator with full privileges' },
  ];

  if (!isSupabaseConfigured) return defaultRoles;

  return apiCache.getOrFetch(
    'roles:all',
    async () => {
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          if (error.code === '42P01') {
            return defaultRoles;
          }
          throw error;
        }
        return (data && data.length > 0) ? data : defaultRoles;
      } catch (err) {
        console.warn("getRoles notice:", err);
        return defaultRoles;
      }
    },
    { ttlMs: 300_000, ...options } // 5 minutes TTL
  );
}


