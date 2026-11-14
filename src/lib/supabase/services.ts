import { supabase, isSupabaseConfigured } from './client';
import { apiCache, CacheOptions } from '../cache/api-cache';

export { apiCache, type CacheOptions };

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

export async function upsertCustomer(customer: CustomerRecord) {
  if (!isSupabaseConfigured) return null;

  const fullPayload: any = {
    id: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    role: customer.role || 'customer',
    role_id: customer.role_id !== undefined ? customer.role_id : (customer.role === 'admin' ? 1 : (customer.role === 'superadmin' ? 3 : 2)),
    updated_at: new Date().toISOString(),
  };

  if (customer.referral_code !== undefined) fullPayload.referral_code = customer.referral_code;
  if (customer.wallet_balance !== undefined) fullPayload.wallet_balance = customer.wallet_balance;
  if (customer.referred_by !== undefined) {
    fullPayload.referred_by = customer.referred_by !== null ? String(customer.referred_by) : null;
  }
  if (customer.heard_about !== undefined) fullPayload.heard_about = customer.heard_about;

  try {
    const { data, error } = await supabase
      .from('customers')
      .upsert(fullPayload)
      .select()
      .single();

    if (error) {
      // If error code is 42703 (column does not exist), retry with core fields
      if (error.code === '42703') {
        const corePayload = {
          id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          role: customer.role || 'customer',
          updated_at: new Date().toISOString(),
        };
        const fallback = await supabase
          .from('customers')
          .upsert(corePayload)
          .select()
          .single();
        if (fallback.error) throw fallback.error;
        
        // Cache invalidation and population
        apiCache.invalidate('customers:all');
        if (fallback.data) {
          apiCache.set(`customer:${customer.id}`, fallback.data, 120_000);
          if (fallback.data.userid) apiCache.set(`customer:${fallback.data.userid}`, fallback.data, 120_000);
        }
        return fallback.data;
      }
      throw error;
    }

    // Invalidate and refresh cache
    apiCache.invalidate('customers:all');
    if (data) {
      apiCache.set(`customer:${customer.id}`, data, 120_000);
      if (data.userid) apiCache.set(`customer:${data.userid}`, data, 120_000);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

export async function getCustomerByReferralCode(
  code: string,
  options?: CacheOptions
): Promise<CustomerRecord | null> {
  if (!isSupabaseConfigured || !code?.trim()) return null;
  const clean = code.trim().toUpperCase();

  return apiCache.getOrFetch(
    `customer_ref_code:${clean}`,
    async () => {
      try {
        const { data: byCode, error: errCode } = await supabase
          .from('customers')
          .select('*')
          .ilike('referral_code', clean)
          .maybeSingle();

        if (!errCode && byCode) {
          // Cross-populate customer caches
          if (byCode.id) apiCache.set(`customer:${byCode.id}`, byCode, 120_000);
          if (byCode.userid) apiCache.set(`customer:${byCode.userid}`, byCode, 120_000);
          return byCode;
        }
      } catch (e) {
        console.warn("getCustomerByReferralCode notice:", e);
      }
      return null;
    },
    { ttlMs: 60_000, ...options }
  );
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

    const newCode = generateReferralCode(firstName || existing?.first_name, email || existing?.email);
    await supabase
      .from('customers')
      .update({ referral_code: newCode })
      .eq('id', customerId);

    // Invalidate cache
    apiCache.invalidate(`customer:${customerId}`);
    return newCode;
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
    async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
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
  const { data, error } = await supabase
    .from('tax_documents')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  apiCache.invalidate('tax_docs');
  return data;
}

export async function deleteTaxDocument(id: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('tax_documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
  apiCache.invalidate('tax_docs');
  return data;
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
 */
async function insertWithOptionalColumns<T>(
  table: string,
  row: Record<string, any>,
  optionalColumns: string[],
  linkIdColumns: string[]
): Promise<T> {
  const payload: Record<string, any> = { ...row };

  for (let attempt = 0; attempt <= optionalColumns.length + 1; attempt++) {
    const { data, error } = await supabase.from(table).insert([payload]).select().single();
    if (!error) return data as T;

    // Column missing from table / PostgREST schema cache (PGRST204, 42703)
    if (error.code === 'PGRST204' || error.code === '42703') {
      const missing = error.message?.match(/'([a-z_]+)' column|column (?:[a-z_]+\.)?([a-z_]+) does not exist/i);
      const col = missing?.[1] || missing?.[2];
      if (col && col in payload && optionalColumns.includes(col)) {
        delete payload[col];
        continue;
      }
    }

    // Foreign key violation (23503) or invalid UUID (22P02): drop the links
    if ((error.code === '23503' || error.code === '22P02') && linkIdColumns.some((c) => payload[c] != null)) {
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
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
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
    async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        // Table not created yet
        if (error.code === '42P01' || error.code === 'PGRST205') return [];
        throw new Error(error.message);
      }
      return data || [];
    },
    { ttlMs: 30_000, ...options }
  );
}

export async function updateContactStatus(id: string, status: ContactStatus) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('contacts')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
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
        let query = supabase.from('customers').select('*');
        if (referrerId) {
          const referrer = await getCustomer(referrerId, options);
          const searchVals = [referrerId];
          if (referrer?.userid != null) {
            searchVals.push(String(referrer.userid));
          }
          query = query.in('referred_by', searchVals);
        } else {
          query = query.not('referred_by', 'is', null);
        }

        const { data: referredUsers, error } = await query.order('created_at', { ascending: false });
        if (error) {
          if (error.code === '42703' || error.code === '42P01') return [];
          throw error;
        }

        if (!referredUsers || referredUsers.length === 0) return [];

        const allCustomers = await getAllCustomers(options);
        const customerMap = new Map<string, CustomerRecord>();
        allCustomers.forEach(c => {
          customerMap.set(c.id, c);
          if (c.userid != null) customerMap.set(String(c.userid), c);
        });

        const currentReward = await getReferralRewardAmount(options);

        // Locked / unlocked state lives in referral_rewards (one row per referred customer)
        const rewardMap = new Map<string, ReferralRewardRecord>();
        try {
          const { data: rewards, error: rewardsErr } = await supabase
            .from('referral_rewards')
            .select('*')
            .in('referred_id', referredUsers.map(u => u.id));
          if (!rewardsErr && rewards) {
            rewards.forEach((r: ReferralRewardRecord) => rewardMap.set(r.referred_id, r));
          }
        } catch (e) {
          // referral_rewards table not created yet; fall back to legacy status
        }

        const statusLabel: Record<ReferralRewardRecord['status'], string> = {
          locked: 'Locked',
          unlocked: 'Unlocked',
          cancelled: 'Cancelled',
        };

        return referredUsers.map(u => {
          const ref = u.referred_by ? customerMap.get(u.referred_by) : null;
          const reward = rewardMap.get(u.id);
          return {
            id: u.id,
            referrer_id: ref?.id,
            referrer_userid: ref?.userid,
            referrer_name: ref ? `${ref.first_name || ''} ${ref.last_name || ''}`.trim() || ref.email : (u.referred_by ? `User #${u.referred_by}` : 'Referrer'),
            referrer_email: ref?.email || '',
            referred_id: u.id,
            referred_userid: u.userid,
            referred_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            referred_email: u.email,
            referral_code: ref?.referral_code,
            reward_amount: reward ? Number(reward.referrer_amount) : currentReward,
            status: reward ? statusLabel[reward.status] : 'Rewarded',
            reward_id: reward?.id ?? null,
            unlocked_at: reward?.unlocked_at ?? null,
            referral_date: u.signup_date || u.created_at,
            created_at: u.created_at,
          };
        });
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

export async function addWalletTransaction(tx: WalletTransactionRecord) {
  if (!isSupabaseConfigured) return null;
  const payload: any = {
    customer_id: tx.customer_id,
    amount: tx.amount,
    type: tx.type,
    description: tx.description,
    reference_id: tx.reference_id,
    created_at: new Date().toISOString(),
  };
  if (tx.customer_userid !== undefined && tx.customer_userid !== null) {
    payload.customer_userid = tx.customer_userid;
  }

  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        console.warn("wallet_transactions table not yet created in Supabase.");
        return null;
      }
      // If customer_userid does not exist yet before migration, retry with core payload
      if (error.code === '42703' && payload.customer_userid) {
        delete payload.customer_userid;
        const fallback = await supabase
          .from('wallet_transactions')
          .insert([payload])
          .select()
          .single();
        if (fallback.error) throw fallback.error;
        apiCache.invalidate(`wallet_txs:${tx.customer_id}`);
        apiCache.invalidate('wallet_txs');
        return fallback.data;
      }
      throw error;
    }
    apiCache.invalidate(`wallet_txs:${tx.customer_id}`);
    apiCache.invalidate('wallet_txs');
    return data;
  } catch (e) {
    console.warn("addWalletTransaction notice:", e);
    return null;
  }
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

export async function creditCustomerWallet(
  customerId: string,
  amount: number,
  type: WalletTransactionRecord['type'],
  description: string,
  referenceId?: string
) {
  if (!isSupabaseConfigured || !customerId || amount <= 0) return 0;

  try {
    // 1. Get current balance (force refresh or direct fetch)
    const cust = await getCustomer(customerId, { forceRefresh: true });
    const currentBalance = Number(cust?.wallet_balance || 0);
    const newBalance = Number((currentBalance + amount).toFixed(2));

    // 2. Update wallet balance
    const { error: updateErr } = await supabase
      .from('customers')
      .update({ wallet_balance: newBalance })
      .eq('id', customerId);

    if (updateErr) {
      console.warn("creditCustomerWallet update notice:", updateErr);
    }

    // Invalidate caches for customer balance and related listings
    apiCache.invalidate(`customer:${customerId}`);
    if (cust?.userid) apiCache.invalidate(`customer:${cust.userid}`);
    apiCache.invalidate('customers:all');
    apiCache.invalidate(`wallet_balance:${customerId}`);
    apiCache.invalidate('referrals');

    // 3. Record ledger transaction
    await addWalletTransaction({
      customer_id: customerId,
      customer_userid: cust?.userid,
      amount,
      type,
      description,
      reference_id: referenceId,
    });

    return newBalance;
  } catch (err) {
    console.warn("creditCustomerWallet error:", err);
    return 0;
  }
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
 * Applies a referral code to a newly created customer (runs atomically in the DB).
 * - New user: bonus goes to wallet_balance and is usable right away.
 * - Referrer: bonus goes to locked_wallet_balance and only becomes usable once
 *   the new user pays for a plan (see markPlanPurchasePaid).
 */
export async function applyReferralSignup(
  newUserId: string,
  referralCode: string
): Promise<{ applied: boolean; amount?: number; reason?: string }> {
  if (!isSupabaseConfigured || !newUserId || !referralCode?.trim()) {
    return { applied: false, reason: 'not_configured' };
  }
  const { data, error } = await supabase.rpc('apply_referral_signup', {
    p_referred_id: newUserId,
    p_referral_code: referralCode.trim(),
  });
  if (error) throw error;
  invalidateCustomerMoneyCaches(newUserId);
  return (data || { applied: false }) as { applied: boolean; amount?: number; reason?: string };
}

/** @deprecated Use applyReferralSignup. Kept so older callers keep working. */
export async function processReferralReward({
  newUserId,
  referralCodeUsed,
}: {
  referrer?: CustomerRecord;
  newUserId: string;
  newUserName?: string;
  newUserEmail?: string;
  referralCodeUsed: string;
  rewardAmount?: number;
}) {
  return applyReferralSignup(newUserId, referralCodeUsed);
}

/** Admin override for a locked referral reward: release it now, or cancel it. */
export async function setReferralRewardStatus(rewardId: string, status: 'unlocked' | 'cancelled') {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('admin_set_referral_reward_status', {
    p_reward_id: rewardId,
    p_status: status,
  });
  if (error) throw error;
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
      let query = supabase.from('plans').select('*');
      if (!includeInactive) query = query.eq('is_active', true);
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
  const query = plan.id
    ? supabase.from('plans').update(payload).eq('id', plan.id)
    : supabase.from('plans').insert([payload]);
  const { data, error } = await query.select().single();
  if (error) throw error;
  apiCache.invalidate('plans');
  return normalizePlan(data);
}

export async function deletePlan(id: string) {
  if (!isSupabaseConfigured) return null;
  const { error } = await supabase.from('plans').delete().eq('id', id);
  if (error) throw error;
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
  const { data, error } = await supabase.rpc('mark_plan_purchase_paid', {
    p_purchase_id: purchaseId,
    p_payment_method: paymentMethod || null,
    p_payment_reference: paymentReference || null,
  });
  if (error) throw error;
  invalidateCustomerMoneyCaches((data as any)?.customer_id);
  apiCache.invalidate('wallet_balance');
  apiCache.invalidate('wallet_txs');
  return normalizePurchase(data);
}

/** Cancels a pending purchase and refunds any wallet credit that was applied. */
export async function cancelPlanPurchase(purchaseId: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('cancel_plan_purchase', { p_purchase_id: purchaseId });
  if (error) throw error;
  invalidateCustomerMoneyCaches((data as any)?.customer_id);
  return normalizePurchase(data);
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
  const payload: any = {
    id: 'global',
    ...settings,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('site_settings')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  apiCache.invalidate('site_settings');
  apiCache.invalidate('referral_reward_amount');
  return data;
}

// -------------------------------------------------------------
// Admins Service
// -------------------------------------------------------------
export async function getAdminByEmail(
  email: string,
  options?: CacheOptions
): Promise<AdminRecord | null> {
  if (!isSupabaseConfigured) return null;
  const clean = email.trim().toLowerCase();

  return apiCache.getOrFetch(
    `admin_email:${clean}`,
    async () => {
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .ilike('email', clean)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST116' || error.code === '42P01') return null;
          throw error;
        }
        if (data?.id) {
          apiCache.set(`admin_id:${data.id}`, data, 300_000);
        }
        return data;
      } catch (err: any) {
        if (err?.code === '42P01' || err?.message?.includes('relation "public.admins" does not exist')) {
          console.warn("Notice: public.admins table does not exist in Supabase yet. Please run the schema.sql in Supabase SQL Editor.");
          return null;
        }
        throw err;
      }
    },
    { ttlMs: 300_000, ...options }
  );
}

export async function getAdminById(
  id: string,
  options?: CacheOptions
): Promise<AdminRecord | null> {
  if (!isSupabaseConfigured) return null;

  return apiCache.getOrFetch(
    `admin_id:${id}`,
    async () => {
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST116' || error.code === '42P01') return null;
          throw error;
        }
        if (data?.email) {
          apiCache.set(`admin_email:${data.email.toLowerCase().trim()}`, data, 300_000);
        }
        return data;
      } catch (err: any) {
        if (err?.code === '42P01' || err?.message?.includes('relation "public.admins" does not exist')) {
          return null;
        }
        throw err;
      }
    },
    { ttlMs: 300_000, ...options }
  );
}

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<{ admin: AdminRecord | null; error?: string }> {
  if (!isSupabaseConfigured) return { admin: null, error: "Database is not connected." };
  try {
    const admin = await getAdminByEmail(email);
    if (!admin) {
      return { admin: null, error: "Admin account not found in admins table." };
    }
    
    // If admin has a password stored in the admins table, verify it
    if (admin.password && admin.password.trim() !== '') {
      if (admin.password === password) {
        return { admin };
      }
      return { admin: null, error: "Incorrect admin password." };
    }

    // If password is not stored in admins table, admin email exists in table
    return { admin };
  } catch (err: any) {
    return { admin: null, error: err.message || "Failed to verify admin credentials." };
  }
}

