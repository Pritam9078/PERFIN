import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/services/auth';
import { monthSummary, categoryBreakdown, dailySeries, monthlySeries } from '@/lib/analytics/queries';
import { budgetsForMonth } from '@/lib/services/budgets';
import { currentMonth, monthRange, parseMonth } from '@/lib/dates';
import { formatCurrency, cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { MonthSwitcher } from '@/components/month-switcher';
import { Card, CardTitle, EmptyState, ErrorState } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { IncomeExpenseChart, CashflowChart, DonutChart, BudgetVsActualChart, DailySpendChart } from '@/components/charts/charts';

export const metadata: Metadata = { title: 'Analytics' };
const RANGES = [3, 6, 12] as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ month?: string; range?: string }> }) {
  const sp = await searchParams;
  const { supabase, profile } = await requireUser();
  const tz = profile.timezone, cur = profile.currency;
  const month = parseMonth(sp.month, tz);
  const range = (RANGES as readonly number[]).includes(Number(sp.range)) ? Number(sp.range) : 6;
  const { from, to } = monthRange(month);

  let d;
  try {
    const [s, breakdown, daily, monthly, budgets] = await Promise.all([
      monthSummary(supabase, month, tz), categoryBreakdown(supabase, from, to, 'expense'), dailySeries(supabase, from, to),
      monthlySeries(supabase, month, range), budgetsForMonth(supabase, month),
    ]);
    d = { s, breakdown, daily, monthly, budgets };
  } catch { return <><PageHeader title="Analytics" /><ErrorState /></>; }
  const { s, breakdown, daily, monthly, budgets } = d;
  const empty = s.income === 0 && s.expenses === 0;

  return (
    <>
      <PageHeader title="Analytics" subtitle={`${from} to ${to}`}>
        <MonthSwitcher month={month} maxMonth={currentMonth(tz)} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} title="Income" tone="income" value={formatCurrency(s.income, cur)} delta={s.changes.income} goodWhenUp sub="vs last month" />
        <StatCard index={1} title="Expenses" tone="expense" value={formatCurrency(s.expenses, cur)} delta={s.changes.expenses} goodWhenUp={false} sub="vs last month" />
        <StatCard index={2} title="Savings rate" value={s.savingsRate === null ? 'No income' : `${s.savingsRate.toFixed(1)}%`} sub={`Net ${formatCurrency(s.savings, cur)}`} />
        <StatCard index={3} title="Average daily spend" value={formatCurrency(s.avgDaily, cur)} sub="Expenses divided by days elapsed" />
      </div>

      {empty ? (
        <Card tilt={false} className="mt-4"><EmptyState title="No activity this month" body="Switch months above or add a transaction to see analytics." action={<Link href="/transactions/new" className="text-lime underline">Add a transaction</Link>} /></Card>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Card index={4} className="lg:col-span-8">
            <CardTitle>Income vs expenses by day</CardTitle>
            <IncomeExpenseChart data={daily} currency={cur} />
          </Card>
          <Card index={5} className="lg:col-span-4">
            <CardTitle>Category distribution</CardTitle>
            {breakdown.length === 0 ? <p className="text-sm text-mute">No expenses this month.</p> : <DonutChart data={breakdown} currency={cur} total={s.expenses} />}
          </Card>
          <Card index={6} className="lg:col-span-12">
            <CardTitle action={
              <div className="glass flex rounded-full p-1" role="group" aria-label="Trend period">
                {RANGES.map((r) => <Link key={r} href={`/analytics?month=${month}&range=${r}`} aria-current={range === r ? 'true' : undefined} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold', range === r ? 'bg-lime text-ink' : 'text-white/60')}>{r} mo</Link>)}
              </div>
            }>Trend over {range} months</CardTitle>
            <div className="grid gap-6 lg:grid-cols-2">
              <IncomeExpenseChart data={monthly} currency={cur} />
              <CashflowChart data={monthly} currency={cur} />
            </div>
          </Card>
          <Card index={7} className="lg:col-span-6">
            <CardTitle>Highest-spending categories</CardTitle>
            {breakdown.length === 0 ? <p className="text-sm text-mute">Nothing spent.</p> : (
              <ol className="space-y-3">{breakdown.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{c.name}</span><span>{formatCurrency(c.total, cur)} <span className="text-mute">· {c.percent.toFixed(0)}%</span></span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full" style={{ width: `${c.percent}%`, background: c.color }} /></div>
                </li>))}</ol>
            )}
          </Card>
          <Card index={8} className="lg:col-span-6">
            <CardTitle>Budget vs actual</CardTitle>
            {budgets.length === 0 ? <EmptyState title="No budgets this month" body="Create budgets to compare them with real spending." action={<Link href={`/budgets?month=${month}`} className="text-lime underline">Go to budgets</Link>} /> : <BudgetVsActualChart data={budgets.map((b) => ({ name: b.category_name, limit: b.limit_amount, spent: b.spent }))} currency={cur} />}
          </Card>
          <Card index={9} className="lg:col-span-12">
            <CardTitle>Daily spending</CardTitle>
            <DailySpendChart data={daily} currency={cur} />
          </Card>
        </div>
      )}
    </>
  );
}
