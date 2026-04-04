'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { useCurrency } from '@/lib/context/AuthContext';
import { useTheme } from 'next-themes';

interface Analytics {
  totalSpending: number;
  categoryBreakdown: Array<{ category:string; total:number; count:number; percentage:number }>;
  monthlyTrend: Array<{ month:string; total:number; count:number }>;
  recentExpenses: Array<{ _id:string; amount:number; category:string; description:string; date:string }>;
  budgetStatus: Array<{ category:string; budgetAmount:number; spent:number; remaining:number; percentage:number }>;
}

const COLORS = ['#06b6d4','#3b82f6','#8b5cf6','#10b981','#f59e0b','#f43f5e','#ec4899','#84cc16','#6366f1','#22d3ee'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AnalyticsPage() {
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
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

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

  const periodLabel = period==='week'?'This Week':period==='month'?'This Month':'This Year';
  const txCount = analytics?.categoryBreakdown.reduce((s,c)=>s+c.count,0)??0;
  const catCount = analytics?.categoryBreakdown.length??0;

  const summaryCards = [
    { label:`Total ${periodLabel}`, value:`${symbol}${analytics?.totalSpending.toFixed(2)?? '0.00'}`, color:'text-cyan-600 dark:text-cyan-400', accent:'bg-cyan-50 dark:bg-cyan-500/10', border:'border-cyan-200 dark:border-cyan-500/20' },
    { label:'Transactions',          value:txCount,  color:'text-blue-600 dark:text-blue-400',  accent:'bg-blue-50 dark:bg-blue-500/10', border:'border-blue-200 dark:border-blue-500/20' },
    { label:'Categories Used',        value:catCount, color:'text-emerald-600 dark:text-emerald-400',accent:'bg-emerald-50 dark:bg-emerald-500/10',border:'border-emerald-200 dark:border-emerald-500/20' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-0.5">Detailed spending insights</p>
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((c,i) => (
          <div key={i} className={`rounded-2xl p-6 text-center ${c.accent} border ${c.border} shadow-sm`}>
            <p className="text-sm text-slate-500 dark:text-white/50 mb-2 font-medium">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{String(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut */}
        <div className="rounded-2xl p-5 panel">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Category Distribution</h3>
          {analytics?.categoryBreakdown.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.categoryBreakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={2}>
                    {analytics.categoryBreakdown.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={TT} formatter={(v:number,n:string) => [`${symbol}${v.toFixed(2)}`,n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-72 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No data available</div>}
        </div>

        {/* Horizontal bar */}
        <div className="rounded-2xl p-5 panel">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Spending by Category</h3>
          {analytics?.categoryBreakdown.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryBreakdown} layout="vertical" margin={{ left:80 }}>
                  <XAxis type="number" stroke="transparent" tick={{ fill:axisColor, fontSize:11 }} />
                  <YAxis type="category" dataKey="category" stroke="transparent" tick={{ fill:isDark?'rgba(255,255,255,0.45)':'rgba(15,23,42,0.6)', fontSize:11 }} width={75} />
                  <Tooltip contentStyle={TT} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} formatter={(v:number) => [`${symbol}${v.toFixed(2)}`,'Amount']} />
                  <defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
                  <Bar dataKey="total" fill="url(#hg)" radius={[0,5,5,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-72 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No data available</div>}
        </div>

        {/* Line chart full-width */}
        <div className="rounded-2xl p-5 panel lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Spending Trend</h3>
          {analytics?.monthlyTrend.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" stroke="transparent" tick={{ fill:axisColor, fontSize:11 }} dy={10}
                    tickFormatter={(v) => { const[,m]=v.split('-'); return MONTHS[parseInt(m)-1]; }} />
                  <YAxis stroke="transparent" tick={{ fill:axisColor, fontSize:11 }} dx={-10} />
                  <Tooltip contentStyle={TT} formatter={(v:number) => [`${symbol}${v.toFixed(2)}`,'Spending']} />
                  <defs>
                    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <Line type="monotone" dataKey="total" stroke="url(#lg)" strokeWidth={3} dot={{ fill:'#06b6d4', r:4, strokeWidth:0 }} activeDot={{ r:6, fill:'#22d3ee' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-72 flex items-center justify-center text-slate-400 dark:text-white/30 text-sm">No trend data available</div>}
        </div>
      </div>

      {/* Table */}
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
                    {['Category','Amount','Transactions','Share'].map(h => (
                      <th key={h} className={`py-3 px-5 text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wide ${h==='Category'?'text-left':'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.categoryBreakdown.map((cat,idx) => (
                    <tr key={cat.category} className="border-b border-slate-50 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:COLORS[idx%COLORS.length] }} />
                          <span className="text-sm font-medium text-slate-700 dark:text-white/80">{cat.category}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-5 text-sm font-semibold text-slate-900 dark:text-white/90">{symbol}{cat.total.toFixed(2)}</td>
                      <td className="text-right py-3 px-5 text-sm text-slate-500 dark:text-white/50">{cat.count}</td>
                      <td className="text-right py-3 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400">
                          {cat.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
              {analytics.categoryBreakdown.map((cat,idx) => (
                <div key={cat.category} className="p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background:COLORS[idx%COLORS.length] }} />
                      <span className="font-semibold text-slate-900 dark:text-white/90">{cat.category}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{symbol}{cat.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pl-6 text-sm text-slate-500 dark:text-white/50">
                    <span>{cat.count} transactions</span>
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
