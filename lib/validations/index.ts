import { z } from 'zod';
import { CURRENCIES } from '@/lib/utils';
import { MONTH_RE } from '@/lib/dates';

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Debit card', 'Credit card', 'Bank transfer', 'Net banking', 'Wallet', 'Other'] as const;

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date').refine((s) => !Number.isNaN(Date.parse(s)), 'Pick a valid date');
const optionalText = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`).optional().or(z.literal(''));

/** Amount is entered as text; validated as a positive number with at most 2 decimals. */
export const amountStr = z
  .string()
  .trim()
  .min(1, 'Enter an amount')
  .regex(/^\d{1,12}(\.\d{1,2})?$/, 'Use a positive number with up to 2 decimals')
  .refine((s) => parseFloat(s) > 0, 'Amount must be greater than zero');

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
export const signupSchema = z.object({
  full_name: z.string().trim().min(1, 'Enter your name').max(80),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(72, 'Use at most 72 characters'),
});
export const forgotSchema = z.object({ email: z.string().trim().email('Enter a valid email') });
export const resetSchema = z.object({ password: z.string().min(8, 'Use at least 8 characters').max(72) });

export const transactionSchema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(120, 'Keep it under 120 characters'),
  amount: amountStr,
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid('Choose a category'),
  transaction_date: dateStr,
  payment_method: z.string().max(40).optional().or(z.literal('')),
  merchant: optionalText(120),
  notes: optionalText(1000),
  tags: optionalText(200), // comma separated
});
export type TransactionForm = z.infer<typeof transactionSchema>;

export function parseTags(raw?: string): string[] {
  return Array.from(new Set((raw ?? '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))).slice(0, 10).map((t) => t.slice(0, 24));
}

export const transactionFiltersSchema = z.object({
  q: z.string().trim().max(80).optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().uuid().optional(),
  method: z.string().max(40).optional(),
  from: dateStr.optional(),
  to: dateStr.optional(),
  sort: z.enum(['transaction_date', 'amount', 'title']).default('transaction_date'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export const budgetSchema = z.object({
  category_id: z.string().uuid('Choose a category'),
  month: z.string().regex(MONTH_RE, 'Pick a month'),
  limit_amount: amountStr,
});

export const goalSchema = z.object({
  name: z.string().trim().min(1, 'Name your goal').max(80),
  target_amount: amountStr,
  current_amount: z.string().trim().regex(/^\d{1,12}(\.\d{1,2})?$/, 'Use a number with up to 2 decimals').optional().or(z.literal('')),
  target_date: dateStr.optional().or(z.literal('')),
  description: optionalText(300),
});
export const goalFundsSchema = z.object({ amount: amountStr });

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Enter your name').max(80),
  currency: z.enum(CURRENCIES),
  timezone: z.string().min(1).max(60).refine((tz) => {
    try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
  }, 'Unknown timezone'),
});

export const customCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name the category').max(40),
  type: z.enum(['income', 'expense']),
});
