'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Loader2, ChevronLeft, ChevronRight, Search, FileText, List, CalendarDays, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { format, parse } from 'date-fns';
import { INCOME_SOURCES, INCOME_SOURCE_COLORS, INCOME_SOURCE_ICONS, IncomeSource, PAYMENT_METHODS } from '@/lib/categories';
import { useCurrency } from '@/lib/context/AuthContext';
import { cn } from '@/lib/utils';

interface Income { _id: string; amount: number; source: string; date: string; description: string; paymentMethod: string; }

const inCls = "h-10 border-0 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/50 dark:bg-white/[0.06] dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/30";
const scCls = "bg-white border-slate-200 dark:bg-[#0a1628] dark:border-cyan-500/15";
const scItemCls = "text-slate-700 focus:bg-slate-100 dark:text-white/70 dark:focus:bg-cyan-500/15 rounded-lg";

// ── Monthly grouping helper ──────────────────────────────────────────────────
interface MonthGroup {
  key: string;        // e.g. "2026-04"
  label: string;      // e.g. "April 2026"
  incomes: Income[];
  total: number;
  topSource: string;
}

function groupByMonth(incomes: Income[]): MonthGroup[] {
  const map = new Map<string, Income[]>();
  for (const inc of incomes) {
    const key = inc.date.slice(0, 7); // "YYYY-MM"
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(inc);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, incs]) => {
      const total = incs.reduce((s, inc) => s + inc.amount, 0);
      const sourceCount: Record<string, number> = {};
      for (const inc of incs) sourceCount[inc.source] = (sourceCount[inc.source] || 0) + inc.amount;
      const topSource = Object.entries(sourceCount).sort(([, a], [, b]) => b - a)[0]?.[0] || '';
      const label = format(parse(key, 'yyyy-MM', new Date()), 'MMMM yyyy');
      return { key, label, incomes: incs, total, topSource };
    });
}