export async function getAllAdmins(options?: CacheOptions): Promise<AdminRecord[]> {
  if (!isSupabaseConfigured) return [];

  return apiCache.getOrFetch(
    'admins:all',
    async () => {
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('id, email, name, role, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (error) {
          if (error.code === '42P01') return [];
          throw error;
        }
        return data || [];
      } catch (err) {
        return [];
      }
    },
    { ttlMs: 60_000, ...options }
  );
}

export async function createOrUpdateAdmin(admin: AdminRecord) {
  if (!isSupabaseConfigured) return null;
  const payload: any = {
    email: admin.email.toLowerCase().trim(),
    name: admin.name || '',
    role: admin.role || 'admin',
    role_id: admin.role_id !== undefined ? admin.role_id : (admin.role === 'superadmin' ? 3 : 1),
    updated_at: new Date().toISOString(),
  };
  if (admin.id) payload.id = admin.id;
  if (admin.password) payload.password = admin.password;

  try {
    const { data, error } = await supabase
      .from('admins')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      // If role_id does not exist yet before migration, retry without role_id
      if (error.code === '42703' && payload.role_id !== undefined) {
        delete payload.role_id;
        const fallback = await supabase
          .from('admins')
          .upsert(payload)
          .select()
          .single();
        if (fallback.error) throw fallback.error;
        apiCache.invalidate('admin_email');
        apiCache.invalidate('admin_id');
        apiCache.invalidate('admins:all');
        return fallback.data;
      }
      throw error;
    }

    apiCache.invalidate('admin_email');
    apiCache.invalidate('admin_id');
    apiCache.invalidate('admins:all');
    return data;
  } catch (err) {
    throw err;
  }
}

export async function deleteAdmin(id: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('admins')
    .delete()
    .eq('id', id);

  if (error) throw error;
  apiCache.invalidate('admin_email');
  apiCache.invalidate('admin_id');
  apiCache.invalidate('admins:all');
  return data;
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


