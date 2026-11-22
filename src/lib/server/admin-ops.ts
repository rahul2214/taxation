// SERVER ONLY. Admin console reads and writes, run with the service role key after
// /api/admin/data has checked the admin session cookie. The browser calls these by
// name through adminApi() in src/lib/admin/api.ts.
import type { SupabaseClient } from '@supabase/supabase-js';
import { applyReferralCode, listReferrals } from './referrals';
import { AdminSession, hashAdminPassword, MIN_ADMIN_PASSWORD_LENGTH } from './admin-auth';
import { CancelBlockedError, guardCancelAgainstPayPal } from '@/lib/paypal/purchase';
import { deleteDocument, DocumentError, removeReplacedFormFiles, removeSupersededDocuments, replaceDocumentFile } from './documents';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isMissingTable = (code?: string) => code === '42P01' || code === 'PGRST205';

/** An error whose message is safe to send back to the admin UI. */
class OpError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}
function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw new OpError(res.error.message || 'Database error', res.error.code);
  return res.data;
}
const s = (v: unknown) => String(v ?? '').trim();
const stripPassword = (row: any) => {
  if (!row) return row;
  const { password: _p, ...rest } = row;
  return rest;
};

/** Turns a DocumentError into an OpError so its message reaches the admin UI. */
async function asOpError<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (err) {
    if (err instanceof DocumentError) throw new OpError(err.message);
    throw err;
  }
}

type Op = (db: SupabaseClient, args: any, admin: AdminSession) => Promise<unknown>;

/** Checks the CURRENT role in the database (the session cookie can be up to 12 hours old). */
async function requireSuperadmin(db: SupabaseClient, admin: AdminSession) {
  const denied = new OpError('Only a super administrator can add, change or remove admin users.', '42501');
  const { data: row } = await db.from('admins').select('role, role_id').ilike('email', admin.email).maybeSingle();
  if (row) {
    if (row.role !== 'superadmin' && row.role_id !== 3) throw denied;
    return;
  }
  // Admin signed in with a Supabase account whose customers row carries the admin role.
  const { data: cust } = UUID_RE.test(admin.id)
    ? await db.from('customers').select('role, role_id').eq('id', admin.id).maybeSingle()
    : { data: null };
  if (!cust || (cust.role !== 'superadmin' && cust.role_id !== 3)) throw denied;
}

