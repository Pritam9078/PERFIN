import type { SupabaseClient } from '@supabase/supabase-js';
import type { Goal } from '@/lib/types';
import { num } from '@/lib/utils';

export async function listGoals(sb: SupabaseClient, includeArchived = false): Promise<Goal[]> {
  let q = sb.from('savings_goals').select('id, name, target_amount, current_amount, target_date, description, status').order('created_at', { ascending: false });
  if (!includeArchived) q = q.neq('status', 'archived');
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map((g): Goal => ({ ...g, target_amount: num(g.target_amount), current_amount: num(g.current_amount) }));
}
