import type { Metadata } from 'next';
import { requireUser } from '@/lib/services/auth';
import { listCategories } from '@/lib/services/categories';
import { budgetsForMonth } from '@/lib/services/budgets';
import { currentMonth, parseMonth } from '@/lib/dates';
import { budgetStatus } from '@/lib/analytics/calculations';
import { deleteBudgetAction } from '@/app/actions';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { MonthSwitcher } from '@/components/month-switcher';
import { Card, EmptyState, ErrorState } from '@/components/ui/card';
import { BudgetBar } from '@/components/budget-bar';
import { BudgetDialog } from '@/components/forms/budget-dialog';
import { ConfirmDelete } from '@/components/confirm-delete';

export const metadata: Metadata = { title: 'Budgets' };

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { supabase, profile } = await requireUser();
  const month = parseMonth((await searchParams).month, profile.timezone);
  const cur = profile.currency;
  let budgets, categories;
  try { [budgets, categories] = await Promise.all([budgetsForMonth(supabase, month), listCategories(supabase)]); }
  catch { return <><PageHeader title="Budgets" /><ErrorState /></>; }
  const totalLimit = budgets.reduce((a, b) => a + b.limit_amount, 0);
  const totalSpent = budgets.reduce((a, b) => a + b.spent, 0);
  const t = budgetStatus(totalLimit, totalSpent, profile.alert_thresholds);

  return (
    <>
      <PageHeader title="Budgets" subtitle="Spending is calculated from your logged expenses, so it is always current.">
        <MonthSwitcher month={month} maxMonth={currentMonth(profile.timezone)} />
        <BudgetDialog categories={categories} month={month} />
      </PageHeader>
      {budgets.length > 0 && (
        <Card index={0} className="mb-4">
          <BudgetBar name="All budgets combined" limit={totalLimit} spent={totalSpent} currency={cur} thresholds={profile.alert_thresholds} />
          <p className="mt-3 text-xs text-mute">{t.remaining >= 0 ? `${formatCurrency(t.remaining, cur)} left across ${budgets.length} budgets` : `${formatCurrency(-t.remaining, cur)} over across ${budgets.length} budgets`}</p>
        </Card>
      )}
      {budgets.length === 0 ? (
        <Card tilt={false}><EmptyState title="No budgets for this month" body="Pick an expense category and set a monthly limit. Warnings appear at 75%, 90% and 100%." action={<BudgetDialog categories={categories} month={month} />} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((b, i) => (
            <Card key={b.id} index={i + 1}>
              <div className="mb-4 flex items-center justify-end gap-1">
                <BudgetDialog categories={categories} month={month} budget={{ id: b.id, category_id: b.category_id, limit_amount: b.limit_amount }} />
                <ConfirmDelete label={`Delete ${b.category_name} budget`} title="Delete this budget?" body="Your transactions are not affected." onConfirm={async () => { 'use server'; return deleteBudgetAction(b.id); }} />
              </div>
              <BudgetBar name={b.category_name} limit={b.limit_amount} spent={b.spent} currency={cur} thresholds={profile.alert_thresholds} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
