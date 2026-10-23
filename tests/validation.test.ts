import { describe, it, expect } from 'vitest';
import { transactionSchema, budgetSchema, goalSchema, loginSchema, signupSchema, parseTags, profileSchema } from '@/lib/validations';
import { csvCell, toCsv } from '@/lib/services/transactions';

const base = { title: 'Lunch', amount: '120.50', type: 'expense', category_id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301', transaction_date: '2026-10-14' };

describe('transaction validation', () => {
  it('accepts a valid transaction', () => expect(transactionSchema.safeParse(base).success).toBe(true));
  it.each(['0', '-5', 'abc', '', '1.234', '1e5', '10,5'])('rejects amount %j', (amount) => expect(transactionSchema.safeParse({ ...base, amount }).success).toBe(false));
  it('rejects missing title, bad category id, bad date, bad type', () => {
    expect(transactionSchema.safeParse({ ...base, title: '  ' }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, category_id: 'nope' }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, transaction_date: '14/10/2026' }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, type: 'transfer' }).success).toBe(false);
  });
  it('rejects absurdly long notes', () => expect(transactionSchema.safeParse({ ...base, notes: 'x'.repeat(1001) }).success).toBe(false));
  it('parses and dedupes tags', () => expect(parseTags(' Trip, work,trip ,,')).toEqual(['trip', 'work']));
});

describe('other schemas', () => {
  it('budget needs month + positive limit', () => {
    const ok = { category_id: base.category_id, month: '2026-10', limit_amount: '5000' };
    expect(budgetSchema.safeParse(ok).success).toBe(true);
    expect(budgetSchema.safeParse({ ...ok, month: '2026-13' }).success).toBe(false);
    expect(budgetSchema.safeParse({ ...ok, limit_amount: '0' }).success).toBe(false);
  });
  it('goal target must be positive', () => {
    expect(goalSchema.safeParse({ name: 'Trip', target_amount: '0' }).success).toBe(false);
    expect(goalSchema.safeParse({ name: 'Trip', target_amount: '1000', current_amount: '', target_date: '' }).success).toBe(true);
  });
  it('auth forms', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
    expect(signupSchema.safeParse({ full_name: 'A', email: 'a@b.co', password: 'short' }).success).toBe(false);
    expect(signupSchema.safeParse({ full_name: 'A', email: 'a@b.co', password: 'longenough1' }).success).toBe(true);
  });
  it('profile rejects unknown currency/timezone', () => {
    expect(profileSchema.safeParse({ full_name: 'A', currency: 'XYZ', timezone: 'UTC' }).success).toBe(false);
    expect(profileSchema.safeParse({ full_name: 'A', currency: 'INR', timezone: 'Not/AZone' }).success).toBe(false);
    expect(profileSchema.safeParse({ full_name: 'A', currency: 'INR', timezone: 'Asia/Kolkata' }).success).toBe(true);
  });
});

describe('CSV export', () => {
  it('escapes quotes, commas, newlines', () => expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"'));
  it('neutralises formula injection', () => { expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)"); expect(csvCell('@cmd')).toBe("'@cmd"); });
  it('produces header-only CSV for no rows (empty dataset)', () => expect(toCsv([]).split('\r\n')).toHaveLength(1));
});
