import { supabase, isSupabaseConfigured } from './client';

export interface CustomerRecord {
  id: string; // Firebase / Supabase Auth UID
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  role?: string;
  referral_code?: string;
  wallet_balance?: number;
  referred_by?: string;
  signup_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaxDocumentRecord {
  id?: string;
  customer_id: string;
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
  customer_id?: string | null;
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
  referrer_id?: string | null;
  referrer_name?: string;
  referrer_email?: string;
  referred_id?: string | null;
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
  customer_id: string;
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
  if (customer.referred_by !== undefined) fullPayload.referred_by = customer.referred_by;

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
        return fallback.data;
      }
      throw error;
    }
    return data;
  } catch (err) {
    throw err;
  }
}

export async function getCustomerByReferralCode(codeOrEmail: string): Promise<CustomerRecord | null> {
  if (!isSupabaseConfigured || !codeOrEmail.trim()) return null;
  const clean = codeOrEmail.trim();

  // Try matching referral_code
  try {
    const { data: byCode, error: errCode } = await supabase
      .from('customers')
      .select('*')
      .ilike('referral_code', clean)
      .maybeSingle();

    if (!errCode && byCode) return byCode;
  } catch (_) {}

  // Fallback try matching email
  try {
    const { data: byEmail, error: errEmail } = await supabase
      .from('customers')
      .select('*')
      .ilike('email', clean.toLowerCase())
      .maybeSingle();

    if (!errEmail && byEmail) return byEmail;
  } catch (_) {}

  return null;
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

    return newCode;
  } catch (e) {
    console.warn('ensureCustomerReferralCode fallback:', e);
    return generateReferralCode(firstName, email);
  }
}

