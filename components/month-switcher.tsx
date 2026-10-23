'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, shiftMonth } from '@/lib/dates';

export function MonthSwitcher({ month, maxMonth }: { month: string; maxMonth: string }) {
  const path = usePathname();
  const sp = useSearchParams();
  const href = (m: string) => { const p = new URLSearchParams(sp.toString()); p.set('month', m); return `${path}?${p.toString()}`; };
  const next = shiftMonth(month, 1);
  return (
    <div className="glass flex items-center rounded-full p-1" role="group" aria-label="Reporting month">
      <Link href={href(shiftMonth(month, -1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/5" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Link>
      <span className="min-w-[8.5rem] text-center text-sm font-semibold" aria-live="polite">{monthLabel(month)}</span>
      {next <= maxMonth
        ? <Link href={href(next)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/5" aria-label="Next month"><ChevronRight className="h-4 w-4" /></Link>
        : <span className="grid h-9 w-9 place-items-center rounded-full opacity-30" aria-hidden><ChevronRight className="h-4 w-4" /></span>}
    </div>
  );
}
