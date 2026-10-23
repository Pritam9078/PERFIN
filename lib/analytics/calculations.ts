import { percentChange, round2 } from '@/lib/utils';

export const savings = (income: number, expenses: number) => round2(income - expenses);

/** Savings rate as % of income; null when there is no income (undefined, not 0). */
export const savingsRate = (income: number, expenses: number): number | null =>
  income > 0 ? round2(((income - expenses) / income) * 100) : null;

export const averageDaily = (expenses: number, days: number): number => (days > 0 ? round2(expenses / days) : 0);

export { percentChange };

export interface BudgetStatus { percent: number; remaining: number; level: 'ok' | 'warn' | 'high' | 'over' }

/** thresholds default to 75/90/100; percent is uncapped so overspend is visible. */
export function budgetStatus(limit: number, spent: number, thresholds: number[] = [75, 90, 100]): BudgetStatus {
  const percent = limit > 0 ? round2((spent / limit) * 100) : 0;
  const [t1, t2, t3] = [...thresholds].sort((a, b) => a - b);
  const level = percent >= (t3 ?? 100) ? 'over' : percent >= (t2 ?? 90) ? 'high' : percent >= (t1 ?? 75) ? 'warn' : 'ok';
  return { percent, remaining: round2(limit - spent), level };
}

export function goalProgress(target: number, current: number) {
  const percent = target > 0 ? Math.min(100, round2((current / target) * 100)) : 0;
  return { percent, remaining: Math.max(0, round2(target - current)), done: current >= target };
}
