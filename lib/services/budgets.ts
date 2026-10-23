import type { SupabaseClient } from '@supabase/supabase-js';
import type { BudgetRow } from '@/lib/types';
import { monthRange } from '@/lib/dates';
import { num } from '@/lib/utils';

export async function budgetsForMonth(sb: SupabaseClient, month: string): Promise<BudgetRow[]> {
  const { from, to } = monthRange(month);
  const { data, error } = await sb.rpc('budget_progress', { p_start: from, p_end: to });
  if (error) throw error;
  return ((data ?? []) as any[]).map((b): BudgetRow => ({ ...b, limit_amount: num(b.limit_amount), spent: num(b.spent) }));
}
