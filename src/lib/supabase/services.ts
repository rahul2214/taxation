import { supabase, isSupabaseConfigured } from './client';

export interface CustomerRecord {
  id: string; // Firebase Auth UID
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  role?: string;
  signup_date?: string;
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
  referred_email: string;
  referred_name?: string;
  status?: string;
  referral_date?: string;
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
export async function upsertCustomer(customer: CustomerRecord) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('customers')
    .upsert({
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      role: customer.role || 'customer',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
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
  let payload = { ...referral };
  const { data, error } = await supabase
    .from('referrals')
    .insert([payload])
    .select()
    .single();

  if (error && error.code === '23503') {
    // FK violation fallback if customer record does not exist
    payload.referrer_id = null;
    const retry = await supabase
      .from('referrals')
      .insert([payload])
      .select()
      .single();
    if (retry.error) throw retry.error;
    return retry.data;
  }

  if (error) throw error;
  return data;
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
