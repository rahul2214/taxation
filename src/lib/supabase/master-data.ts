import { supabase, isSupabaseConfigured } from './client';
import { apiCache, CacheOptions } from '../cache/api-cache';
import { adminApi } from '../admin/api';

// -------------------------------------------------------------
// Master data: admin-managed values for form dropdowns
// -------------------------------------------------------------

export type MasterCategory = 'appointment_service' | 'appointment_time' | 'contact_topic';

export interface MasterDataRecord {
  id?: number;
  category: MasterCategory;
  label: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const MASTER_CATEGORIES: { key: MasterCategory; title: string; usedIn: string }[] = [
  { key: 'appointment_service', title: 'Appointment services', usedIn: 'Booking forms: "What do you need help with?"' },
  { key: 'appointment_time', title: 'Appointment time windows', usedIn: 'Booking forms: "Best time"' },
  { key: 'contact_topic', title: 'Contact topics', usedIn: 'Contact page: "Topic"' },
];

/**
 * Built-in values, used only when the master_data table can't be read
 * (e.g. the migration hasn't been run yet) so the forms keep working.
 */
const FALLBACK: Record<MasterCategory, string[]> = {
  appointment_service: [
    'Individual or family return (Form 1040)',
    'Self-employed or single-member LLC',
    'S-Corp, partnership or C-Corp return',
    'Tax planning',
    'Prior-year returns and amendments',
    'IRS notice or audit',
    'Equity, QSBS or a business sale',
    'Bookkeeping and payroll',
    'Something else',
  ],
  appointment_time: ['Morning (9am–12pm ET)', 'Midday (12–3pm ET)', 'Afternoon (3–6pm ET)', 'Evening (6–8pm ET)'],
  contact_topic: [
    'Preparing a tax return',
    'Small business or LLC taxes',
    'I received an IRS or state letter',
    'Client portal or documents',
    'Something else',
  ],
};

export function fallbackMasterData(category: MasterCategory): MasterDataRecord[] {
  return FALLBACK[category].map((label, i) => ({ category, label, sort_order: (i + 1) * 10, is_active: true }));
}

const isMissingTable = (code?: string) => code === '42P01' || code === 'PGRST205';

/** All master data rows (active and inactive), ordered for display. Throws if the table is missing. */
export async function getAllMasterData(options?: CacheOptions): Promise<MasterDataRecord[]> {
  if (!isSupabaseConfigured) return [];
  return apiCache.getOrFetch(
    'master_data:all',
    async () => {
      const { data, error } = await supabase
        .from('master_data')
        .select('*')
        .order('category')
        .order('sort_order')
        .order('label');
      if (error) throw Object.assign(new Error(error.message), { code: error.code });
      return data || [];
    },
    { ttlMs: 60_000, ...options }
  );
}

/** Active options for one dropdown. Falls back to built-in values if the table can't be read. */
export async function getMasterOptions(category: MasterCategory, options?: CacheOptions): Promise<MasterDataRecord[]> {
  try {
    const rows = await getAllMasterData(options);
    const active = rows.filter((r) => r.category === category && r.is_active !== false);
    return active.length > 0 ? active : fallbackMasterData(category);
  } catch (err: any) {
    if (!isMissingTable(err?.code)) console.warn('getMasterOptions:', err?.message || err);
    return fallbackMasterData(category);
  }
}

// Writes are admin-only and go through the server (/api/admin/data).
export async function createMasterData(record: MasterDataRecord): Promise<MasterDataRecord> {
  const data = await adminApi<MasterDataRecord>('createMasterData', { record });
  apiCache.invalidate('master_data');
  return data;
}

export async function updateMasterData(
  id: number,
  changes: Partial<Pick<MasterDataRecord, 'label' | 'sort_order' | 'is_active'>>
): Promise<MasterDataRecord> {
  const data = await adminApi<MasterDataRecord>('updateMasterData', { id, changes });
  apiCache.invalidate('master_data');
  return data;
}

/** Deletes a value. Appointments/contacts that used it keep their text label; their id is set to null. */
export async function deleteMasterData(id: number): Promise<void> {
  await adminApi('deleteMasterData', { id });
  apiCache.invalidate('master_data');
}
