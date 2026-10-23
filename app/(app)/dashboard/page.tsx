import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, Plus, TrendingUp } from 'lucide-react';
import { requireUser } from '@/lib/services/auth';
import { monthSummary, categoryBreakdown, dailySeries, monthlySeries } from '@/lib/analytics/queries';
import { budgetsForMonth } from '@/lib/services/budgets';
import { listGoals } from '@/lib/services/goals';
import { recentTransactions } from '@/lib/services/transactions';
import { currentMonth, monthRange, parseMonth, todayInTz } from '@/lib/dates';
import { goalProgress } from '@/lib/analytics/calculations';
import { formatCurrency } from '@/lib/utils';
import { Card, CardTitle, EmptyState, ErrorState } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard, Delta } from '@/components/stat-card';
import { PageHeader } from '@/components/page-header';
import { MonthSwitcher } from '@/components/month-switcher';
import { BudgetBar } from '@/components/budget-bar';
import { TxRow } from '@/components/tx-row';
import { IncomeExpenseChart, CashflowChart, DailySpendChart, DonutChart } from '@/components/charts/charts';

export const metadata: Metadata = { title: 'Dashboard' };

function greeting(tz: string) {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: tz }).format(new Date()));
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { supabase, profile } = await requireUser();
  const tz = profile.timezone, cur = profile.currency;
  const month = parseMonth((await searchParams).month, tz);
  const { from, to } = monthRange(month);
  const thisMonth = currentMonth(tz);
  const first = (profile.full_name ?? '').split(' ')[0];
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz }).format(new Date());

  const load = async () => {
    const [summary, breakdown, daily, monthly, budgets, goals, recent] = await Promise.all([
      monthSummary(supabase, month, tz), categoryBreakdown(supabase, from, to, 'expense'), dailySeries(supabase, from, to),
      monthlySeries(supabase, month, 6), budgetsForMonth(supabase, month), listGoals(supabase), recentTransactions(supabase, 6),
    ]);
    return { summary, breakdown, daily, monthly, budgets, goals, recent };
  };
  let data: Awaited<ReturnType<typeof load>>;
  try {
    data = await load();
  } catch {
    return <><PageHeader title={`${greeting(tz)}${first ? `, ${first}` : ''}`} subtitle={dateLabel} /><ErrorState /></>;
  }
  const { summary: s, breakdown, daily, monthly, budgets, goals, recent } = data;
  const maxDaily = Math.max(1, ...daily.map((d) => d.expenses));
  const hasTx = s.income > 0 || s.expenses > 0 || recent.length > 0;

  return (
    <>
      <PageHeader title={`${greeting(tz)}${first ? `, ${first}` : ''}`} subtitle={dateLabel}>
        <MonthSwitcher month={month} maxMonth={thisMonth} />
        <Button asChild variant="secondary"><Link href="/transactions/new?type=income"><TrendingUp className="h-4 w-4 text-lime" />Add income</Link></Button>
        <Button asChild><Link href="/transactions/new?type=expense"><Plus className="h-4 w-4" />Add expense</Link></Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Hero: tracked balance */}
        <Card index={0} className="relative overflow-hidden border-0 bg-gradient-to-br from-[#E2FF1F] via-[#7BE495] to-[#1FC8E3] p-6 text-slate-950 sm:p-8 lg:col-span-5 shadow-float" tilt>
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-bold text-slate-950">Tracked balance</h2>
            <Link href="/transactions" aria-label="View all transactions" className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white hover:bg-black transition-colors"><ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <p className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl text-slate-950">{formatCurrency(s.trackedBalance, cur)}</p>
          <p className="mt-2 max-w-xs text-sm font-medium text-slate-950/80">Income minus expenses you have logged up to the end of {month}. Not synced with any bank.</p>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="flex gap-2">
              <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white shadow-sm">{formatCurrency(s.savings, cur, { signed: true })} this month</span>
            </div>
            <div className="flex h-12 items-end gap-[3px]" role="img" aria-label="Daily spending this month">
              {daily.map((d) => <span key={d.date} className="w-[4px] rounded-full bg-slate-950/80" style={{ height: `${Math.max(6, (d.expenses / maxDaily) * 100)}%` }} />)}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:col-span-3">
          <StatCard index={1} title="Income" tone="income" value={formatCurrency(s.income, cur)} delta={s.changes.income} goodWhenUp sub="vs last month" />
          <StatCard index={2} title="Expenses" tone="expense" value={formatCurrency(s.expenses, cur)} delta={s.changes.expenses} goodWhenUp={false} sub="vs last month" />
        </div>

        <Card index={3} className="flex flex-col justify-between lg:col-span-4">
          <div className="flex items-start justify-between"><h2 className="text-lg font-semibold text-white/90">Net savings</h2><Delta value={s.changes.savings} /></div>
          <div>
            <p className={`mt-4 text-4xl font-bold tracking-tight ${s.savings < 0 ? 'text-coral' : ''}`}>{formatCurrency(s.savings, cur)}</p>
            <p className="mt-1 text-sm text-mute">Income minus expenses for {month}</p>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-chip bg-raised p-3"><dt className="text-mute">Savings rate</dt><dd className="mt-0.5 text-lg font-bold">{s.savingsRate === null ? 'No income' : `${s.savingsRate.toFixed(0)}%`}</dd></div>
            <div className="rounded-chip bg-raised p-3"><dt className="text-mute">Avg. daily spend</dt><dd className="mt-0.5 text-lg font-bold">{formatCurrency(s.avgDaily, cur)}</dd></div>
          </dl>
        </Card>

        {!hasTx && (
          <Card index={4} className="lg:col-span-12">
            <EmptyState title="Your dashboard is ready" body="Add your first income or expense and every chart and total here will fill in." action={<Button asChild><Link href="/transactions/new?type=expense"><Plus className="h-4 w-4" />Add a transaction</Link></Button>} />
          </Card>
        )}

        <Card index={4} className="lg:col-span-8">
          <CardTitle>Income vs expenses</CardTitle>
          <p className="-mt-3 mb-3 text-xs text-mute">Daily, {month}</p>
          <IncomeExpenseChart data={daily} currency={cur} />
        </Card>

        <Card index={5} className="lg:col-span-4">
          <CardTitle action={<Link href="/analytics" className="text-sm text-mute hover:text-white">Details</Link>}>Spending by category</CardTitle>
          {breakdown.length === 0 ? <EmptyState title="No spending yet" body="Expenses logged this month will be broken down here." /> : <DonutChart data={breakdown} currency={cur} total={s.expenses} />}
        </Card>

        <Card index={6} className="lg:col-span-4">
          <CardTitle>Daily spending</CardTitle>
          <DailySpendChart data={daily} currency={cur} />
        </Card>

        <Card index={7} className="lg:col-span-4">
          <CardTitle>Monthly cash flow</CardTitle>
          <p className="-mt-3 mb-3 text-xs text-mute">Net income minus expenses, last 6 months</p>
          <CashflowChart data={monthly} currency={cur} />
        </Card>

        <Card index={8} className="lg:col-span-4">
          <CardTitle action={<Link href="/transactions" className="text-sm text-mute hover:text-white">See all</Link>}>Recent transactions</CardTitle>
          {recent.length === 0 ? <EmptyState title="No transactions" body="Your latest activity shows up here." /> : <ul className="divide-y divide-line">{recent.map((t) => <TxRow key={t.id} tx={t} currency={cur} />)}</ul>}
        </Card>

        <Card index={9} className="lg:col-span-6">
          <CardTitle action={<Link href={`/budgets?month=${month}`} className="text-sm text-mute hover:text-white">Manage</Link>}>Budgets</CardTitle>
          {budgets.length === 0 ? <EmptyState title="No budgets for this month" body="Set a limit for a category to track it here." action={<Button asChild variant="secondary" size="sm"><Link href={`/budgets?month=${month}`}>Create budget</Link></Button>} /> : (
            <div className="space-y-5">{budgets.slice(0, 4).map((b) => <BudgetBar key={b.id} name={b.category_name} limit={b.limit_amount} spent={b.spent} currency={cur} thresholds={profile.alert_thresholds} compact />)}</div>
          )}
        </Card>

        <Card index={10} className="lg:col-span-3">
          <CardTitle>Top categories</CardTitle>
          {breakdown.length === 0 ? <p className="text-sm text-mute">Nothing spent yet.</p> : (
            <ol className="space-y-3">{breakdown.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /><span className="truncate">{c.name}</span><span className="ml-auto font-semibold">{formatCurrency(c.total, cur, { compact: true })}</span></li>
            ))}</ol>
          )}
        </Card>

        <Card index={11} className="lg:col-span-3">
          <CardTitle action={<Link href="/goals" className="text-sm text-mute hover:text-white">All</Link>}>Goals</CardTitle>
          {goals.length === 0 ? <p className="text-sm text-mute">No goals yet.</p> : (
            <div className="space-y-4">{goals.slice(0, 3).map((g) => { const p = goalProgress(g.target_amount, g.current_amount); return (
              <div key={g.id}><div className="mb-1.5 flex justify-between text-sm"><span className="truncate font-semibold">{g.name}</span><span className="text-mute">{p.percent.toFixed(0)}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-lime" style={{ width: `${p.percent}%` }} /></div></div>); })}</div>
          )}
        </Card>
      </div>
    </>
  );
}
