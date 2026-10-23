'use client';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const AXIS = { stroke: '#8C8C8C', fontSize: 12, tickLine: false, axisLine: false } as const;

function Tip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-lift">
      <p className="mb-1 font-semibold">{label ?? payload[0].name}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          <span className="text-mute">{p.name}</span>
          <span className="ml-auto font-semibold">{formatCurrency(Number(p.value), currency)}</span>
        </p>
      ))}
    </div>
  );
}

export function IncomeExpenseChart({ data, currency }: { data: { label: string; income: number; expenses: number }[]; currency: string }) {
  const hasData = Boolean(data && data.length > 0 && data.some((d) => Number(d.income) > 0 || Number(d.expenses) > 0));

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line/60 p-6 text-center">
        <p className="text-sm font-semibold text-white/90">No activity yet this month</p>
        <p className="max-w-xs text-xs text-mute">Daily income and expense trends will appear here once you log transactions.</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label="Income versus expenses over time" className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E2FF1F" stopOpacity={0.35} /><stop offset="1" stopColor="#E2FF1F" stopOpacity={0} /></linearGradient>
            <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF7A6B" stopOpacity={0.3} /><stop offset="1" stopColor="#FF7A6B" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid, rgba(255,255,255,0.06))" vertical={false} />
          <XAxis dataKey="label" {...AXIS} minTickGap={16} />
          <YAxis {...AXIS} width={52} tickFormatter={(v) => formatCurrency(v, currency, { compact: true })} />
          <Tooltip content={<Tip currency={currency} />} cursor={{ stroke: 'rgba(255,255,255,.15)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#8C8C8C' }} />
          <Area type="monotone" dataKey="income" name="Income" stroke="#E2FF1F" strokeWidth={2} fill="url(#gi)" />
          <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#FF7A6B" strokeWidth={2} fill="url(#ge)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashflowChart({ data, currency }: { data: { label: string; net: number }[]; currency: string }) {
  const hasData = Boolean(data && data.length > 0 && data.some((d) => Number(d.net) !== 0));

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line/60 p-6 text-center">
        <p className="text-sm font-semibold text-white/90">No cash flow history</p>
        <p className="max-w-xs text-xs text-mute">Monthly net savings bars for the last 6 months will be charted here.</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label="Monthly net cash flow" className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--chart-grid, rgba(255,255,255,0.06))" vertical={false} />
          <XAxis dataKey="label" {...AXIS} />
          <YAxis {...AXIS} width={52} tickFormatter={(v) => formatCurrency(v, currency, { compact: true })} />
          <Tooltip content={<Tip currency={currency} />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Bar dataKey="net" name="Net cash flow" radius={[8, 8, 8, 8]} maxBarSize={36}>
            {data.map((d, i) => <Cell key={i} fill={d.net >= 0 ? '#E2FF1F' : '#FF7A6B'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailySpendChart({ data, currency }: { data: { label: string; expenses: number }[]; currency: string }) {
  const hasData = Boolean(data && data.length > 0 && data.some((d) => Number(d.expenses) > 0));

  if (!hasData) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line/60 p-6 text-center">
        <p className="text-sm font-semibold text-white/90">No spending logged yet</p>
        <p className="max-w-xs text-xs text-mute">Daily expense bars will appear as you spend this month.</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label="Daily spending" className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--chart-grid, rgba(255,255,255,0.06))" vertical={false} />
          <XAxis dataKey="label" {...AXIS} minTickGap={24} />
          <YAxis {...AXIS} width={52} tickFormatter={(v) => formatCurrency(v, currency, { compact: true })} />
          <Tooltip content={<Tip currency={currency} />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Bar dataKey="expenses" name="Spent" fill="#1FC8E3" radius={[6, 6, 6, 6]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({ data, currency, total }: { data: { name: string; color: string; total: number; percent: number }[]; currency: string; total: number }) {
  return (
    <div>
      <div role="img" aria-label="Spending by category" className="relative mx-auto h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="name" innerRadius={66} outerRadius={96} paddingAngle={3} cornerRadius={6} stroke="none">
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip content={<Tip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div><p className="text-xs text-mute">Spent</p><p className="text-xl font-bold">{formatCurrency(total, currency, { compact: true })}</p></div>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {data.slice(0, 5).map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="truncate">{d.name}</span>
            <span className="ml-auto font-semibold">{d.percent.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BudgetVsActualChart({ data, currency }: { data: { name: string; limit: number; spent: number }[]; currency: string }) {
  const hasData = Boolean(data && data.length > 0 && data.some((d) => Number(d.limit) > 0 || Number(d.spent) > 0));

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line/60 p-6 text-center">
        <p className="text-sm font-semibold text-white/90">No budget activity</p>
        <p className="max-w-xs text-xs text-mute">Set category limits to track budget vs actual spending.</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label="Budget versus actual spending by category" className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--chart-grid, rgba(255,255,255,0.06))" vertical={false} />
          <XAxis dataKey="name" {...AXIS} interval={0} tickFormatter={(v: string) => (v.length > 9 ? v.slice(0, 8) + '…' : v)} />
          <YAxis {...AXIS} width={52} tickFormatter={(v) => formatCurrency(v, currency, { compact: true })} />
          <Tooltip content={<Tip currency={currency} />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#8C8C8C' }} />
          <Bar dataKey="limit" name="Budget" fill="#4A5410" radius={[6, 6, 6, 6]} maxBarSize={22} />
          <Bar dataKey="spent" name="Spent" fill="#E2FF1F" radius={[6, 6, 6, 6]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
