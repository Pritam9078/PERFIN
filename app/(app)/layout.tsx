import { AppShell, type BudgetAlert } from '@/components/app-shell';
import { requireUser } from '@/lib/services/auth';
import { budgetsForMonth } from '@/lib/services/budgets';
import { budgetStatus } from '@/lib/analytics/calculations';
import { currentMonth } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireUser();
  let alerts: BudgetAlert[] = [];
  try {
    const budgets = await budgetsForMonth(supabase, currentMonth(profile.timezone));
    alerts = budgets.flatMap((b) => {
      const s = budgetStatus(b.limit_amount, b.spent, profile.alert_thresholds);
      return s.level === 'ok' ? [] : [{ id: b.id, name: b.category_name, percent: s.percent, level: s.level }];
    });
  } catch { /* alerts are non-critical */ }
  return <AppShell name={profile.full_name ?? ''} alerts={alerts}>{children}</AppShell>;
}
