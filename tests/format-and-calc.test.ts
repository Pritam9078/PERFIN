import { describe, it, expect } from 'vitest';
import { formatCurrency, round2, percentChange, num } from '@/lib/utils';
import { monthRange, shiftMonth, daysElapsed, parseMonth, todayInTz } from '@/lib/dates';
import { savings, savingsRate, averageDaily, budgetStatus, goalProgress } from '@/lib/analytics/calculations';

describe('currency formatting', () => {
  it('formats INR with Indian grouping', () => expect(formatCurrency(1234567.5, 'INR')).toBe('₹12,34,567.50'));
  it('formats USD', () => expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50'));
  it('handles negatives and signs', () => {
    expect(formatCurrency(-50, 'USD')).toBe('-$50.00');
    expect(formatCurrency(50, 'USD', { signed: true })).toBe('+$50.00');
  });
  it('falls back to INR for unknown currency and NaN to zero', () => {
    expect(formatCurrency(NaN, 'XXX')).toBe('₹0.00');
  });
  it('JPY has no decimals', () => expect(formatCurrency(1500, 'JPY')).toMatch(/1,500$/));
  it('num parses NUMERIC strings', () => { expect(num('12.30')).toBe(12.3); expect(num(null)).toBe(0); });
});

describe('financial calculations', () => {
  it('savings = income - expenses', () => expect(savings(5000, 3200.25)).toBe(1799.75));
  it('savings rate is null with no income', () => expect(savingsRate(0, 100)).toBeNull());
  it('savings rate can be negative', () => expect(savingsRate(1000, 1500)).toBe(-50));
  it('average daily spend', () => { expect(averageDaily(300, 30)).toBe(10); expect(averageDaily(300, 0)).toBe(0); });
  it('percent change handles zero prior', () => { expect(percentChange(150, 100)).toBe(50); expect(percentChange(50, 0)).toBeNull(); });
  it('avoids float drift', () => expect(round2(0.1 + 0.2)).toBe(0.3));
  it('budget thresholds', () => {
    expect(budgetStatus(100, 50).level).toBe('ok');
    expect(budgetStatus(100, 75).level).toBe('warn');
    expect(budgetStatus(100, 90).level).toBe('high');
    expect(budgetStatus(100, 100).level).toBe('over');
    const o = budgetStatus(100, 130);
    expect(o.percent).toBe(130); expect(o.remaining).toBe(-30);
  });
  it('goal progress caps at 100%', () => {
    expect(goalProgress(1000, 250)).toEqual({ percent: 25, remaining: 750, done: false });
    expect(goalProgress(1000, 1200)).toEqual({ percent: 100, remaining: 0, done: true });
  });
});

describe('dates and month boundaries', () => {
  it('month ranges incl. leap year', () => {
    expect(monthRange('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28', days: 28 });
    expect(monthRange('2028-02').to).toBe('2028-02-29');
    expect(monthRange('2026-12').to).toBe('2026-12-31');
  });
  it('shifts across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
  it('rejects bad month params', () => expect(parseMonth('2026-13', 'UTC')).toMatch(/^\d{4}-\d{2}$/));
  it('days elapsed: past, current, future', () => {
    expect(daysElapsed('2026-01', '2026-10-14')).toBe(31);
    expect(daysElapsed('2026-10', '2026-10-14')).toBe(14);
    expect(daysElapsed('2026-11', '2026-10-14')).toBe(0);
  });
  it('today respects timezone at the day boundary', () => {
    const t = new Date('2026-10-14T20:00:00Z'); // 01:30 next day in Kolkata
    expect(todayInTz('UTC', t)).toBe('2026-10-14');
    expect(todayInTz('Asia/Kolkata', t)).toBe('2026-10-15');
  });
});
