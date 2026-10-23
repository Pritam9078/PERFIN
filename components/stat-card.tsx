import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** `goodWhenUp`: income/savings rising is good; expenses rising is not. */
export function Delta({ value, goodWhenUp = true }: { value: number | null; goodWhenUp?: boolean }) {
  if (value === null) return <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-mute">No prior month</span>;
  const up = value > 0, flat = value === 0;
  const good = flat ? null : up === goodWhenUp;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', good === null ? 'bg-white/5 text-mute' : good ? 'bg-lime/15 text-lime' : 'bg-coral/15 text-coral')}
      aria-label={`${Math.abs(value)} percent ${flat ? 'unchanged' : up ? 'higher' : 'lower'} than last month`}>
      <Icon className="h-3 w-3" aria-hidden />{Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function StatCard({ title, value, delta, goodWhenUp, sub, index = 0, tone = 'default' }: {
  title: string; value: string; delta?: number | null; goodWhenUp?: boolean; sub?: string; index?: number; tone?: 'default' | 'income' | 'expense';
}) {
  return (
    <Card index={index} className="flex flex-col justify-between gap-4">
      <p className="text-base font-medium text-white/70">{title}</p>
      <div className="flex items-end justify-between gap-2">
        <p className={cn('text-3xl font-bold tracking-tight', tone === 'income' && 'text-lime', tone === 'expense' && 'text-coral')}>{value}</p>
        {delta !== undefined && <Delta value={delta} goodWhenUp={goodWhenUp} />}
      </div>
      {sub && <p className="-mt-2 text-xs text-mute">{sub}</p>}
    </Card>
  );
}
