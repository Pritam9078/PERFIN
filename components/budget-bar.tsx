import { budgetStatus } from '@/lib/analytics/calculations';
import { formatCurrency, cn } from '@/lib/utils';

const TONE = { ok: 'bg-lime', warn: 'bg-[#F6D743]', high: 'bg-[#FF9F5A]', over: 'bg-coral' } as const;
const NOTE = { ok: '', warn: 'Approaching your limit', high: 'Nearly at your limit', over: 'Over budget' } as const;

export function BudgetBar({ name, limit, spent, currency, thresholds, compact }: { name: string; limit: number; spent: number; currency: string; thresholds?: number[]; compact?: boolean }) {
  const s = budgetStatus(limit, spent, thresholds);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{name}</span>
        <span className="text-mute">{formatCurrency(spent, currency)} of {formatCurrency(limit, currency)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-valuenow={Math.min(100, Math.round(s.percent))} aria-valuemin={0} aria-valuemax={100} aria-label={`${name} budget used`}>
        <div className={cn('h-full rounded-full transition-[width] duration-700', TONE[s.level])} style={{ width: `${Math.min(100, s.percent)}%` }} />
      </div>
      {!compact && (
        <p className={cn('mt-1.5 text-xs', s.level === 'over' ? 'text-coral' : 'text-mute')}>
          {s.percent.toFixed(0)}% used · {s.remaining >= 0 ? `${formatCurrency(s.remaining, currency)} left` : `${formatCurrency(-s.remaining, currency)} over`}
          {NOTE[s.level] ? ` · ${NOTE[s.level]}` : ''}
        </p>
      )}
    </div>
  );
}
