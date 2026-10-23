'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getActionUser } from '@/lib/services/auth';
import { fail, success, safeDbError, type ActionResult } from '@/lib/errors';
import { monthRange } from '@/lib/dates';
import { round2 } from '@/lib/utils';
import {
  loginSchema, signupSchema, forgotSchema, resetSchema, transactionSchema, parseTags, budgetSchema,
  goalSchema, goalFundsSchema, profileSchema, customCategorySchema,
} from '@/lib/validations';

const flat = (e: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) =>
  Object.fromEntries(Object.entries(e.flatten().fieldErrors).filter(([, v]) => v?.length)) as Record<string, string[]>;
const UNAUTH = fail('Your session has expired. Please sign in again.');
const refreshAll = () => ['/dashboard', '/transactions', '/budgets', '/analytics', '/goals'].forEach((p) => revalidatePath(p));
const uuid = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

async function siteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  const h = await headers();
  return `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`;
}

/* ------------------------------ auth ------------------------------ */
export async function loginAction(input: unknown, next?: string): Promise<ActionResult> {
  const p = loginSchema.safeParse(input);
  if (!p.success) return fail('Check the highlighted fields.', flat(p.error));
  const sb = await createClient();
  const { error } = await sb.auth.signInWithPassword(p.data);
  if (error) return fail(error.status === 429 ? 'Too many attempts. Wait a minute and try again.' : 'Email or password is incorrect.');
  redirect(next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
}

export async function signupAction(input: unknown): Promise<ActionResult> {
  const p = signupSchema.safeParse(input);
  if (!p.success) return fail('Check the highlighted fields.', flat(p.error));
  const sb = await createClient();
  const { data, error } = await sb.auth.signUp({
    email: p.data.email, password: p.data.password,
    options: { data: { full_name: p.data.full_name }, emailRedirectTo: `${await siteUrl()}/auth/callback?next=/dashboard` },
  });
  if (error) return fail(error.status === 429 ? 'Too many attempts. Wait a minute and try again.' : error.message.includes('registered') ? 'An account with this email already exists.' : 'We could not create your account. Try again.');
  if (data.session) redirect('/dashboard');
  return success(undefined, 'Check your email to confirm your account, then sign in.');
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const p = forgotSchema.safeParse(input);
  if (!p.success) return fail('Enter a valid email.', flat(p.error));
  const sb = await createClient();
  await sb.auth.resetPasswordForEmail(p.data.email, { redirectTo: `${await siteUrl()}/auth/callback?next=/settings` });
  // Same response whether or not the account exists (prevents account enumeration)
  return success(undefined, 'If an account exists for that email, a reset link is on its way.');
}

export async function updatePasswordAction(input: unknown): Promise<ActionResult> {
  const p = resetSchema.safeParse(input);
  if (!p.success) return fail('Use at least 8 characters.', flat(p.error));
  const a = await getActionUser(); if (!a) return UNAUTH;
  const { error } = await a.supabase.auth.updateUser({ password: p.data.password });
  return error ? fail('Could not update your password. Try again.') : success(undefined, 'Password updated.');
}

export async function logoutAction() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect('/');
}

/* --------------------------- transactions --------------------------- */
function txPayload(d: ReturnType<typeof transactionSchema.parse>) {
  return {
    title: d.title, amount: parseFloat(d.amount), type: d.type, category_id: d.category_id,
    transaction_date: d.transaction_date, payment_method: d.payment_method || null, merchant: d.merchant || null,
    notes: d.notes || null, tags: parseTags(d.tags),
  };
}

export async function saveTransactionAction(input: unknown, id?: string): Promise<ActionResult> {
  const p = transactionSchema.safeParse(input);
  if (!p.success) return fail('Check the highlighted fields.', flat(p.error));
  const a = await getActionUser(); if (!a) return UNAUTH;
  if (id && !uuid(id)) return fail('Invalid transaction.');
  const payload = txPayload(p.data);
  const { error } = id
    ? await a.supabase.from('transactions').update(payload).eq('id', id).eq('user_id', a.user.id)
    : await a.supabase.from('transactions').insert({ ...payload, user_id: a.user.id });
  if (error) return fail(safeDbError(error));
  refreshAll();
  return success(undefined, id ? 'Transaction updated' : 'Transaction added');
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  if (!uuid(id)) return fail('Invalid transaction.');
  const a = await getActionUser(); if (!a) return UNAUTH;
  const { error } = await a.supabase.from('transactions').delete().eq('id', id).eq('user_id', a.user.id);
  if (error) return fail(safeDbError(error));
  refreshAll();
  return success(undefined, 'Transaction deleted');
}

/* ------------------------------ budgets ----------------------------- */
export async function saveBudgetAction(input: unknown, id?: string): Promise<ActionResult> {
  const p = budgetSchema.safeParse(input);
  if (!p.success) return fail('Check the highlighted fields.', flat(p.error));
  const a = await getActionUser(); if (!a) return UNAUTH;
  const { from, to } = monthRange(p.data.month);
  const limit = parseFloat(p.data.limit_amount);
  const { error } = id && uuid(id)
    ? await a.supabase.from('budgets').update({ category_id: p.data.category_id, limit_amount: limit, period_start: from, period_end: to }).eq('id', id).eq('user_id', a.user.id)
    : await a.supabase.from('budgets').insert({ user_id: a.user.id, category_id: p.data.category_id, limit_amount: limit, period_start: from, period_end: to });
  if (error) return fail(error.code === '23505' ? 'You already have a budget for that category this month.' : safeDbError(error));
  refreshAll();
  return success(undefined, id ? 'Budget updated' : 'Budget created');
}

