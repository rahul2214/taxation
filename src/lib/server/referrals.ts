// SERVER ONLY. Referral list built from customers.referred_by + referral_rewards.
// Runs with the service role because it reads other customers' rows (the referred
// friends, or everyone for the admin view), which RLS doesn't let a browser do.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReferralRecord, ReferralRewardRecord } from '@/lib/supabase/services';

const STATUS_LABEL: Record<ReferralRewardRecord['status'], string> = {
  locked: 'Locked',
  unlocked: 'Unlocked',
  cancelled: 'Cancelled',
};

/** All referrals, or only those made by `referrerId` (customer UUID). */
export async function listReferrals(db: SupabaseClient, referrerId?: string): Promise<ReferralRecord[]> {
  let query = db.from('customers').select('*');
  if (referrerId) {
    const { data: referrer } = await db.from('customers').select('id, userid').eq('id', referrerId).maybeSingle();
    if (!referrer) return [];
    const searchVals = [referrer.id];
    if (referrer.userid != null) searchVals.push(String(referrer.userid));
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

  // Referrers of these users
  const refKeys = Array.from(new Set(referredUsers.map((u) => String(u.referred_by))));
  const numeric = refKeys.filter((k) => /^\d+$/.test(k)).map(Number);
  const uuids = refKeys.filter((k) => !/^\d+$/.test(k));
  const referrers: any[] = [];
  if (numeric.length) {
    const { data } = await db.from('customers').select('*').in('userid', numeric);
    referrers.push(...(data || []));
  }
  if (uuids.length) {
    const { data } = await db.from('customers').select('*').in('id', uuids);
    referrers.push(...(data || []));
  }
  const customerMap = new Map<string, any>();
  referrers.forEach((c) => {
    customerMap.set(c.id, c);
    if (c.userid != null) customerMap.set(String(c.userid), c);
  });

  const { data: settings } = await db.from('site_settings').select('referral_reward_amount').eq('id', 'global').maybeSingle();
  const currentReward = settings?.referral_reward_amount != null ? Number(settings.referral_reward_amount) : 25;

  const rewardMap = new Map<string, ReferralRewardRecord>();
  const { data: rewards, error: rewardsErr } = await db
    .from('referral_rewards')
    .select('*')
    .in('referred_id', referredUsers.map((u) => u.id));
  if (!rewardsErr && rewards) rewards.forEach((r: ReferralRewardRecord) => rewardMap.set(r.referred_id, r));

  return referredUsers.map((u) => {
    const ref = u.referred_by ? customerMap.get(String(u.referred_by)) : null;
    const reward = rewardMap.get(u.id);
    return {
      id: u.id,
      referrer_id: ref?.id,
      referrer_userid: ref?.userid,
      referrer_name: ref
        ? `${ref.first_name || ''} ${ref.last_name || ''}`.trim() || ref.email
        : u.referred_by
          ? `User #${u.referred_by}`
          : 'Referrer',
      referrer_email: ref?.email || '',
      referred_id: u.id,
      referred_userid: u.userid,
      referred_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      referred_email: u.email,
      referral_code: ref?.referral_code,
      reward_amount: reward ? Number(reward.referrer_amount) : currentReward,
      status: reward ? STATUS_LABEL[reward.status] : 'Rewarded',
      reward_id: reward?.id ?? null,
      unlocked_at: reward?.unlocked_at ?? null,
      referral_date: u.signup_date || u.created_at,
      created_at: u.created_at,
    };
  });
}

/** Applies a referral code to a new customer through the service-role-only RPC. */
export async function applyReferralCode(db: SupabaseClient, customerId: string, code: string) {
  const clean = code.trim();
  if (!clean) return { applied: false, reason: 'empty_code' } as const;
  const { data, error } = await db.rpc('apply_referral_signup', { p_referred_id: customerId, p_referral_code: clean });
  if (error) throw error;
  return (data || { applied: false }) as { applied: boolean; amount?: number; reason?: string };
}
