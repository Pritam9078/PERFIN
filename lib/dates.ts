// Reporting periods are 'YYYY-MM' strings; DB dates are 'YYYY-MM-DD' in the user's timezone (DATE columns).
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function todayInTz(tz = 'Asia/Kolkata', now = new Date()): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export const currentMonth = (tz?: string, now?: Date) => todayInTz(tz, now).slice(0, 7);

export function parseMonth(m: string | undefined | null, tz?: string): string {
  return m && MONTH_RE.test(m) ? m : currentMonth(tz);
}

export function monthRange(month: string): { from: string; to: string; days: number } {
  const [y, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(days).padStart(2, '0')}`, days };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(month: string, style: 'long' | 'short' = 'long'): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: style, year: style === 'long' ? 'numeric' : undefined, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Days elapsed in the month for "average daily spend": full month if past, up to today if current. */
export function daysElapsed(month: string, today: string): number {
  const { days } = monthRange(month);
  if (month < today.slice(0, 7)) return days;
  if (month > today.slice(0, 7)) return 0;
  return Number(today.slice(8, 10));
}