export async function deleteBudgetAction(id: string): Promise<ActionResult> {
  if (!uuid(id)) return fail('Invalid budget.');
  const a = await getActionUser(); if (!a) return UNAUTH;
  const { error } = await a.supabase.from('budgets').delete().eq('id', id).eq('user_id', a.user.id);
  if (error) return fail(safeDbError(error));
  refreshAll();
  return success(undefined, 'Budget deleted');
}

/* ------------------------------- goals ------------------------------ */
export async function saveGoalAction(input: unknown, id?: string): Promise<ActionResult> {
  const p = goalSchema.safeParse(input);
  if (!p.success) return fail('Check the highlighted fields.', flat(p.error));
  const a = await getActionUser(); if (!a) return UNAUTH;
  const target = parseFloat(p.data.target_amount);
  const current = p.data.current_amount ? parseFloat(p.data.current_amount) : 0;
  const payload = {
    name: p.data.name, target_amount: target, current_amount: current,
    target_date: p.data.target_date || null, description: p.data.description || null,
    status: current >= target ? 'completed' : 'active',
  };
  const { error } = id && uuid(id)
    ? await a.supabase.from('savings_goals').update(payload).eq('id', id).eq('user_id', a.user.id)
    : await a.supabase.from('savings_goals').insert({ ...payload, user_id: a.user.id });
  if (error) return fail(safeDbError(error));
  refreshAll();
  return success(undefined, id ? 'Goal updated' : 'Goal created');
}

/** Explicit, user-initiated contribution only. Nothing is auto-linked to expenses. */
export async function addGoalFundsAction(id: string, input: unknown): Promise<ActionResult> {
  const p = goalFundsSchema.safeParse(input);
  if (!p.success || !uuid(id)) return fail('Enter a valid amount.', p.success ? undefined : flat(p.error));
  const a = await getActionUser(); if (!a) return UNAUTH;
  const { data: g, error: gErr } = await a.supabase.from('savings_goals').select('current_amount, target_amount, status').eq('id', id).eq('user_id', a.user.id).maybeSingle();
  if (gErr || !g) return fail('Goal not found.');
  if (g.status === 'archived') return fail('Restore this goal before adding funds.');
  const next = round2(Number(g.current_amount) + parseFloat(p.data.amount));
  const { error } = await a.supabase.from('savings_goals')
    .update({ current_amount: next, status: next >= Number(g.target_amount) ? 'completed' : 'active' })
    .eq('id', id).eq('user_id', a.user.id);
  if (error) return fail(safeDbError(error));
  refreshAll();
  return success(undefined, 'Funds added to goal');
}

export async function setGoalArchivedAction(id: string, archived: boolean): Promise<ActionResult> {
  if (!uuid(id)) return fail('Invalid goal.');
  const a = await getActionUser(); if (!a) return UNAUTH;
  const { data: g } = await a.supabase.from('savings_goals').select('current_amount, target_amount').eq('id', id).eq('user_id', a.user.id).maybeSingle();
  if (!g) return fail('Goal not found.');
  const status = archived ? 'archived' : Number(g.current_amount) >= Number(g.target_amount) ? 'completed' : 'active';
  const { error } = await a.supabase.from('savings_goals').update({ status }).eq('id', id).eq('user_id', a.user.id);
  if (error) return fail(safeDbError(error));
  refreshAll();
  return success(undefined, archived ? 'Goal archived' : 'Goal restored');
}

/* ------------------------- settings / categories ------------------------- */
export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const p = profileSchema.safeParse(input);
  if (!p.success) return fail('Check the highlighted fields.', flat(p.error));
  const a = await getActionUser(); if (!a) return UNAUTH;
  const { error } = await a.supabase.from('profiles').update(p.data).eq('id', a.user.id);
  if (error) return fail(safeDbError(error));
  revalidatePath('/', 'layout');
  return success(undefined, 'Settings saved');
}

export async function createCategoryAction(input: unknown): Promise<ActionResult> {
  const p = customCategorySchema.safeParse(input);
  if (!p.success) return fail('Check the highlighted fields.', flat(p.error));
  const a = await getActionUser(); if (!a) return UNAUTH;
  const { error } = await a.supabase.from('categories').insert({ user_id: a.user.id, name: p.data.name, type: p.data.type, icon: 'Tag', color: '#8C8C8C', is_default: false });
  if (error) return fail(error.code === '23505' ? 'You already have a category with that name.' : safeDbError(error));
  revalidatePath('/settings'); revalidatePath('/transactions/new');
  return success(undefined, 'Category added');
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  if (!uuid(id)) return fail('Invalid category.');
  const a = await getActionUser(); if (!a) return UNAUTH;
  const { error } = await a.supabase.from('categories').delete().eq('id', id).eq('user_id', a.user.id);
  if (error) return fail(error.code === '23503' ? 'This category has transactions or budgets. Reassign or delete them first.' : safeDbError(error));
  revalidatePath('/settings');
  return success(undefined, 'Category deleted');
}
