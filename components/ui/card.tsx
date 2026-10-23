'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Spatial card: lifts on hover and tilts a few degrees toward the pointer. Tilt is off for reduced motion and touch. */
export function Card({ className, tilt = true, index = 0, children, ...p }: React.HTMLAttributes<HTMLDivElement> & { tilt?: boolean; index?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const allowed = React.useRef(true);
  React.useEffect(() => {
    allowed.current = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(hover: hover)').matches;
  }, []);

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el || !tilt || !allowed.current) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg) translateY(-3px)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ''; };
  const hasCustomBg = className?.includes('bg-');

  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} style={{ '--i': index } as React.CSSProperties}
      className={cn(!hasCustomBg && 'surface', hasCustomBg && 'rounded-[28px] shadow-float', 'lift rise p-5 sm:p-6', className)} {...p}>
      {children}
    </div>
  );
}

export function CardTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-white/90">{children}</h2>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) { return <div className={cn('skeleton', className)} aria-hidden />; }

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-mute">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'We could not load this. Refresh the page to try again.' }: { message?: string }) {
  return <div role="alert" className="rounded-chip border border-coral/30 bg-coral/10 p-4 text-sm text-coral">{message}</div>;
}