export default function IncomePage() {
  const [viewMode, setViewMode] = useState<'list' | 'monthly'>('list');
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [allIncomes, setAllIncomes] = useState<Income[]>([]);  // for monthly view
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: '', source: '', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Bank Transfer' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const { toast } = useToast();
  const symbol = useCurrency();

  const monthGroups = useMemo(() => groupByMonth(allIncomes), [allIncomes]);

  const toggleMonth = (key: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Fetch paginated list
  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (search) p.append('search', search);
      if (sourceFilter !== 'all') p.append('source', sourceFilter);
      if (filterStartDate) p.append('startDate', filterStartDate);
      if (filterEndDate) p.append('endDate', filterEndDate);
      if (filterMinAmount) p.append('minAmount', filterMinAmount);
      if (filterMaxAmount) p.append('maxAmount', filterMaxAmount);
      if (filterPayment !== 'all') p.append('paymentMethod', filterPayment);
      p.append('sortBy', sortBy);
      p.append('sortOrder', sortOrder);
      const res = await fetch(`/api/incomes?${p}`);
      if (res.ok) { const d = await res.json(); setIncomes(d.incomes || []); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Fetch ALL incomes for monthly grouping (no limit)
  const fetchAllIncomes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/incomes?page=1&limit=10000&sortBy=date&sortOrder=desc');
      if (res.ok) { const d = await res.json(); setAllIncomes(d.incomes || []); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (viewMode === 'list') {
      fetchIncomes();
    } else {
      fetchAllIncomes();
    }
    const handleRefresh = () => { if (viewMode === 'list') fetchIncomes(); else fetchAllIncomes(); window.dispatchEvent(new Event('expenseDataChanged')); };
    window.addEventListener('incomeDataChanged', handleRefresh);
    return () => window.removeEventListener('incomeDataChanged', handleRefresh);
  }, [viewMode, page, search, sourceFilter, filterStartDate, filterEndDate, filterMinAmount, filterMaxAmount, filterPayment, sortBy, sortOrder]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const url = editingId ? `/api/incomes/${editingId}` : '/api/incomes';
      const m = editingId ? 'PUT' : 'POST';
      const r = await fetch(url, { method: m, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
      if (r.ok) {
        toast({ title: editingId ? 'Income updated' : 'Income added', description: `Successfully saved ${form.description}.` });
        setDialogOpen(false);
        setForm({ amount: '', source: '', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Bank Transfer' });
        setEditingId(null);
        if (viewMode === 'list') fetchIncomes(); else fetchAllIncomes();
        window.dispatchEvent(new Event('expenseDataChanged'));
      } else {
        const data = await r.json();
        toast({ title: 'Error', description: data.error || 'Failed to save income.', variant: 'destructive' });
      }
    } catch { toast({ title: 'Error', description: 'Failed to save income.', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (i: Income) => {
    setEditingId(i._id);
    setForm({ amount: i.amount.toString(), source: i.source, description: i.description, date: i.date.split('T')[0], paymentMethod: i.paymentMethod });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this income?')) return;
    try {
      const r = await fetch(`/api/incomes/${id}`, { method: 'DELETE' });
      if (r.ok) { 
        toast({ title: 'Deleted' }); 
        if (viewMode === 'list') fetchIncomes(); else fetchAllIncomes(); 
        window.dispatchEvent(new Event('expenseDataChanged'));
      }
    } catch { toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Income</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-0.5">Manage your earnings and cash flow</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/[0.1] overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn('flex items-center gap-1.5 px-3 h-9 text-xs font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white')}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={cn('flex items-center gap-1.5 px-3 h-9 text-xs font-medium transition-colors',
                viewMode === 'monthly'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white')}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Monthly
            </button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm({ amount: '', source: '', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Bank Transfer' }); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <button className="h-9 px-4 rounded-xl text-white font-medium text-sm flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-sm shadow-emerald-500/20 w-fit"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                <Plus className="w-4 h-4" /> Add Income
              </button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl border border-slate-200 dark:border-cyan-500/15 shadow-2xl bg-white dark:bg-[#0a1628] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">{editingId ? 'Edit Income' : 'Add Income'}</DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-white/50 text-sm">Enter the details of your income below.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Amount</Label>
                    <Input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required className={inCls} placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Date</Label>
                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className={inCls} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Description</Label>
                  <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required className={inCls} placeholder="e.g. May Salary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Source</Label>
                    <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                      <SelectTrigger className={inCls}><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent className={scCls}>
                        {INCOME_SOURCES.map(c => <SelectItem key={c} value={c} className={scItemCls}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Payment Method</Label>
                    <Select value={form.paymentMethod} onValueChange={v => setForm({ ...form, paymentMethod: v })}>
                      <SelectTrigger className={inCls}><SelectValue /></SelectTrigger>
                      <SelectContent className={scCls}>
                        {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m} className={scItemCls}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <button type="submit" disabled={submitting || !form.amount || !form.source || !form.description}
                  className="w-full h-11 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 shadow-sm"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Income'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── MONTHLY VIEW ─────────────────────────────────────────────── */}
      {viewMode === 'monthly' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : monthGroups.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl panel bg-white dark:bg-white/[0.03]">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400 dark:text-white/20" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No income entries yet</h3>
              <p className="text-slate-500 dark:text-white/40 text-sm">Add your first income to see monthly overview.</p>
            </div>
          ) : monthGroups.map((group) => {
            const isOpen = expandedMonths.has(group.key);
            const TopIcon = INCOME_SOURCE_ICONS[group.topSource as IncomeSource] || FileText;
            return (
              <div key={group.key} className="rounded-2xl overflow-hidden panel bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none">
                {/* Month Header Card */}
                <button
                  onClick={() => toggleMonth(group.key)}
                  className="w-full text-left"
                >
                  <div className="relative p-5 flex items-center justify-between overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))' }}>
                    <div className="absolute inset-0 dark:opacity-60" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.18),rgba(5,150,105,0.10))' }} />
                    <div className="relative flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                        <CalendarDays className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-900 dark:text-white">{group.label}</p>
                        <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">{group.incomes.length} income{group.incomes.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center gap-6">
                      <div className="hidden sm:block text-right">
                        <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-wider mb-0.5">Top Source</p>
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className={`w-5 h-5 rounded-md ${INCOME_SOURCE_COLORS[group.topSource as IncomeSource] || 'bg-slate-400'} flex items-center justify-center`}>
                            <TopIcon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-white/70">{group.topSource}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-wider mb-0.5">Total Income</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{symbol}{group.total.toFixed(2)}</p>
                      </div>
                      <div className="text-slate-400 dark:text-white/30">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Transactions list */}
                {isOpen && (
                  <div className="divide-y divide-slate-100 dark:divide-white/[0.04] animate-fade-in-up">
                    {group.incomes.map((i) => {
                      const Icon = INCOME_SOURCE_ICONS[i.source as IncomeSource] || FileText;
                      return (
                        <div key={i._id} className="px-5 py-3 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                          <div className={`w-9 h-9 rounded-xl ${INCOME_SOURCE_COLORS[i.source as IncomeSource] || 'bg-slate-400'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white/90 truncate">{i.description}</p>
                            <p className="text-[11px] text-slate-500 dark:text-white/40">{format(new Date(i.date), 'MMM d, yyyy')} · {i.paymentMethod}</p>
                          </div>
                          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-white/50">{i.source}</span>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm whitespace-nowrap">{symbol}{i.amount.toFixed(2)}</p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(i)} className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white dark:hover:bg-white/[0.06] rounded-md"><Edit className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(i._id)} className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:text-white/30 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-md"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      );
                    })}
                    {/* Month Footer */}
                    <div className="px-5 py-2.5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                      <span className="text-xs text-slate-400 dark:text-white/30 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />{group.incomes.length} incomes</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-white/70">Total: {symbol}{group.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST VIEW ────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <>
          {/* Filters Area */}
          <div className="flex flex-col gap-3 panel p-3 rounded-2xl shadow-sm dark:shadow-none bg-white dark:bg-white/[0.03]">
            {/* Top Row: Search & Source */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search description or method..." className={cn(inCls, "pl-9 tracking-wide h-10")} />
              </div>
              <Select value={sourceFilter} onValueChange={v => { setSourceFilter(v); setPage(1); }}>
                <SelectTrigger className={cn(inCls, "w-full sm:w-48")}><SelectValue placeholder="All Sources" /></SelectTrigger>
                <SelectContent className={scCls}>
                  <SelectItem value="all" className={scItemCls}>All Sources</SelectItem>
                  {INCOME_SOURCES.map(c => <SelectItem key={c} value={c} className={scItemCls}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={cn("h-10 rounded-xl px-4 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/[0.1] dark:text-white/70 dark:bg-transparent dark:hover:bg-white/[0.04]", showFilters && "bg-slate-100 dark:bg-white/[0.08]")}>
                Filters {showFilters ? '▴' : '▾'}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-xl dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] animate-fade-in-up">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide">Date Range</Label>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={filterStartDate} onChange={e => { setFilterStartDate(e.target.value); setPage(1); }} className={inCls} />
                    <span className="text-slate-400">-</span>
                    <Input type="date" value={filterEndDate} onChange={e => { setFilterEndDate(e.target.value); setPage(1); }} className={inCls} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide">Amount Range ({symbol})</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Min" value={filterMinAmount} onChange={e => { setFilterMinAmount(e.target.value); setPage(1); }} className={inCls} />
                    <span className="text-slate-400">-</span>
                    <Input type="number" placeholder="Max" value={filterMaxAmount} onChange={e => { setFilterMaxAmount(e.target.value); setPage(1); }} className={inCls} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide">Payment Method</Label>
                  <Select value={filterPayment} onValueChange={v => { setFilterPayment(v); setPage(1); }}>
                    <SelectTrigger className={inCls}><SelectValue placeholder="All Methods" /></SelectTrigger>
                    <SelectContent className={scCls}>
                      <SelectItem value="all" className={scItemCls}>All Methods</SelectItem>
                      {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m} className={scItemCls}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide">Sort By</Label>
                  <div className="flex items-center gap-2">
                    <Select value={sortBy} onValueChange={v => { setSortBy(v); setPage(1); }}>
                      <SelectTrigger className={inCls}><SelectValue /></SelectTrigger>
                      <SelectContent className={scCls}>
                        <SelectItem value="date" className={scItemCls}>Date</SelectItem>
                        <SelectItem value="amount" className={scItemCls}>Amount</SelectItem>
                        <SelectItem value="source" className={scItemCls}>Source</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={v => { setSortOrder(v); setPage(1); }}>
                      <SelectTrigger className={cn(inCls, "w-24 px-2")}><SelectValue /></SelectTrigger>
                      <SelectContent className={scCls}>
                        <SelectItem value="desc" className={scItemCls}>Desc ↓</SelectItem>
                        <SelectItem value="asc" className={scItemCls}>Asc ↑</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-2xl panel shadow-sm dark:shadow-none overflow-hidden bg-white dark:bg-white/[0.03] relative">
            {loading && incomes.length > 0 && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            )}

            {loading && incomes.length === 0 ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
            ) : incomes.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400 dark:text-white/20" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No income found</h3>
                <p className="text-slate-500 dark:text-white/40 text-sm max-w-sm mx-auto">Try adjusting your search filters or add a new income to get started.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                        <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">Income</th>
                        <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">Source</th>
                        <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">Method</th>
                        <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider text-right">Amount</th>
                        <th className="py-3.5 px-5 w-20 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {incomes.map((i) => {
                        const Icon = INCOME_SOURCE_ICONS[i.source as IncomeSource] || FileText;
                        return (
                          <tr key={i._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-3.5">
                                <div className={`w-9 h-9 rounded-xl ${INCOME_SOURCE_COLORS[i.source as IncomeSource] || 'bg-slate-200 dark:bg-slate-700'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white/90">{i.description}</p>
                                  <p className="text-[11px] text-slate-500 dark:text-white/40">{format(new Date(i.date), 'MMM d, yyyy')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-white/60">
                                {i.source}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-sm text-slate-600 dark:text-white/50">{i.paymentMethod}</td>
                            <td className="py-3 px-5 text-right font-semibold text-slate-900 dark:text-white">
                              {symbol}{i.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-5 text-right sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(i)} className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white dark:hover:bg-white/[0.06] rounded-md"><Edit className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(i._id)} className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:text-white/30 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-md"><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {incomes.map((i) => {
                    const Icon = INCOME_SOURCE_ICONS[i.source as IncomeSource] || FileText;
                    return (
                      <div key={i._id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${INCOME_SOURCE_COLORS[i.source as IncomeSource] || 'bg-slate-200 dark:bg-slate-700'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                              <Icon className="w-4.5 h-4.5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white/90">{i.description}</p>
                              <p className="text-[11px] text-slate-500 dark:text-white/40 mt-0.5">{format(new Date(i.date), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{symbol}{i.amount.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-white/60">
                              {i.source}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-white/40">{i.paymentMethod}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(i)} className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white rounded-md"><Edit className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(i._id)} className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:text-white/30 dark:hover:text-rose-400 rounded-md"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-transparent flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-white/40">Page <span className="font-semibold text-slate-900 dark:text-white">{page}</span> of {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-7 px-2 text-xs text-slate-600 dark:text-white/60">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 px-2 text-xs text-slate-600 dark:text-white/60">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
