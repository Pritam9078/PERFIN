import type { SupabaseClient } from '@supabase/supabase-js';
import type { Transaction } from '@/lib/types';
import type { TransactionFilters } from '@/lib/validations';
import { num } from '@/lib/utils';

export const PAGE_SIZE = 15;
const SELECT = 'id, category_id, title, amount, type, transaction_date, payment_method, merchant, notes, tags, category:categories(id, name, color, icon)';

/** Strip characters that carry meaning inside a PostgREST or() filter string. */
const cleanSearch = (q: string) => q.replace(/[,()%*\\_:."']/g, ' ').trim();

function normalise(row: any): Transaction {
  const cat = Array.isArray(row.category) ? row.category[0] : row.category;
  return { ...row, amount: num(row.amount), category: cat ?? null };
}

function applyFilters<T extends { eq: any; gte: any; lte: any; or: any }>(query: T, f: Partial<TransactionFilters>): T {
  let q: any = query;
  if (f.type) q = q.eq('type', f.type);
  if (f.category) q = q.eq('category_id', f.category);
  if (f.method) q = q.eq('payment_method', f.method);
  if (f.from) q = q.gte('transaction_date', f.from);
  if (f.to) q = q.lte('transaction_date', f.to);
  const s = f.q ? cleanSearch(f.q) : '';
  if (s) q = q.or(`title.ilike.%${s}%,merchant.ilike.%${s}%`);
  return q;
}

export async function listTransactions(sb: SupabaseClient, f: TransactionFilters) {
  const from = (f.page - 1) * PAGE_SIZE;
  let q = sb.from('transactions').select(SELECT, { count: 'exact' });
  q = applyFilters(q, f);
  q = q.order(f.sort, { ascending: f.dir === 'asc' });
  if (f.sort !== 'transaction_date') q = q.order('transaction_date', { ascending: false });
  q = q.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
  const { data, count, error } = await q;
  if (error) throw error;

  const s = f.q ? cleanSearch(f.q) : '';
  const { data: totals, error: tErr } = await sb.rpc('transaction_totals', {
    p_type: f.type ?? null, p_category: f.category ?? null, p_from: f.from ?? null, p_to: f.to ?? null,
    p_method: f.method ?? null, p_search: s || null,
  });
  if (tErr) throw tErr;
  const t = totals?.[0] ?? { income: 0, expenses: 0, tx_count: 0 };
  return {
    rows: ((data ?? []) as any[]).map(normalise),
    count: count ?? 0,
    pages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
    totals: { income: num(t.income), expenses: num(t.expenses) },
  };
}

export async function recentTransactions(sb: SupabaseClient, limit = 6) {
  const { data, error } = await sb.from('transactions').select(SELECT)
    .order('transaction_date', { ascending: false }).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return ((data ?? []) as any[]).map(normalise);
}

export async function getTransaction(sb: SupabaseClient, id: string) {
  const { data, error } = await sb.from('transactions').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? normalise(data) : null;
}

/** For CSV export: same filters, no pagination, capped. */
export async function exportTransactions(sb: SupabaseClient, f: TransactionFilters, cap = 10000) {
  let q = sb.from('transactions').select(SELECT);
  q = applyFilters(q, f);
  const { data, error } = await q.order(f.sort, { ascending: f.dir === 'asc' }).order('created_at', { ascending: false }).limit(cap);
  if (error) throw error;
  return ((data ?? []) as any[]).map(normalise);
}

const FORMULA = /^[=+\-@\t\r]/;
export function csvCell(v: unknown): string {
  let s = v == null ? '' : String(v);
  if (FORMULA.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Transaction[]): string {
  const head = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment method', 'Merchant', 'Tags', 'Notes'];
  const lines = rows.map((r) => [r.transaction_date, r.title, r.type, r.category?.name ?? '', r.amount.toFixed(2), r.payment_method ?? '', r.merchant ?? '', r.tags.join(' '), r.notes ?? ''].map(csvCell).join(','));
  return [head.join(','), ...lines].join('\r\n');
}
