import { CategoryIcon } from '@/components/category-icon';
import { formatCurrency, cn } from '@/lib/utils';
import { formatDay } from '@/lib/dates';
import type { Transaction } from '@/lib/types';

export function TxRow({ tx, currency }: { tx: Transaction; currency: string }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-raised"><CategoryIcon name={tx.category?.icon} color={tx.category?.color} /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{tx.title}</p>
        <p className="truncate text-xs text-mute">{formatDay(tx.transaction_date)} · {tx.category?.name ?? 'Uncategorised'}</p>
      </div>
      <p className={cn('font-bold', tx.type === 'income' ? 'text-lime' : 'text-white')}>
        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
      </p>
    </li>
  );
}
