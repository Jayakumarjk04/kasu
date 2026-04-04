'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, Category } from '@/lib/categories';
import { useCurrency } from '@/lib/context/AuthContext';
import { cn } from '@/lib/utils';

interface Budget { _id:string; category:string; amount:number; period:'weekly'|'monthly'|'yearly'; isActive:boolean; }
interface BudgetStatus { category:string; budgetAmount:number; spent:number; remaining:number; percentage:number; }

const inCls = "h-10 border-0 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/50 dark:bg-white/[0.06] dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/30";
const scCls = "bg-white border-slate-200 dark:bg-[#0a1628] dark:border-cyan-500/15";
const scItemCls = "text-slate-700 focus:bg-slate-100 dark:text-white/70 dark:focus:bg-cyan-500/15 rounded-lg";

export default function BudgetsPage() {
  const [budgets, setBudgets]           = useState<Budget[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [loading, setLoading]           = useState(true);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editingId, setEditingId]       = useState<string|null>(null);
  const [form, setForm]                 = useState({ category:'', amount:'', period:'monthly' as 'weekly'|'monthly'|'yearly' });
  const [submitting, setSubmitting]     = useState(false);
  const { toast } = useToast();
  const symbol    = useCurrency();

  useEffect(() => { 
    fetchData(); 
    const handleRefresh = () => fetchData();
    window.addEventListener('expenseDataChanged', handleRefresh);
    return () => window.removeEventListener('expenseDataChanged', handleRefresh);
  }, []);

  const fetchData = async () => {
    try {
      const [br, ar] = await Promise.all([fetch('/api/budgets'), fetch('/api/analytics?period=month')]);
      if (br.ok) setBudgets(await br.json());
      if (ar.ok) { const d = await ar.json(); setBudgetStatus(d.budgetStatus||[]); }
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const url    = editingId ? `/api/budgets/${editingId}` : '/api/budgets';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...form, amount:parseFloat(form.amount) }) });
      if (res.ok) {
        toast({ title: editingId?'Budget updated':'Budget created', description:`${form.category} budget saved.` });
        setDialogOpen(false); setForm({ category:'', amount:'', period:'monthly' }); setEditingId(null); fetchData();
      }
    } catch { toast({ title:'Error', description:'Failed to save budget.', variant:'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleEdit   = (b: Budget) => { setEditingId(b._id); setForm({ category:b.category, amount:b.amount.toString(), period:b.period }); setDialogOpen(true); };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    try { const r = await fetch(`/api/budgets/${id}`,{method:'DELETE'}); if(r.ok){ toast({title:'Budget deleted'}); fetchData(); } }
    catch { toast({title:'Error',description:'Failed to delete.',variant:'destructive'}); }
  };

  const existingCats     = budgets.map(b => b.category);
  const availableCats    = CATEGORIES.filter(c => !existingCats.includes(c) || (editingId && form.category===c));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Budgets</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-0.5">Set and track your spending limits</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if(!o){setForm({category:'',amount:'',period:'monthly'});setEditingId(null);} }}>
          <DialogTrigger asChild>
            <button className="h-9 px-4 rounded-xl text-white font-medium text-sm flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-sm shadow-cyan-500/20"
              style={{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              <Plus className="w-4 h-4" /> Add Budget
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm rounded-2xl border border-slate-200 dark:border-cyan-500/15 shadow-2xl bg-white dark:bg-[#0a1628]">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">{editingId?'Edit Budget':'Create Budget'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({...form,category:v})} disabled={!!editingId}>
                  <SelectTrigger className={cn(inCls, "w-full")}><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent className={scCls}>
                    {availableCats.map(c => <SelectItem key={c} value={c} className={scItemCls}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Budget Amount</Label>
                <Input type="number" step="1" min="1" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} required className={inCls} placeholder="500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Period</Label>
                <Select value={form.period} onValueChange={(v) => setForm({...form,period:v as 'weekly'|'monthly'|'yearly'})}>
                  <SelectTrigger className={cn(inCls, "w-full")}><SelectValue /></SelectTrigger>
                  <SelectContent className={scCls}>
                    {['weekly','monthly','yearly'].map(p => <SelectItem key={p} value={p} className={cn(scItemCls, "capitalize")}>{p.charAt(0).toUpperCase()+p.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <button type="submit" disabled={submitting||!form.category||!form.amount}
                className="w-full h-11 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 shadow-sm"
                style={{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId?'Update Budget':'Create Budget'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <div className="rounded-2xl p-16 text-center panel bg-white dark:bg-white/[0.03]">
          <div className="w-16 h-16 rounded-2xl border border-cyan-100 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No budgets yet</h3>
          <p className="text-slate-500 dark:text-white/40 text-sm mb-6">Create your first budget to start tracking spending limits</p>
          <button onClick={() => setDialogOpen(true)}
            className="h-9 px-5 rounded-xl text-white font-medium text-sm flex items-center gap-2 mx-auto transition-transform hover:scale-105 active:scale-95 shadow-sm shadow-cyan-500/20"
            style={{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
            <Plus className="w-4 h-4" /> Create First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(budget => {
            const status     = budgetStatus.find(s => s.category===budget.category);
            const spent      = status?.spent||0;
            const pct        = status?.percentage||0;
            const remaining  = budget.amount - spent;
            const Icon       = CATEGORY_ICONS[budget.category as Category]||CATEGORY_ICONS.Other;
            const isOver     = pct >= 100;
            const isWarn     = pct >= 80 && pct < 100;
            const barColor   = isOver?'#f43f5e':isWarn?'#f59e0b':'linear-gradient(90deg,#06b6d4,#3b82f6)';
            const textColor  = isOver?'text-rose-500 dark:text-rose-400':isWarn?'text-amber-500 dark:text-amber-400':'text-emerald-600 dark:text-emerald-400';
            return (
              <div key={budget._id} className="rounded-2xl p-5 panel bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${CATEGORY_COLORS[budget.category as Category]||'bg-slate-200 dark:bg-slate-700'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{budget.category}</p>
                      <p className="text-[11px] text-slate-500 dark:text-white/40 capitalize">{budget.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)} className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white dark:hover:bg-white/[0.06] rounded-lg"><Edit className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(budget._id)} className="h-8 w-8 text-slate-400 hover:text-rose-600 dark:text-rose-500/50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-white/50">{symbol}{spent.toFixed(0)} spent of {symbol}{budget.amount.toFixed(0)}</span>
                    <span className={textColor}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-white/[0.08]">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width:`${Math.min(pct,100)}%`, background:barColor }} />
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    {isOver ? <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> : isWarn ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />}
                    <span className={`text-xs ${textColor}`}>{isOver?`${symbol}${Math.abs(remaining).toFixed(0)} over budget`:`${symbol}${remaining.toFixed(0)} remaining`}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="rounded-2xl p-5 panel bg-white dark:bg-white/[0.03]">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Budget Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title:'50/30/20 Rule', body:'Allocate 50% to needs, 30% to wants, and 20% to savings and debt repayment.' },
            { title:'Track Everything', body:'Use the AI chat to quickly log expenses. Just say what you spent!' },
            { title:'Review Regularly', body:'Check your budgets weekly to stay on track and adjust as needed.' },
          ].map((t,i) => (
            <div key={i} className="rounded-xl p-4 bg-cyan-50 border border-cyan-100 dark:bg-cyan-500/[0.04] dark:border-cyan-500/15">
              <h4 className="font-semibold text-cyan-800 dark:text-white text-sm mb-1.5">{t.title}</h4>
              <p className="text-xs text-cyan-600/80 dark:text-white/50 leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
