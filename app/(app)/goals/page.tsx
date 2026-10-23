import type { Metadata } from 'next';
import { requireUser } from '@/lib/services/auth';
import { listGoals } from '@/lib/services/goals';
import { goalProgress } from '@/lib/analytics/calculations';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Card, EmptyState, ErrorState } from '@/components/ui/card';
import { GoalDialog, AddFundsDialog, ArchiveButton } from '@/components/forms/goal-dialogs';

export const metadata: Metadata = { title: 'Goals' };

export default async function GoalsPage() {
  const { supabase, profile } = await requireUser();
  const cur = profile.currency;
  let goals;
  try { goals = await listGoals(supabase, true); } catch { return <><PageHeader title="Goals" /><ErrorState /></>; }
  const live = goals.filter((g) => g.status !== 'archived');
  const archived = goals.filter((g) => g.status === 'archived');

  const GoalCard = ({ g, i }: { g: (typeof goals)[number]; i: number }) => {
    const p = goalProgress(g.target_amount, g.current_amount);
    return (
      <Card index={i}>
        <div className="flex items-start justify-between gap-2">
          <div><h2 className="text-lg font-semibold">{g.name}</h2>{g.description && <p className="mt-0.5 text-sm text-mute">{g.description}</p>}</div>
          {g.status !== 'archived' && <GoalDialog goal={g} />}
        </div>
        <p className="mt-5 text-3xl font-bold tracking-tight">{formatCurrency(g.current_amount, cur)}<span className="text-lg font-medium text-mute"> / {formatCurrency(g.target_amount, cur)}</span></p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-valuenow={Math.round(p.percent)} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.name} progress`}>
          <div className="h-full rounded-full bg-gradient-to-r from-lime to-cyan2" style={{ width: `${p.percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-mute">{p.done ? 'Goal reached' : `${p.percent.toFixed(0)}% · ${formatCurrency(p.remaining, cur)} to go`}{g.target_date ? ` · by ${g.target_date}` : ''}</p>
        <div className="mt-4 flex items-center gap-2">
          {g.status === 'active' && <AddFundsDialog goalId={g.id} name={g.name} />}
          <ArchiveButton goalId={g.id} archived={g.status === 'archived'} />
        </div>
      </Card>
    );
  };

  return (
    <>
      <PageHeader title="Savings goals" subtitle="Only the funds you add to a goal count toward it."><GoalDialog /></PageHeader>
      {live.length === 0 ? <Card tilt={false}><EmptyState title="No goals yet" body="Name something you are saving for and set a target." action={<GoalDialog />} /></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{live.map((g, i) => <GoalCard key={g.id} g={g} i={i} />)}</div>
      )}
      {archived.length > 0 && (<>
        <h2 className="mb-3 mt-10 text-lg font-semibold text-white/70">Archived</h2>
        <div className="grid gap-4 opacity-70 md:grid-cols-2 xl:grid-cols-3">{archived.map((g, i) => <GoalCard key={g.id} g={g} i={i} />)}</div>
      </>)}
    </>
  );
}
