import type { SupabaseClient } from '@supabase/supabase-js';
import { daysElapsed, monthRange, shiftMonth, monthLabel, todayInTz, formatDay } from '@/lib/dates';
import { averageDaily, percentChange, savings, savingsRate } from './calculations';
import { num } from '@/lib/utils';

export interface Summary {
  month: string; income: number; expenses: number; savings: number; savingsRate: number | null;
  prev: { income: number; expenses: number; savings: number } | null;
  changes: { income: number | null; expenses: number | null; savings: number | null };
  avgDaily: number; trackedBalance: number;
}

async function totals(sb: SupabaseClient, from: string, to: string) {
  const { data, error } = await sb.rpc('period_totals', { p_from: from, p_to: to });
  if (error) throw error;
  const r = data?.[0] ?? { income: 0, expenses: 0 };
  return { income: num(r.income), expenses: num(r.expenses) };
}

export async function monthSummary(sb: SupabaseClient, month: string, tz: string): Promise<Summary> {
  const cur = monthRange(month);
  const prevM = monthRange(shiftMonth(month, -1));
  const [c, p, bal] = await Promise.all([
    totals(sb, cur.from, cur.to),
    totals(sb, prevM.from, prevM.to),
    sb.rpc('tracked_balance', { p_until: cur.to }),
  ]);
  if (bal.error) throw bal.error;
  const hasPrev = p.income > 0 || p.expenses > 0;
  const s = savings(c.income, c.expenses);
  const ps = savings(p.income, p.expenses);
  return {
    month, ...c, savings: s, savingsRate: savingsRate(c.income, c.expenses),
    prev: hasPrev ? { ...p, savings: ps } : null,
    changes: hasPrev
      ? { income: percentChange(c.income, p.income), expenses: percentChange(c.expenses, p.expenses), savings: percentChange(s, ps) }
      : { income: null, expenses: null, savings: null },
    avgDaily: averageDaily(c.expenses, daysElapsed(month, todayInTz(tz))),
    trackedBalance: num(bal.data),
  };
}

export interface CategorySlice { id: string; name: string; color: string; total: number; count: number; percent: number }

export async function categoryBreakdown(sb: SupabaseClient, from: string, to: string, type: 'income' | 'expense' = 'expense'): Promise<CategorySlice[]> {
  const { data, error } = await sb.rpc('category_breakdown', { p_from: from, p_to: to, p_type: type });
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const sum = rows.reduce((a, r) => a + num(r.total), 0);
  return rows.map((r) => ({
    id: r.category_id, name: r.name, color: r.color ?? '#A3A3A3', total: num(r.total), count: Number(r.tx_count),
    percent: sum > 0 ? Math.round((num(r.total) / sum) * 1000) / 10 : 0,
  }));
}

export interface DayPoint { date: string; label: string; income: number; expenses: number }
export interface MonthPoint { month: string; label: string; income: number; expenses: number; net: number }

export async function dailySeries(sb: SupabaseClient, from: string, to: string): Promise<DayPoint[]> {
  const { data, error } = await sb.rpc('daily_series', { p_from: from, p_to: to });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r): DayPoint => ({ date: r.day as string, label: formatDay(r.day), income: num(r.income), expenses: num(r.expenses) }));
}

export async function monthlySeries(sb: SupabaseClient, endMonth: string, months: number): Promise<MonthPoint[]> {
  const startMonth = shiftMonth(endMonth, -(months - 1));
  const { data, error } = await sb.rpc('monthly_series', { p_from: `${startMonth}-01`, p_to: monthRange(endMonth).to });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r): MonthPoint => {
    const m = (r.month as string).slice(0, 7);
    const income = num(r.income), expenses = num(r.expenses);
    return { month: m, label: monthLabel(m, 'short'), income, expenses, net: savings(income, expenses) };
  });
}
