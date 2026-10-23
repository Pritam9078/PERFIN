/**
 * RLS + database integration tests. They run against a REAL Supabase project (use a throwaway/local one).
 * Skipped automatically unless these env vars are set:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * The service-role key is used ONLY here, to create two disposable users, and is never used by the app.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const run = URL && ANON && SERVICE ? describe : describe.skip;

run('row level security', () => {
  let admin: SupabaseClient; // created in beforeAll so skipped runs never touch env vars
  const stamp = Date.now();
  const users = [0, 1].map((i) => ({ email: `perfin-test-${stamp}-${i}@example.com`, password: 'Test-pass-12345', id: '' }));
  let a: SupabaseClient, b: SupabaseClient;
  let expenseCat = '', incomeCat = '', txA = '', goalA = '', budgetA = '';

  const signIn = async (u: (typeof users)[number]) => {
    const c = createClient(URL!, ANON!, { auth: { persistSession: false } });
    const { error } = await c.auth.signInWithPassword({ email: u.email, password: u.password });
    if (error) throw error;
    return c;
  };

  beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } });
    for (const u of users) {
      const { data, error } = await admin.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true, user_metadata: { full_name: 'Test' } });
      if (error) throw error;
      u.id = data.user.id;
    }
    [a, b] = await Promise.all(users.map(signIn));
    expenseCat = (await a.from('categories').select('id').eq('type', 'expense').is('user_id', null).limit(1).single()).data!.id;
    incomeCat = (await a.from('categories').select('id').eq('type', 'income').is('user_id', null).limit(1).single()).data!.id;
    txA = (await a.from('transactions').insert({ user_id: users[0].id, category_id: expenseCat, title: 'A secret', amount: 10, type: 'expense', transaction_date: '2026-10-01' }).select('id').single()).data!.id;
    goalA = (await a.from('savings_goals').insert({ user_id: users[0].id, name: 'A goal', target_amount: 100 }).select('id').single()).data!.id;
    budgetA = (await a.from('budgets').insert({ user_id: users[0].id, category_id: expenseCat, period_start: '2026-10-01', period_end: '2026-10-31', limit_amount: 500 }).select('id').single()).data!.id;
  });

  afterAll(async () => { for (const u of users) if (u.id) await admin.auth.admin.deleteUser(u.id); });

  it('profile is created on signup', async () => expect((await a.from('profiles').select('id').eq('id', users[0].id)).data).toHaveLength(1));

  it("user B cannot read user A's rows", async () => {
    expect((await b.from('transactions').select('id').eq('id', txA)).data).toHaveLength(0);
    expect((await b.from('savings_goals').select('id').eq('id', goalA)).data).toHaveLength(0);
    expect((await b.from('budgets').select('id').eq('id', budgetA)).data).toHaveLength(0);
    expect((await b.from('profiles').select('id').eq('id', users[0].id)).data).toHaveLength(0);
  });

  it("user B cannot update or delete user A's rows", async () => {
    await b.from('transactions').update({ title: 'hacked' }).eq('id', txA);
    await b.from('transactions').delete().eq('id', txA);
    await b.from('savings_goals').update({ current_amount: 99 }).eq('id', goalA);
    const t = await a.from('transactions').select('title').eq('id', txA).single();
    expect(t.data?.title).toBe('A secret');
    expect((await a.from('savings_goals').select('current_amount').eq('id', goalA).single()).data?.current_amount).toBe(0);
  });

  it('user B cannot insert rows owned by user A', async () => {
    const r = await b.from('transactions').insert({ user_id: users[0].id, category_id: expenseCat, title: 'x', amount: 1, type: 'expense', transaction_date: '2026-10-01' });
    expect(r.error).not.toBeNull();
  });

  it("user B cannot use user A's private category", async () => {
    const { data: cat } = await a.from('categories').insert({ user_id: users[0].id, name: `Private ${stamp}`, type: 'expense' }).select('id').single();
    const r = await b.from('transactions').insert({ user_id: users[1].id, category_id: cat!.id, title: 'x', amount: 1, type: 'expense', transaction_date: '2026-10-01' });
    expect(r.error).not.toBeNull();
    expect((await b.from('categories').select('id').eq('id', cat!.id)).data).toHaveLength(0);
  });

  it('default categories are readable but not modifiable', async () => {
    expect((await b.from('categories').select('id').eq('id', expenseCat)).data).toHaveLength(1);
    await b.from('categories').update({ name: 'Hacked' }).eq('id', expenseCat);
    await b.from('categories').delete().eq('id', expenseCat);
    expect((await b.from('categories').select('name').eq('id', expenseCat).single()).data?.name).not.toBe('Hacked');
    expect((await b.from('categories').insert({ user_id: null, name: 'Global', type: 'expense', is_default: true })).error).not.toBeNull();
  });

  it('category type must match transaction type; amount must be positive', async () => {
    expect((await a.from('transactions').insert({ user_id: users[0].id, category_id: incomeCat, title: 'x', amount: 1, type: 'expense', transaction_date: '2026-10-01' })).error).not.toBeNull();
    expect((await a.from('transactions').insert({ user_id: users[0].id, category_id: expenseCat, title: 'x', amount: 0, type: 'expense', transaction_date: '2026-10-01' })).error).not.toBeNull();
  });

  it('prevents duplicate budgets for the same category and period', async () => {
    const r = await a.from('budgets').insert({ user_id: users[0].id, category_id: expenseCat, period_start: '2026-10-01', period_end: '2026-10-31', limit_amount: 1 });
    expect(r.error?.code).toBe('23505');
  });

  it('budget spend is derived from transactions and recalculates', async () => {
    const get = async () => Number((await a.rpc('budget_progress', { p_start: '2026-10-01', p_end: '2026-10-31' })).data.find((x: any) => x.id === budgetA).spent);
    expect(await get()).toBe(10);
    const { data } = await a.from('transactions').insert({ user_id: users[0].id, category_id: expenseCat, title: 'more', amount: 15.5, type: 'expense', transaction_date: '2026-10-05' }).select('id').single();
    expect(await get()).toBe(25.5);
    await a.from('transactions').delete().eq('id', data!.id);
    expect(await get()).toBe(10);
  });

  it("analytics RPCs only see the caller's data, and handle empty periods", async () => {
    const mine = await a.rpc('period_totals', { p_from: '2026-10-01', p_to: '2026-10-31' });
    const theirs = await b.rpc('period_totals', { p_from: '2026-10-01', p_to: '2026-10-31' });
    expect(Number(mine.data[0].expenses)).toBeGreaterThan(0);
    expect(Number(theirs.data[0].expenses)).toBe(0);
  });

  it('anonymous clients see nothing', async () => {
    const anon = createClient(URL!, ANON!, { auth: { persistSession: false } });
    expect((await anon.from('transactions').select('id')).data ?? []).toHaveLength(0);
    expect((await anon.rpc('period_totals', { p_from: '2026-10-01', p_to: '2026-10-31' })).error).not.toBeNull();
  });
});
