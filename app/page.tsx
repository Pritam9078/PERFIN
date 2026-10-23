import Link from 'next/link';
import { ArrowRight, BarChart3, PiggyBank, ShieldCheck, Target, Download, ArrowLeftRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

const FEATURES = [
  { icon: ArrowLeftRight, title: 'Every rupee logged', body: 'Income and expenses with categories, tags, merchants and payment methods. Search and filter in a tap.' },
  { icon: PiggyBank, title: 'Budgets that stay honest', body: 'Spending is calculated from your transactions, never typed in by hand, so a budget can never drift from reality.' },
  { icon: BarChart3, title: 'Clear analytics', body: 'Savings rate, category mix, month-over-month change and cash flow, aggregated in the database.' },
  { icon: Target, title: 'Goals you fund on purpose', body: 'Only the money you add to a goal counts toward it. No guessing from your spending.' },
  { icon: ShieldCheck, title: 'Private by design', body: 'Row Level Security keeps your records visible to you alone, enforced in the database itself.' },
  { icon: Download, title: 'Your data, exportable', body: 'Download any filtered view as CSV whenever you like.' },
];

export default async function Landing() {
  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try { const sb = await createClient(); signedIn = !!(await sb.auth.getUser()).data.user; } catch { /* not signed in */ }
  }
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-6">
      <header className="flex items-center justify-between py-3">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Account">
          <ThemeToggle />
          {signedIn ? <Button asChild><Link href="/dashboard">Open dashboard</Link></Button> : (<>
            <Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button>
            <Button asChild><Link href="/signup">Get started</Link></Button>
          </>)}
        </nav>
      </header>
      <main id="main">
        <section className="py-20 sm:py-28">
          <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">Your money, in perspective.</h1>
          <p className="mt-6 max-w-xl text-lg text-white/70">PERFIN tracks what comes in and what goes out, shows how it compares month to month, and keeps your budgets and goals in one calm place.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="md" className="h-12 px-7 text-base"><Link href={signedIn ? '/dashboard' : '/signup'}>{signedIn ? 'Open dashboard' : 'Create free account'}<ArrowRight className="h-4 w-4" /></Link></Button>
            {!signedIn && <Button asChild variant="secondary" className="h-12 px-7 text-base"><Link href="/login">Sign in</Link></Button>}
          </div>
        </section>
        <section aria-label="Features" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Card key={title} index={i}>
              <span className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-lime/15 text-lime"><Icon className="h-5 w-5" /></span>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mute">{body}</p>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
