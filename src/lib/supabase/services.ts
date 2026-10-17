import { supabase, isSupabaseConfigured } from './client';
import { apiCache, CacheOptions } from '../cache/api-cache';

export { apiCache, type CacheOptions };

export interface CustomerRecord {
  id: string; // Supabase Auth UUID
  userid?: number; // int8 (BIGINT) sequential identity for primary/foreign key relations
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  role?: string;
  referral_code?: string;
  wallet_balance?: number;
  referred_by?: string | number | null; // Stores referrer's int8 userid value
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
  appointment_date: string;
  status?: string;
  notes?: string;
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
  status?: string;
  referral_date?: string;
  created_at?: string;
}

export interface WalletTransactionRecord {
  id?: string;
  customer_id: string; // UUID foreign key to customers(id)
  customer_userid?: number | null; // int8 foreign key to customers(userid)
  amount: number;
  type: 'referral_bonus' | 'welcome_bonus' | 'service_discount' | 'manual_adjustment';
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
    updated_at: new Date().toISOString(),
  };

  if (customer.referral_code !== undefined) fullPayload.referral_code = customer.referral_code;
  if (customer.wallet_balance !== undefined) fullPayload.wallet_balance = customer.wallet_balance;
  if (customer.referred_by !== undefined) {
    fullPayload.referred_by = customer.referred_by !== null ? String(customer.referred_by) : null;
  }

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
  idOrUserid: string | number,
  options?: CacheOptions
): Promise<CustomerRecord | null> {
  if (!isSupabaseConfigured || !idOrUserid) return null;
  const cacheKey = `customer:${idOrUserid}`;

  return apiCache.getOrFetch(
    cacheKey,
    async () => {
      const isNumeric =
        typeof idOrUserid === 'number' ||
        (!isNaN(Number(idOrUserid)) && !idOrUserid.toString().includes('-'));

      let query = supabase.from('customers').select('*');
      if (isNumeric) {
        query = query.eq('userid', Number(idOrUserid));
      } else {
        query = query.eq('id', idOrUserid);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      // Cross-populate both id and userid caches
      if (data) {
        if (data.id && String(data.id) !== String(idOrUserid)) {
          apiCache.set(`customer:${data.id}`, data, 120_000);
        }
        if (data.userid && String(data.userid) !== String(idOrUserid)) {
          apiCache.set(`customer:${data.userid}`, data, 120_000);
        }
      }

      return data;
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
      let query = supabase.from('tax_documents').select('*');
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query.order('upload_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    { ttlMs: 30_000, ...options }
  );
}

export async function createTaxDocument(doc: TaxDocumentRecord) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('tax_documents')
    .insert([doc])
    .select()
    .single();

  if (error) throw error;
  apiCache.invalidate('tax_docs');
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
  customerId?: string,
  options?: CacheOptions
): Promise<AppointmentRecord[]> {
  if (!isSupabaseConfigured) return [];
  const cacheKey = `appointments:${customerId || 'all'}`;

  return apiCache.getOrFetch(
    cacheKey,
    async () => {
      let query = supabase.from('appointments').select('*');
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query.order('appointment_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    { ttlMs: 30_000, ...options }
  );
}

export async function createAppointment(appointment: AppointmentRecord) {
  if (!isSupabaseConfigured) return null;
  let payload = { ...appointment };
  const { data, error } = await supabase
    .from('appointments')
    .insert([payload])
    .select()
    .single();

  if (error && error.code === '23503') {
    // FK violation fallback if customer record does not exist
    payload.customer_id = null;
    const retry = await supabase
      .from('appointments')
      .insert([payload])
      .select()
      .single();
    if (retry.error) throw retry.error;
    apiCache.invalidate('appointments');
    return retry.data;
  }

  if (error) throw error;
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
        return referredUsers.map(u => {
          const ref = u.referred_by ? customerMap.get(u.referred_by) : null;
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
            reward_amount: currentReward,
            status: 'Rewarded',
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

export async function processReferralReward({
  referrer,
  newUserId,
  newUserName,
  newUserEmail,
  referralCodeUsed,
  rewardAmount,
}: {
  referrer: CustomerRecord;
  newUserId: string;
  newUserName: string;
  newUserEmail: string;
  referralCodeUsed: string;
  rewardAmount?: number;
}) {
  if (!isSupabaseConfigured) return;

  try {
    const actualReward = rewardAmount !== undefined && rewardAmount !== null
      ? rewardAmount
      : await getReferralRewardAmount();

    // 1. Credit Referrer Wallet
    await creditCustomerWallet(
      referrer.id,
      actualReward,
      'referral_bonus',
      `Referral bonus: ${newUserName} signed up using your code ${referralCodeUsed}`,
      newUserId
    );

    // 2. Credit New User Wallet
    await creditCustomerWallet(
      newUserId,
      actualReward,
      'welcome_bonus',
      `Welcome credit: $${actualReward.toFixed(2)} bonus for joining with code ${referralCodeUsed}`,
      referrer.id
    );
  } catch (err) {
    console.error("Error processing referral reward:", err);
  }
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
    updated_at: new Date().toISOString(),
  };
  if (admin.id) payload.id = admin.id;
  if (admin.password) payload.password = admin.password;

  const { data, error } = await supabase
    .from('admins')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  apiCache.invalidate('admin_email');
  apiCache.invalidate('admin_id');
  apiCache.invalidate('admins:all');
  return data;
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