export const adminOps: Record<string, Op> = {
  // ---------- Customers ----------
  async getCustomer(db, { id }) {
    const val = s(id);
    if (!val) return null;
    let q = db.from('customers').select('*');
    if (/^\d+$/.test(val)) q = q.eq('userid', Number(val));
    else if (val.includes('@')) q = q.ilike('email', val);
    else if (UUID_RE.test(val)) q = q.eq('id', val);
    else return null;
    const { data, error } = await q.maybeSingle();
    if (error) return null;
    return data;
  },
  async getAllCustomers(db) {
    return check(await db.from('customers').select('*').order('created_at', { ascending: false })) || [];
  },

  // ---------- Tax documents ----------
  async getTaxDocuments(db, { customerId }) {
    let q = db.from('tax_documents').select('*');
    const val = s(customerId);
    if (val) {
      if (UUID_RE.test(val)) q = q.eq('customer_id', val);
      else if (/^\d+$/.test(val)) q = q.eq('customer_userid', Number(val));
      else return [];
    }
    return check(await q.order('upload_date', { ascending: false })) || [];
  },
  async createTaxDocument(db, { doc }) {
    const row = { ...(doc || {}) };
    delete row.id;
    if (row.customer_userid == null && row.customer_id) {
      const { data: owner } = await db.from('customers').select('userid').eq('id', row.customer_id).maybeSingle();
      if (owner?.userid != null) row.customer_userid = owner.userid;
    }
    const created: any = check(await db.from('tax_documents').insert([row]).select().single());
    // A new Tax Estimation / Tax Return Draft / Final Document replaces the customer's previous one.
    if (created?.id) await asOpError(removeSupersededDocuments(db, { kind: 'admin' }, created.id));
    return created;
  },
  async deleteTaxDocument(db, { id }) {
    return asOpError(deleteDocument(db, { kind: 'admin' }, s(id)));
  },
  async replaceTaxDocumentFile(db, { id, fileUrl, documentName }) {
    return asOpError(replaceDocumentFile(db, { kind: 'admin' }, s(id), { fileUrl: s(fileUrl), documentName: s(documentName) }));
  },
  async updateTaxDocumentStatus(db, { id, status }) {
    return check(await db.from('tax_documents').update({ status: s(status) }).eq('id', s(id)).select().single());
  },

  // ---------- Appointments ----------
  async getAppointments(db, { identifier }) {
    let q = db.from('appointments').select('*');
    const val = s(identifier);
    if (val) {
      if (val.includes('@')) q = q.ilike('email', val);
      else if (/^\d+$/.test(val)) q = q.eq('customer_userid', Number(val));
      else if (UUID_RE.test(val)) q = q.eq('customer_id', val);
      else {
        const safe = val.replace(/[,()%*]/g, ' ');
        q = q.or(`email.ilike.%${safe}%,name.ilike.%${safe}%`);
      }
    }
    return check(await q.order('appointment_date', { ascending: true })) || [];
  },
  async updateAppointmentStatus(db, { id, status }) {
    return check(await db.from('appointments').update({ status: s(status) }).eq('id', s(id)).select().single());
  },

  // ---------- Contacts & feedback ----------
  async getContacts(db) {
    const { data, error } = await db.from('contacts').select('*').order('created_at', { ascending: false });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw new OpError(error.message, error.code);
    }
    return data || [];
  },
  async updateContactStatus(db, { id, status }) {
    return check(await db.from('contacts').update({ status: s(status) }).eq('id', s(id)).select().single());
  },
  async getFeedback(db) {
    const { data, error } = await db.from('feedback').select('*').order('created_at', { ascending: false });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw new OpError(error.message, error.code);
    }
    return data || [];
  },
  async updateFeedbackStatus(db, { id, status }) {
    return check(await db.from('feedback').update({ status: s(status) }).eq('id', s(id)).select().single());
  },

  // ---------- Referrals ----------
  async getReferrals(db, { referrerId }) {
    return listReferrals(db, s(referrerId) || undefined);
  },
  async setReferralRewardStatus(db, { rewardId, status }) {
    if (status !== 'unlocked' && status !== 'cancelled') throw new OpError('Invalid status');
    return check(await db.rpc('admin_set_referral_reward_status', { p_reward_id: s(rewardId), p_status: status }));
  },
  async applyReferralCode(db, { customerId, code }) {
    return applyReferralCode(db, s(customerId), s(code));
  },

  // ---------- Plans & purchases ----------
  async getPlans(db, { includeInactive }) {
    let q = db.from('plans').select('*');
    if (!includeInactive) q = q.eq('is_active', true);
    const { data, error } = await q.order('sort_order', { ascending: true }).order('price', { ascending: true });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw new OpError(error.message, error.code);
    }
    return data || [];
  },
  async savePlan(db, { plan }) {
    const payload = {
      name: s(plan?.name),
      description: s(plan?.description) || null,
      price: Number(plan?.price),
      billing_period: plan?.billing_period,
      features: Array.isArray(plan?.features) ? plan.features.map((f: unknown) => s(f)).filter(Boolean) : [],
      is_active: Boolean(plan?.is_active),
      is_popular: Boolean(plan?.is_popular),
      sort_order: Number(plan?.sort_order) || 0,
      updated_at: new Date().toISOString(),
    };
    const q = plan?.id
      ? db.from('plans').update(payload).eq('id', s(plan.id))
      : db.from('plans').insert([payload]);
    return check(await q.select().single());
  },
  async deletePlan(db, { id }) {
    check(await db.from('plans').delete().eq('id', s(id)));
    return true;
  },
  async getPlanPurchases(db, { customerId }) {
    let q = db.from('plan_purchases').select('*');
    if (customerId) {
      if (!UUID_RE.test(s(customerId))) return [];
      q = q.eq('customer_id', s(customerId));
    }
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw new OpError(error.message, error.code);
    }
    return data || [];
  },
  async markPlanPurchasePaid(db, { purchaseId, paymentMethod, paymentReference }) {
    return check(
      await db.rpc('mark_plan_purchase_paid', {
        p_purchase_id: s(purchaseId),
        p_payment_method: s(paymentMethod) || null,
        p_payment_reference: s(paymentReference) || null,
      })
    );
  },
  async cancelPlanPurchase(db, { purchaseId }) {
    // If the order went to PayPal, make sure it wasn't paid there before cancelling.
    try {
      await guardCancelAgainstPayPal(db, s(purchaseId));
    } catch (err) {
      if (err instanceof CancelBlockedError) throw new OpError(err.message);
      throw err;
    }
    return check(await db.rpc('cancel_plan_purchase', { p_purchase_id: s(purchaseId) }));
  },

  // ---------- Site settings ----------
  async updateSiteSettings(db, { settings }) {
    const allowed = ['current_year_form_url', 'prior_year_form_url', 'referral_reward_amount'];
    const payload: Record<string, unknown> = { id: 'global', updated_at: new Date().toISOString() };
    for (const k of allowed) if (settings && k in settings) payload[k] = settings[k];
    const { data: before } = await db
      .from('site_settings')
      .select('current_year_form_url, prior_year_form_url')
      .eq('id', 'global')
      .maybeSingle();
    const saved: any = check(await db.from('site_settings').upsert(payload).select().single());
    // Delete the old form file from R2 when an admin uploads a replacement.
    await removeReplacedFormFiles(before, saved);
    return saved;
  },

  // ---------- Admin users ----------
  async getAllAdmins(db) {
    const { data, error } = await db
      .from('admins')
      .select('id, email, name, role, role_id, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) {
      if (isMissingTable(error.code)) return [];
      throw new OpError(error.message, error.code);
    }
    return data || [];
  },
  async createOrUpdateAdmin(db, { admin }, me) {
    await requireSuperadmin(db, me);
    const email = s(admin?.email).toLowerCase();
    if (!email) throw new OpError('Email is required');
    const role = admin?.role === 'superadmin' ? 'superadmin' : 'admin';
    const id = s(admin?.id);
    if (id && id === me.id && role !== 'superadmin') {
      throw new OpError('You cannot remove your own super administrator role.');
    }
    const payload: Record<string, unknown> = {
      email,
      name: s(admin?.name),
      role,
      role_id: role === 'superadmin' ? 3 : 1,
      updated_at: new Date().toISOString(),
    };
    if (id) payload.id = id;
    if (admin?.password) {
      const password = String(admin.password);
      if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
        throw new OpError(`Admin passwords must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`);
      }
      payload.password = hashAdminPassword(password);
    } else if (!id) {
      throw new OpError('A password is required for a new admin.');
    }
    return stripPassword(check(await db.from('admins').upsert(payload).select().single()));
  },
  async deleteAdmin(db, { id }, me) {
    await requireSuperadmin(db, me);
    const target = s(id);
    if (!target) throw new OpError('Admin id is required');
    if (target === me.id) throw new OpError('You cannot delete your own admin account.');
    const { data: row } = await db.from('admins').select('id, email, role, role_id').eq('id', target).maybeSingle();
    if (!row) throw new OpError('Admin not found');
    if (row.email?.toLowerCase() === me.email.toLowerCase()) {
      throw new OpError('You cannot delete your own admin account.');
    }
    check(await db.from('admins').delete().eq('id', target));
    return true;
  },

  // ---------- Master data ----------
  async createMasterData(db, { record }) {
    const res = await db
      .from('master_data')
      .insert([
        {
          category: record?.category,
          label: s(record?.label),
          sort_order: Number(record?.sort_order ?? 0),
          is_active: record?.is_active ?? true,
        },
      ])
      .select()
      .single();
    if (res.error?.code === '23505') throw new OpError('That value already exists in this list.');
    return check(res);
  },
  async updateMasterData(db, { id, changes }) {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof changes?.label === 'string') payload.label = changes.label.trim();
    if (changes?.sort_order !== undefined) payload.sort_order = Number(changes.sort_order);
    if (changes?.is_active !== undefined) payload.is_active = Boolean(changes.is_active);
    const res = await db.from('master_data').update(payload).eq('id', Number(id)).select().single();
    if (res.error?.code === '23505') throw new OpError('That value already exists in this list.');
    return check(res);
  },
  async deleteMasterData(db, { id }) {
    check(await db.from('master_data').delete().eq('id', Number(id)));
    return true;
  },
};

export function opErrorMessage(err: unknown) {
  if (err instanceof OpError) return { error: err.message, code: err.code };
  const e = err as any;
  return { error: e?.message || 'Something went wrong.', code: e?.code };
}
