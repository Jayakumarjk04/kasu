'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Wallet, BarChart2, ArrowDownRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORY_COLORS, Category } from '@/lib/categories';
import Link from 'next/link';
import { useCurrency } from '@/lib/context/AuthContext';
import { useTheme } from 'next-themes';

interface Analytics {
  totalSpending: number;
  totalIncome: number;
  netBalance: number;
  categoryBreakdown: Array<{ category:string; total:number; count:number; percentage:number }>;
  monthlyTrend: Array<{ month:string; spending:number; income:number }>;
  recentExpenses: Array<{ _id:string; amount:number; category:string; description:string; date:string }>;
  budgetStatus: Array<{ category:string; budgetAmount:number; spent:number; remaining:number; percentage:number }>;
  topGoal: { title: string; currentAmount: number; targetAmount: number; color: string; icon: string; } | null;
}

import * as LucideIcons from 'lucide-react';

const CHART_COLORS = ['#06b6d4','#3b82f6','#8b5cf6','#10b981','#f59e0b','#f43f5e','#ec4899','#84cc16','#06b6d4','#6366f1'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics|null>(null);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState<'week'|'month'|'year'>('month');
  const symbol = useCurrency();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const TT = { 
    backgroundColor: isDark ? '#0a1628' : '#ffffff', 
    border: isDark ? '1px solid rgba(6,182,212,0.15)' : '1px solid #e2e8f0', 
    borderRadius: '10px', 
    color: isDark ? '#e2e8f0' : '#0f172a',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };
  const axisColor = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.4)';

  useEffect(() => { 
    fetchAnalytics(); 
    const handleRefresh = () => fetchAnalytics();
    window.addEventListener('expenseDataChanged', handleRefresh);
    return () => window.removeEventListener('expenseDataChanged', handleRefresh);
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try { const r = await fetch(`/api/analytics?period=${period}`); if(r.ok) setAnalytics(await r.json()); }
    catch(e){ console.error(e); } finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>;

  const avg = analytics ? analytics.totalSpending / (period==='week'?7:period==='month'?30:365) : 0;

  const stats = [
    { label:'Net Balance',      value:`${symbol}${analytics?.netBalance.toFixed(2)?? '0.00'}`,     icon:Wallet,      cls:'stat-amber',    ic:'text-amber-600 dark:text-amber-400',       ib:'bg-amber-100 dark:bg-amber-500/15' },
    { label:'Total Income',     value:`${symbol}${analytics?.totalIncome.toFixed(2)?? '0.00'}`,    icon:TrendingUp,  cls:'stat-emerald', ic:'text-emerald-600 dark:text-emerald-400', ib:'bg-emerald-100 dark:bg-emerald-500/15' },
    { label:'Total Spending',   value:`${symbol}${analytics?.totalSpending.toFixed(2)?? '0.00'}`,  icon:ArrowDownRight, cls:'stat-rose', ic:'text-rose-600 dark:text-rose-400', ib:'bg-rose-100 dark:bg-rose-500/15' },
    { label:'Daily Avg Spent',  value:`${symbol}${avg.toFixed(2)}`,                                icon:BarChart2,   cls:'stat-blue',    ic:'text-blue-600 dark:text-blue-400',       ib:'bg-blue-100 dark:bg-blue-500/15' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-0.5">Your financial snapshot</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week'|'month'|'year')}>
          <TabsList className="bg-slate-200/50 dark:bg-white/[0.06] border border-slate-200 dark:border-cyan-500/10 rounded-xl p-0.5">
            {(['week','month','year'] as const).map(t => (
              <TabsTrigger key={t} value={t} className="rounded-lg capitalize text-sm px-4 py-1.5 text-slate-500 dark:text-white/40 data-[state=active]:bg-white dark:data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-sm">
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s,i) => (
          <div key={i} className={`rounded-2xl p-5 ${s.cls} shadow-sm dark:shadow-none`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-white/40 font-medium mb-1 uppercase tracking-wider">{s.label}</p>
                <p className={`font-bold text-slate-900 dark:text-white text-2xl`}>{String(s.value)}</p>
              </div>
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${s.ib}`}>
                <s.icon className={`w-5 h-5 ${s.ic}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Goal Widget */}
      {analytics?.topGoal && (() => {
        const g = analytics.topGoal;
        const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
        const GoalIcon = (LucideIcons as any)[g.icon] || BarChart2;
        return (
          <div className="rounded-2xl p-5 panel bg-slate-900 border-0 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
              <div className={`w-12 h-12 rounded-2xl ${g.color} flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/20`}>
                <GoalIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">Top Active Goal</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-white">{g.title}</h3>
                  <span className="text-sm font-medium text-white/70">
                    ({pct}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 max-w-md w-full relative z-10">
              <div className="flex items-center justify-between text-sm font-medium text-white/70 mb-2">
                <span>{symbol}{g.currentAmount.toFixed(0)} saved</span>
                <span>{symbol}{g.targetAmount.toFixed(0)} target</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full ${g.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl p-5 panel">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Spending by Category</h3>
          {analytics?.categoryBreakdown.length ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.categoryBreakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={85} innerRadius={42} paddingAngle={2}>
                      {analytics.categoryBreakdown.map((_,i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={TT} formatter={(v:number) => [`${symbol}${v.toFixed(2)}`,'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {analytics.categoryBreakdown.slice(0,5).map((c,i) => (
                <div key={i} className="flex items-center justify-between mt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background:CHART_COLORS[i%CHART_COLORS.length] }} />
                    <span className="text-slate-600 dark:text-white/60">{c.category}</span>
                  </div>
                  <span className="text-slate-500 dark:text-white/40 font-medium">{c.percentage}%</span>
                </div>
              ))}
            </>
          ) : <div className="h-56 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No data yet</div>}
        </div>

        <div className="rounded-2xl p-5 panel">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Monthly Trend</h3>
          {analytics?.monthlyTrend.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyTrend} barSize={24}>
                  <XAxis dataKey="month" stroke="transparent" tick={{ fill: axisColor, fontSize:11 }}
                    tickFormatter={(v) => { const[,m]=v.split('-'); return MONTHS[parseInt(m)-1]; }} />
                  <YAxis stroke="transparent" tick={{ fill: axisColor, fontSize:11 }} />
                  <Tooltip contentStyle={TT} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }} />
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} /></linearGradient>
                    <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" stopOpacity={0.7} /></linearGradient>
                  </defs>
                  <Bar dataKey="spending" name="Spending" radius={[4,4,0,0]} fill="url(#cg)" />
                  <Bar dataKey="income" name="Income" radius={[4,4,0,0]} fill="url(#ig)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-72 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No data yet</div>}
        </div>
      </div>

      {/* Recent + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl p-5 panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
            <Button variant="ghost" size="sm" asChild className="text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 dark:bg-transparent dark:text-cyan-400 dark:hover:text-cyan-300 text-xs h-7 px-3 dark:hover:bg-cyan-500/10 rounded-lg">
              <Link href="/transactions">View all</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {analytics?.recentExpenses.length ? analytics.recentExpenses.map(exp => (
              <div key={exp._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.02] dark:hover:bg-white/[0.04] transition-colors border border-slate-100 dark:border-transparent">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${CATEGORY_COLORS[exp.category as Category]||'bg-slate-200 dark:bg-slate-700'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white/90">{exp.description}</p>
                    <p className="text-[11px] text-slate-500 dark:text-white/40">{exp.category} · {format(new Date(exp.date),'MMM d')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-rose-500 dark:text-rose-400 flex-shrink-0">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">{symbol}{exp.amount.toFixed(2)}</span>
                </div>
              </div>
            )) : <div className="text-center text-slate-400 dark:text-white/30 text-sm py-8">No transactions yet</div>}
          </div>
        </div>

        <div className="rounded-2xl p-5 panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Budget Status</h3>
            <Button variant="ghost" size="sm" asChild className="text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 dark:bg-transparent dark:text-cyan-400 dark:hover:text-cyan-300 text-xs h-7 px-3 dark:hover:bg-cyan-500/10 rounded-lg">
              <Link href="/budgets">Manage</Link>
            </Button>
          </div>
          <div className="space-y-5">
            {analytics?.budgetStatus.length ? analytics.budgetStatus.map(b => (
              <div key={b.category} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-white/70">{b.category}</span>
                  <span className="text-slate-500 dark:text-white/40">{symbol}{b.spent.toFixed(0)} / {symbol}{b.budgetAmount.toFixed(0)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-white/[0.06]">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width:`${Math.min(b.percentage,100)}%`, background:b.percentage>=100?'#f43f5e':b.percentage>=80?'#f59e0b':'linear-gradient(90deg,#06b6d4,#3b82f6)' }} />
                </div>
                <div className="flex justify-between text-[10px] font-medium">
                  <span style={{ color:b.percentage>=100?'#f43f5e':b.percentage>=80?'#f59e0b':'#10b981' }}>{b.percentage}% used</span>
                  <span className="text-slate-400 dark:text-white/30">{b.remaining>=0?`${symbol}${b.remaining.toFixed(0)} left`:`${symbol}${Math.abs(b.remaining).toFixed(0)} over`}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-slate-400 dark:text-white/30 text-sm mb-3">No budgets set</p>
                <Button asChild size="sm" className="text-xs h-8 border-0 text-white rounded-lg shadow-sm" style={{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
                  <Link href="/budgets">Create Budget</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