export async function getCustomer(id: string): Promise<CustomerRecord | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function getAllCustomers(): Promise<CustomerRecord[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// -------------------------------------------------------------
// Tax Documents Service
// -------------------------------------------------------------
export async function getTaxDocuments(customerId?: string): Promise<TaxDocumentRecord[]> {
  if (!isSupabaseConfigured) return [];
  let query = supabase.from('tax_documents').select('*');
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  const { data, error } = await query.order('upload_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTaxDocument(doc: TaxDocumentRecord) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('tax_documents')
    .insert([doc])
    .select()
    .single();

  if (error) throw error;
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
  return data;
}

export async function deleteTaxDocument(id: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('tax_documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return data;
}

// -------------------------------------------------------------
// Appointments Service
// -------------------------------------------------------------
export async function getAppointments(customerId?: string): Promise<AppointmentRecord[]> {
  if (!isSupabaseConfigured) return [];
  let query = supabase.from('appointments').select('*');
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  const { data, error } = await query.order('appointment_date', { ascending: true });
  if (error) throw error;
  return data || [];
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
    return retry.data;
  }

  if (error) throw error;
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
  return data;
}

// -------------------------------------------------------------
// Referrals Service
// -------------------------------------------------------------
export async function getReferrals(referrerId?: string): Promise<ReferralRecord[]> {
  if (!isSupabaseConfigured) return [];
  let query = supabase.from('referrals').select('*');
  if (referrerId) {
    query = query.eq('referrer_id', referrerId);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createReferral(referral: ReferralRecord) {
  if (!isSupabaseConfigured) return null;
  let payload: any = { ...referral };

  try {
    const { data, error } = await supabase
      .from('referrals')
      .insert([payload])
      .select()
      .single();

    if (error) {
      // FK violation fallback if customer record does not exist
      if (error.code === '23503') {
        payload.referrer_id = null;
        payload.referred_id = null;
        const retry = await supabase
          .from('referrals')
          .insert([payload])
          .select()
          .single();
        if (retry.error) throw retry.error;
        return retry.data;
      }
      // If error code is 42703 (columns do not exist yet before migration), fallback to core columns
      if (error.code === '42703') {
        const corePayload = {
          referrer_id: payload.referrer_id,
          referrer_name: payload.referrer_name,
          referrer_email: payload.referrer_email,
          referred_name: payload.referred_name,
          referred_email: payload.referred_email,
          status: payload.status || 'Pending',
          referral_date: payload.referral_date || new Date().toISOString(),
        };
        const retry = await supabase
          .from('referrals')
          .insert([corePayload])
          .select()
          .single();
        if (retry.error) throw retry.error;
        return retry.data;
      }
      throw error;
    }
    return data;
  } catch (err) {
    console.warn("createReferral notice:", err);
    return null;
  }
}

export async function updateReferralStatus(id: string, status: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('referrals')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// -------------------------------------------------------------
// Wallet & Referral Rewards Service
// -------------------------------------------------------------

export async function getWalletBalance(customerId: string): Promise<number> {
  if (!isSupabaseConfigured || !customerId) return 0;
  try {
    const cust = await getCustomer(customerId);
    return Number(cust?.wallet_balance || 0);
  } catch (err) {
    console.warn("getWalletBalance error:", err);
    return 0;
  }
}

export async function addWalletTransaction(tx: WalletTransactionRecord) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert([{
        customer_id: tx.customer_id,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        reference_id: tx.reference_id,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        console.warn("wallet_transactions table not yet created in Supabase.");
        return null;
      }
      throw error;
    }
    return data;
  } catch (e) {
    console.warn("addWalletTransaction notice:", e);
    return null;
  }
}

export async function getWalletTransactions(customerId: string): Promise<WalletTransactionRecord[]> {
  if (!isSupabaseConfigured || !customerId) return [];
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
    // 1. Get current balance
    const cust = await getCustomer(customerId);
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

    // 3. Record ledger transaction
    await addWalletTransaction({
      customer_id: customerId,
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

export async function processReferralReward({
  referrer,
  newUserId,
  newUserName,
  newUserEmail,
  referralCodeUsed,
  rewardAmount = 25.0,
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
    // 1. Credit Referrer Wallet
    await creditCustomerWallet(
      referrer.id,
      rewardAmount,
      'referral_bonus',
      `Referral bonus: ${newUserName} signed up using your code ${referralCodeUsed}`,
      newUserId
    );

    // 2. Credit New User Wallet
    await creditCustomerWallet(
      newUserId,
      rewardAmount,
      'welcome_bonus',
      `Welcome credit: $${rewardAmount.toFixed(2)} bonus for joining with code ${referralCodeUsed}`,
      referrer.id
    );

    // 3. Create or Update Referral Record in database
    await createReferral({
      referrer_id: referrer.id,
      referrer_name: `${referrer.first_name || ''} ${referrer.last_name || ''}`.trim() || referrer.email,
      referrer_email: referrer.email,
      referred_id: newUserId,
      referred_name: newUserName,
      referred_email: newUserEmail,
      referral_code: referralCodeUsed,
      reward_amount: rewardAmount,
      status: 'Rewarded',
      referral_date: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error processing referral reward:", err);
  }
}

// -------------------------------------------------------------
// Site Settings Service
// -------------------------------------------------------------
export async function getSiteSettings(): Promise<SiteSettingsRecord | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function updateSiteSettings(settings: SiteSettingsRecord) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      id: 'global',
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// -------------------------------------------------------------
// Admins Service
// -------------------------------------------------------------
export async function getAdminByEmail(email: string): Promise<AdminRecord | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .ilike('email', email.trim())
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') return null;
      throw error;
    }
    return data;
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('relation "public.admins" does not exist')) {
      console.warn("Notice: public.admins table does not exist in Supabase yet. Please run the schema.sql in Supabase SQL Editor.");
      return null;
    }
    throw err;
  }
}

export async function getAdminById(id: string): Promise<AdminRecord | null> {
  if (!isSupabaseConfigured) return null;
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
    return data;
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('relation "public.admins" does not exist')) {
      return null;
    }
    throw err;
  }
}

export async function verifyAdminCredentials(email: string, password: string): Promise<{ admin: AdminRecord | null; error?: string }> {
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

export async function getAllAdmins(): Promise<AdminRecord[]> {
  if (!isSupabaseConfigured) return [];
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
  return data;
}

export async function deleteAdmin(id: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('admins')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return data;
}
