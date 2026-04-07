'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, TrendingDown, Minus, DollarSign, Activity, ArrowUpRight, CreditCard, Calendar, Zap } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, AreaChart, Area,
} from 'recharts';
import { useCurrency } from '@/lib/context/AuthContext';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import { CATEGORY_COLORS, CATEGORY_ICONS, Category } from '@/lib/categories';

interface Analytics {
  totalSpending: number;
  prevPeriodSpending: number;
  totalIncome: number;
  prevPeriodIncome: number;
  netBalance: number;
  avgPerTransaction: number;
  dailyAverage: number;
  categoryBreakdown: Array<{ category: string; total: number; count: number; percentage: number }>;
  incomeSourceBreakdown: Array<{ source: string; total: number; count: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; spending: number; income: number }>;
  paymentMethodBreakdown: Array<{ method: string; total: number; count: number; percentage: number }>;
  weekdayPattern: Array<{ day: string; total: number; count: number }>;
  topExpenses: Array<{ _id: string; amount: number; category: string; description: string; date: string; paymentMethod: string }>;
  recentExpenses: Array<{ _id: string; amount: number; category: string; description: string; date: string }>;
  budgetStatus: Array<{ category: string; budgetAmount: number; spent: number; remaining: number; percentage: number }>;
}

const COLORS = ['#06b6d4','#3b82f6','#8b5cf6','#10b981','#f59e0b','#f43f5e','#ec4899','#84cc16','#6366f1','#22d3ee'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function pctChange(curr: number, prev: number) {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

function ChgBadge({ curr, prev }: { curr: number; prev: number }) {
  const pct = pctChange(curr, prev);
  if (pct === null) return <span className="text-xs text-slate-400 dark:text-white/30">No prior data</span>;
  const up = pct > 0;
  const Icon = pct === 0 ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'}`}>
      <Icon className="w-3 h-3" />{Math.abs(pct).toFixed(1)}% vs last period
    </span>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState<'week' | 'month' | 'year'>('month');
  const symbol = useCurrency();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const TT = {
    backgroundColor: isDark ? '#0a1628' : '#ffffff',
    border: isDark ? '1px solid rgba(6,182,212,0.15)' : '1px solid #e2e8f0',
    borderRadius: '10px', color: isDark ? '#e2e8f0' : '#0f172a',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  };
  const axisColor = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.4)';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    fetchAnalytics();
    const h = () => fetchAnalytics();
    window.addEventListener('expenseDataChanged', h);
    return () => window.removeEventListener('expenseDataChanged', h);
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try { const r = await fetch(`/api/analytics?period=${period}`); if (r.ok) setAnalytics(await r.json()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>;

  const txCount = analytics?.categoryBreakdown.reduce((s, c) => s + c.count, 0) ?? 0;
  const periodLabel = period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year';
  const maxWeekday = analytics?.weekdayPattern.reduce((a, b) => b.total > a.total ? b : a, { day: '', total: 0, count: 0 });

  const kpiCards = [
    {
      label: `Net Balance`,
      sub: periodLabel,
      value: `${symbol}${(analytics?.netBalance ?? 0).toFixed(2)}`,
      icon: DollarSign,
      accent: 'stat-amber',
      ic: 'text-amber-600 dark:text-amber-400',
      ib: 'bg-amber-100 dark:bg-amber-500/15',
      badge: <ChgBadge curr={analytics?.netBalance ?? 0} prev={(analytics?.prevPeriodIncome ?? 0) - (analytics?.prevPeriodSpending ?? 0)} />,
    },
    {
      label: `Total Income`,
      sub: periodLabel,
      value: `${symbol}${(analytics?.totalIncome ?? 0).toFixed(2)}`,
      icon: TrendingUp,
      accent: 'stat-emerald',
      ic: 'text-emerald-600 dark:text-emerald-400',
      ib: 'bg-emerald-100 dark:bg-emerald-500/15',
      badge: <ChgBadge curr={analytics?.totalIncome ?? 0} prev={analytics?.prevPeriodIncome ?? 0} />,
    },
    {
      label: `Total Spent`,
      sub: periodLabel,
      value: `${symbol}${(analytics?.totalSpending ?? 0).toFixed(2)}`,
      icon: TrendingDown,
      accent: 'stat-rose',
      ic: 'text-rose-600 dark:text-rose-400',
      ib: 'bg-rose-100 dark:bg-rose-500/15',
      badge: <ChgBadge curr={analytics?.totalSpending ?? 0} prev={analytics?.prevPeriodSpending ?? 0} />,
    },
    {
      label: 'Busiest Day',
      sub: 'most spending',
      value: maxWeekday?.total ? maxWeekday.day : '—',
      icon: Calendar,
      accent: 'stat-amber',
      ic: 'text-amber-600 dark:text-amber-400',
      ib: 'bg-amber-100 dark:bg-amber-500/15',
      badge: maxWeekday?.total ? <span className="text-xs text-slate-400 dark:text-white/30">{symbol}{maxWeekday.total.toFixed(0)} avg</span> : null,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-0.5">Deep insights into your spending</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'year')}>
          <TabsList className="bg-slate-200/50 dark:bg-white/[0.06] border border-slate-200 dark:border-cyan-500/10 rounded-xl p-0.5">
            {(['week', 'month', 'year'] as const).map(t => (
              <TabsTrigger key={t} value={t} className="rounded-lg capitalize text-sm px-4 py-1.5 text-slate-500 dark:text-white/40 data-[state=active]:bg-white dark:data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-sm">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((c, i) => (
          <div key={i} className={`rounded-2xl p-5 ${c.accent} shadow-sm dark:shadow-none`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-white/40 font-medium uppercase tracking-wider">{c.label}</p>
                <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5">{c.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.ib}`}>
                <c.icon className={`w-5 h-5 ${c.ic}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{c.value}</p>
            {c.badge}
          </div>
        ))}
      </div>

      {/* Income vs Spending Trend — Stacked/Dual Bar Chart */}
      <div className="rounded-2xl p-5 panel">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Cash Flow Trend</h3>
            <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5">Income vs Spending (Last 6 months)</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-emerald-700 dark:text-emerald-400">Income</span></div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /><span className="text-cyan-700 dark:text-cyan-400">Spending</span></div>
          </div>
        </div>
        {analytics?.monthlyTrend.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyTrend} barGap={4}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} /></linearGradient>
                  <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" stopOpacity={0.8} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" stroke="transparent" tick={{ fill: axisColor, fontSize: 11 }} dy={10}
                  tickFormatter={(v) => { const [, m] = v.split('-'); return MONTHS[parseInt(m) - 1]; }} />
                <YAxis stroke="transparent" tick={{ fill: axisColor, fontSize: 11 }} dx={-10}
                  tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
                <Tooltip contentStyle={TT} formatter={(v: number) => [`${symbol}${v.toFixed(2)}`]}
                  labelFormatter={(v) => { const [, m] = v.split('-'); return MONTHS[parseInt(m) - 1]; }} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]} fill="url(#ig)" maxBarSize={40} />
                <Bar dataKey="spending" name="Spending" radius={[4, 4, 0, 0]} fill="url(#cg)" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="h-72 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No trend data available</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Income Source Donut */}
        <div className="rounded-2xl p-5 panel">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Income Sources</h3>
          <p className="text-xs text-slate-400 dark:text-white/30 mb-4">{periodLabel}</p>
          {analytics?.incomeSourceBreakdown.length ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.incomeSourceBreakdown} dataKey="total" nameKey="source"
                      cx="50%" cy="50%" outerRadius={90} innerRadius={48} paddingAngle={2}>
                      {analytics.incomeSourceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={TT} formatter={(v: number, n: string) => [`${symbol}${v.toFixed(2)}`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {analytics.incomeSourceBreakdown.slice(0, 5).map((c, i) => (
                  <div key={c.source} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[(i + 4) % COLORS.length] }} />
                    <span className="flex-1 text-slate-600 dark:text-white/60 truncate">{c.source}</span>
                    <span className="text-slate-500 dark:text-white/40 font-medium">{c.percentage}%</span>
                    <span className="text-slate-700 dark:text-white/70 font-semibold">{symbol}{c.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-72 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No data available</div>}
        </div>
        {/* Donut */}
        <div className="rounded-2xl p-5 panel">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Category Distribution</h3>
          <p className="text-xs text-slate-400 dark:text-white/30 mb-4">{periodLabel}</p>
          {analytics?.categoryBreakdown.length ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.categoryBreakdown} dataKey="total" nameKey="category"
                      cx="50%" cy="50%" outerRadius={90} innerRadius={48} paddingAngle={2}>
                      {analytics.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={TT} formatter={(v: number, n: string) => [`${symbol}${v.toFixed(2)}`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {analytics.categoryBreakdown.slice(0, 5).map((c, i) => (
                  <div key={c.category} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-slate-600 dark:text-white/60 truncate">{c.category}</span>
                    <span className="text-slate-500 dark:text-white/40 font-medium">{c.percentage}%</span>
                    <span className="text-slate-700 dark:text-white/70 font-semibold">{symbol}{c.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-72 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No data available</div>}
        </div>

        {/* Category Progress Bars */}
        <div className="rounded-2xl p-5 panel">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Spending by Category</h3>
          <p className="text-xs text-slate-400 dark:text-white/30 mb-5">{periodLabel} breakdown</p>
          {analytics?.categoryBreakdown.length ? (
            <div className="space-y-4">
              {analytics.categoryBreakdown.slice(0, 8).map((cat, idx) => {
                const Icon = CATEGORY_ICONS[cat.category as Category] || CATEGORY_ICONS.Other;
                const color = COLORS[idx % COLORS.length];
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${CATEGORY_COLORS[cat.category as Category] || 'bg-slate-400'} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-white/80">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{symbol}{cat.total.toFixed(0)}</span>
                        <span className="text-xs text-slate-400 dark:text-white/30 ml-2">{cat.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${cat.percentage}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="h-60 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No data available</div>}
        </div>
      </div>

      {/* Payment Methods + Day of Week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payment Method Donut */}
        <div className="rounded-2xl p-5 panel">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-slate-400 dark:text-white/30" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Payment Methods</h3>
          </div>
          <p className="text-xs text-slate-400 dark:text-white/30 mb-4">How you pay</p>
          {analytics?.paymentMethodBreakdown.length ? (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.paymentMethodBreakdown} dataKey="total" nameKey="method"
                      cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                      {analytics.paymentMethodBreakdown.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={TT} formatter={(v: number, n: string) => [`${symbol}${v.toFixed(2)}`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {analytics.paymentMethodBreakdown.map((p, i) => (
                  <div key={p.method} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[(i + 3) % COLORS.length] }} />
                    <span className="flex-1 text-slate-600 dark:text-white/60">{p.method}</span>
                    <span className="text-slate-400 dark:text-white/30">{p.count} txns</span>
                    <span className="font-semibold text-slate-800 dark:text-white/80">{symbol}{p.total.toFixed(0)}</span>
                    <span className="text-slate-400 dark:text-white/30 w-8 text-right">{p.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-72 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No data available</div>}
        </div>

        {/* Day of Week Pattern */}
        <div className="rounded-2xl p-5 panel">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-slate-400 dark:text-white/30" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Spending by Day</h3>
          </div>
          <p className="text-xs text-slate-400 dark:text-white/30 mb-4">Which days you spend most</p>
          {analytics?.weekdayPattern.some(d => d.total > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weekdayPattern} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="day" stroke="transparent" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis stroke="transparent" tick={{ fill: axisColor, fontSize: 11 }} dx={-8}
                    tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip contentStyle={TT} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                    formatter={(v: number) => [`${symbol}${v.toFixed(2)}`, 'Spending']} />
                  <defs>
                    <linearGradient id="dayG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="total" radius={[5, 5, 0, 0]} fill="url(#dayG)">
                    {analytics.weekdayPattern.map((entry, i) => (
                      <Cell key={i}
                        fill={entry.day === maxWeekday?.day && entry.total > 0
                          ? 'url(#lineGDay)'
                          : isDark ? 'rgba(139,92,246,0.6)' : 'rgba(139,92,246,0.75)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-64 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No data available</div>}
        </div>
      </div>

      {/* Top 5 Expenses */}
      {analytics?.topExpenses && analytics.topExpenses.length > 0 && (
        <div className="rounded-2xl overflow-hidden panel">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-transparent flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Expenses</h3>
            <span className="text-xs text-slate-400 dark:text-white/30 ml-1">{periodLabel}</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {analytics.topExpenses.map((exp, idx) => {
              const Icon = CATEGORY_ICONS[exp.category as Category] || CATEGORY_ICONS.Other;
              return (
                <div key={exp._id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-xs font-bold text-slate-500 dark:text-white/50 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className={`w-9 h-9 rounded-xl ${CATEGORY_COLORS[exp.category as Category] || 'bg-slate-400'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white/90 truncate">{exp.description}</p>
                    <p className="text-[11px] text-slate-500 dark:text-white/40">
                      {exp.category} · {format(new Date(exp.date), 'MMM d, yyyy')} · {exp.paymentMethod}
                    </p>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white whitespace-nowrap">{symbol}{exp.amount.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Details Table */}
      <div className="rounded-2xl overflow-hidden panel">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-transparent">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Category Details</h3>
        </div>
        {analytics?.categoryBreakdown.length ? (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
                    {['Category', 'Amount', 'Transactions', 'Avg per Txn', 'Share'].map(h => (
                      <th key={h} className={`py-3 px-5 text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wide ${h === 'Category' ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.categoryBreakdown.map((cat, idx) => (
                    <tr key={cat.category} className="border-b border-slate-50 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                          <span className="text-sm font-medium text-slate-700 dark:text-white/80">{cat.category}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-5 text-sm font-semibold text-slate-900 dark:text-white/90">{symbol}{cat.total.toFixed(2)}</td>
                      <td className="text-right py-3 px-5 text-sm text-slate-500 dark:text-white/50">{cat.count}</td>
                      <td className="text-right py-3 px-5 text-sm text-slate-500 dark:text-white/50">{symbol}{(cat.total / cat.count).toFixed(2)}</td>
                      <td className="text-right py-3 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, background: COLORS[idx % COLORS.length] }} />
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400 w-12 justify-center">
                            {cat.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
              {analytics.categoryBreakdown.map((cat, idx) => (
                <div key={cat.category} className="p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                      <span className="font-semibold text-slate-900 dark:text-white/90">{cat.category}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{symbol}{cat.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pl-6 text-sm text-slate-500 dark:text-white/50">
                    <span>{cat.count} txns · avg {symbol}{(cat.total / cat.count).toFixed(2)}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : <div className="text-center py-10 text-slate-400 dark:text-white/30 text-sm">No category data available</div>}
      </div>
    </div>
  );
}
