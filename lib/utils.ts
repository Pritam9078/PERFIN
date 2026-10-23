import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'] as const;
export type Currency = (typeof CURRENCIES)[number];

const LOCALE: Record<Currency, string> = {
  INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', JPY: 'ja-JP', AUD: 'en-AU', CAD: 'en-CA', SGD: 'en-SG', AED: 'en-AE',
};

export function formatCurrency(amount: number, currency: string = 'INR', opts: { compact?: boolean; signed?: boolean } = {}): string {
  const cur = (CURRENCIES as readonly string[]).includes(currency) ? (currency as Currency) : 'INR';
  const safe = Number.isFinite(amount) ? amount : 0;
  const base = new Intl.NumberFormat(LOCALE[cur], {
    style: 'currency',
    currency: cur,
    notation: opts.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts.compact ? 1 : cur === 'JPY' ? 0 : 2,
  }).format(Math.abs(safe));
  if (safe < 0) return `-${base}`;
  if (opts.signed && safe > 0) return `+${base}`;
  return base;
}

/** Round to 2 decimals safely (cents-level) */
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** NUMERIC arrives from PostgREST as number or string; normalise. */
export const num = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return round2(((current - previous) / Math.abs(previous)) * 100);
}
