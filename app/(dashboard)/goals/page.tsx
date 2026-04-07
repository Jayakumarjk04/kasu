'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Loader2, Target, PiggyBank, Flame, Home, Plane, Car, Gift, Briefcase, Zap, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/lib/context/AuthContext';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface Goal { _id: string; title: string; targetAmount: number; currentAmount: number; deadline?: string; color: string; icon: string; status: 'active' | 'completed' | 'paused'; }

const inCls = "h-10 border-0 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 dark:bg-white/[0.06] dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/30";

const GOAL_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-cyan-500'
];

const GOAL_ICONS = [
  'Target', 'PiggyBank', 'Flame', 'Home', 'Plane', 'Car', 'Briefcase', 'Heart', 'Zap', 'Gift'
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create/Edit form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', targetAmount: '', deadline: '', color: 'bg-emerald-500', icon: 'Target' });
  const [submitting, setSubmitting] = useState(false);

  // Fund form
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [fundingGoal, setFundingGoal] = useState<Goal | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);

  const { toast } = useToast();
  const symbol = useCurrency();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals');
      if (res.ok) setGoals(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const url = editingId ? `/api/goals/${editingId}` : '/api/goals';
      const m = editingId ? 'PUT' : 'POST';
      const r = await fetch(url, { method: m, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, targetAmount: parseFloat(form.targetAmount) }) });
      if (r.ok) {
        toast({ title: editingId ? 'Goal updated' : 'Goal created' });
        setDialogOpen(false);
        setForm({ title: '', targetAmount: '', deadline: '', color: 'bg-emerald-500', icon: 'Target' });
        setEditingId(null);
        fetchGoals();
      } else {
        const data = await r.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingGoal) return;
    setFunding(true);
    try {
      const r = await fetch(`/api/goals/${fundingGoal._id}/fund`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(fundAmount) }) });
      if (r.ok) {
        toast({ title: 'Funds Added!' });
        setFundDialogOpen(false);
        setFundAmount('');
        setFundingGoal(null);
        fetchGoals();
      } else {
        const data = await r.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setFunding(false); }
  };

  const handleEdit = (g: Goal) => {
    setEditingId(g._id);
    setForm({ title: g.title, targetAmount: g.targetAmount.toString(), deadline: g.deadline ? g.deadline.split('T')[0] : '', color: g.color, icon: g.icon });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal entirely?')) return;
    try {
      const r = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (r.ok) { toast({ title: 'Deleted' }); fetchGoals(); }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Savings Goals</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-0.5">Fund your dreams using your net balance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if(!o) { setForm({ title: '', targetAmount: '', deadline: '', color: 'bg-emerald-500', icon: 'Target' }); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <button className="h-9 px-4 rounded-xl text-white font-medium text-sm flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-sm shadow-emerald-500/20 w-fit cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              <Plus className="w-4 h-4" /> Create Goal
            </button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl border border-slate-200 dark:border-emerald-500/15 shadow-2xl bg-white dark:bg-[#0a1628]">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">{editingId ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-white/50 text-sm">Set a target to save towards.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Goal Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className={inCls} placeholder="e.g. Vacation Fund" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Target Amount ({symbol})</Label>
                  <Input type="number" step="1" min="1" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} required className={inCls} placeholder="5000" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Deadline (Optional)</Label>
                  <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className={inCls} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {GOAL_COLORS.map(c => (
                    <div key={c} onClick={() => setForm({...form, color: c})} className={`w-8 h-8 rounded-full cursor-pointer ${c} ${form.color === c ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-[#0a1628]' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Icon</Label>
                <div className="flex gap-2 flex-wrap text-slate-500 dark:text-white/50">
                  {GOAL_ICONS.map(i => {
                    const IconComp = (LucideIcons as any)[i];
                    return (
                      <div key={i} onClick={() => setForm({...form, icon: i})} className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer border ${form.icon === i ? 'bg-emerald-500 text-white border-transparent' : 'border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05]'}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                    );
                  })}
                </div>
              </div>
              <button type="submit" disabled={submitting || !form.title || !form.targetAmount}
                className="w-full h-11 mt-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 shadow-sm cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Save Changes' : 'Create Goal'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-2xl panel bg-white dark:bg-white/[0.03]">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-400 dark:text-white/20" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No savings goals yet</h3>
          <p className="text-slate-500 dark:text-white/40 text-sm">Create a goal to start allocating your net balance towards it.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40">Active Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map(g => {
                  const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                  const Icon = (LucideIcons as any)[g.icon] || Target;
                  return (
                    <div key={g._id} className="rounded-2xl p-5 panel bg-white dark:bg-white/[0.03] shadow-sm flex flex-col group relative overflow-hidden">
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(g)} className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white rounded-md"><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(g._id)} className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:text-white/30 dark:hover:text-rose-400 rounded-md"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className={`w-10 h-10 rounded-xl ${g.color} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{g.title}</h3>
                          {g.deadline && <p className="text-xs text-slate-500 dark:text-white/40">Target: {format(new Date(g.deadline), 'MMM d, yyyy')}</p>}
                        </div>
                      </div>
                      <div className="mb-2 flex items-end justify-between">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{symbol}{g.currentAmount.toFixed(0)}</div>
                        <div className="text-sm font-medium text-slate-500 dark:text-white/50">of {symbol}{g.targetAmount.toFixed(0)}</div>
                      </div>
                      <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden mb-4">
                        <div className={`absolute top-0 left-0 h-full ${g.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-white/40">{pct}% Complete</span>
                        <Button onClick={() => { setFundingGoal(g); setFundDialogOpen(true); }} className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-xs font-semibold cursor-pointer shadow-sm">
                          Add Funds
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40">Completed</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {completedGoals.map(g => {
                  const Icon = (LucideIcons as any)[g.icon] || Target;
                  return (
                    <div key={g._id} className="rounded-xl p-4 panel bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] flex items-center gap-3 opacity-75 grayscale-[30%]">
                      <div className={`w-10 h-10 rounded-full ${g.color} flex items-center justify-center text-white flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-slate-900 dark:text-white line-through">{g.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-white/40">{symbol}{g.targetAmount.toFixed(0)} reached</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(g._id)} className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:text-white/30 dark:hover:text-rose-400 rounded-md ml-auto"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fund Modal */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-[400px] rounded-2xl border border-slate-200 dark:border-cyan-500/15 shadow-xl bg-white dark:bg-[#0a1628]">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Fund Goal</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-white/50 text-sm">Add money to <strong className="text-slate-700 dark:text-white/80">{fundingGoal?.title}</strong>.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFund} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">Amount to Add ({symbol})</Label>
              <Input type="number" step="0.01" min="0.01" value={fundAmount} onChange={e => setFundAmount(e.target.value)} required className={inCls} autoFocus />
            </div>
            <button type="submit" disabled={funding || !fundAmount}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 cursor-pointer shadow-md">
              {funding && <Loader2 className="w-4 h-4 animate-spin" />}
              Fund {symbol}{fundAmount || '0'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
