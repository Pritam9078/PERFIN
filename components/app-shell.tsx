'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Home, BarChart3, ArrowLeftRight, PiggyBank, Target, Plus, Settings, LogOut, TrendingDown, TrendingUp } from 'lucide-react';
import * as DM from '@radix-ui/react-dropdown-menu';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { logoutAction } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/goals', label: 'Goals', icon: Target },
];

export interface BudgetAlert { id: string; name: string; percent: number; level: 'warn' | 'high' | 'over' }

export function AppShell({ name, alerts, children }: { name: string; alerts: BudgetAlert[]; children: React.ReactNode }) {
  const path = usePathname();
  const active = (h: string) => path === h || path.startsWith(h + '/');
  const initials = (name || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto max-w-[1400px] px-3 pb-32 pt-3 sm:px-6 md:pb-24">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Logo href="/dashboard" />
        <nav aria-label="Primary" className="glass hidden rounded-full p-1.5 md:flex">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} prefetch={true} aria-current={active(href) ? 'page' : undefined}
              className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-95 touch-manipulation', active(href) ? 'bg-lime text-ink shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5')}>
              <Icon className="h-4 w-4" aria-hidden />{label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DM.Root>
            <DM.Trigger className="glass relative grid h-11 w-11 place-items-center rounded-full" aria-label={alerts.length ? `${alerts.length} budget alerts` : 'No budget alerts'}>
              <Bell className="h-4 w-4" />
              {alerts.length > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-ink" />}
            </DM.Trigger>
            <DM.Portal>
              <DM.Content align="end" sideOffset={8} className="glass z-50 w-72 rounded-2xl p-2">
                <p className="px-3 py-2 text-sm font-semibold">Budget alerts</p>
                {alerts.length === 0 ? <p className="px-3 pb-3 text-sm text-mute">All budgets are on track this month.</p> : alerts.map((a) => (
                  <DM.Item key={a.id} asChild>
                    <Link href="/budgets" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-white/5">
                      <span>{a.name}</span>
                      <span className={cn('font-semibold', a.level === 'over' ? 'text-coral' : 'text-lime')}>{a.percent.toFixed(0)}%{a.level === 'over' ? ' over limit' : ' used'}</span>
                    </Link>
                  </DM.Item>
                ))}
              </DM.Content>
            </DM.Portal>
          </DM.Root>
          <DM.Root>
            <DM.Trigger className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-lime to-cyan2 text-sm font-extrabold text-ink" aria-label="Open profile menu">{initials}</DM.Trigger>
            <DM.Portal>
              <DM.Content align="end" sideOffset={8} className="glass z-50 w-52 rounded-2xl p-2">
                <p className="truncate px-3 py-2 text-sm font-semibold">{name || 'Your account'}</p>
                <DM.Item asChild><Link href="/settings" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-white/5"><Settings className="h-4 w-4" />Settings</Link></DM.Item>
              <DM.Item asChild>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const sb = createClient();
                      await sb.auth.signOut();
                    } catch {}
                    try {
                      await logoutAction();
                    } catch {}
                    window.location.href = '/';
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-coral outline-none data-[highlighted]:bg-white/5 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />Sign out
                </button>
              </DM.Item>
            </DM.Content>
            </DM.Portal>
          </DM.Root>
        </div>
      </header>

      <main id="main">{children}</main>

      {/* Floating quick actions */}
      <QuickActions />

      {/* Mobile nav */}
      <nav aria-label="Primary mobile" className="glass fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full p-1.5 md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} prefetch={true} aria-current={active(href) ? 'page' : undefined} aria-label={label}
            className={cn('grid h-11 w-11 place-items-center rounded-full transition-all duration-150 active:scale-90 touch-manipulation', active(href) ? 'bg-lime text-ink shadow-sm' : 'text-white/60 active:bg-white/10')}>
            <Icon className="h-5 w-5" />
          </Link>
        ))}
      </nav>
    </div>
  );
}

function QuickActions() {
  return (
    <DM.Root>
      <DM.Trigger className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-lime text-ink shadow-lift transition-transform active:scale-90 hover:scale-105 md:bottom-8 md:right-8 cursor-pointer touch-manipulation" aria-label="Quick add">
        <Plus className="h-6 w-6" />
      </DM.Trigger>
      <DM.Portal>
        <DM.Content side="top" align="end" sideOffset={10} className="glass z-50 w-52 rounded-2xl p-2 animate-in fade-in zoom-in-95 duration-100">
          <DM.Item asChild><Link href="/transactions/new?type=expense" prefetch={true} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold outline-none active:scale-[0.98] data-[highlighted]:bg-white/5 transition-transform"><TrendingDown className="h-4 w-4 text-coral" />Add expense</Link></DM.Item>
          <DM.Item asChild><Link href="/transactions/new?type=income" prefetch={true} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold outline-none active:scale-[0.98] data-[highlighted]:bg-white/5 transition-transform"><TrendingUp className="h-4 w-4 text-lime" />Add income</Link></DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
