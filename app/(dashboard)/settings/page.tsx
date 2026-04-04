'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Download, Trash2, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast }        = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (res.ok) {
        const blob = await res.blob(); const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `all-expenses-${new Date().toISOString().split('T')[0]}.csv`; a.click();
        window.URL.revokeObjectURL(url);
        toast({ title:'Export successful', description:'Your data has been exported.' });
      }
    } catch(e){ console.error(e); toast({title:'Export failed',variant:'destructive'}); }
    finally { setExporting(false); }
  };

  const handleClearChat = async () => {
    if (!confirm('Clear all chat history?')) return;
    try {
      const r = await fetch('/api/chat',{method:'DELETE'});
      if (r.ok) toast({title:'Chat cleared', description:'Your chat history has been deleted.'});
    } catch(e){ console.error(e); toast({title:'Failed to clear chat',variant:'destructive'}); }
  };

  const panelCls = "rounded-2xl overflow-hidden panel bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none";
  const rowCls   = "flex items-center justify-between px-5 py-4";
  const headerCls = "px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-transparent flex items-center gap-3";
  const inputCls = "h-10 text-slate-500 bg-slate-50 border-slate-200 dark:text-white/60 dark:bg-white/[0.04] dark:border-white/[0.07] rounded-xl cursor-not-allowed";

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-white/40 text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className={panelCls}>
        <div className={headerCls}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-cyan-100 border-cyan-200 dark:bg-cyan-500/15 dark:border-cyan-500/20">
            <User className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Profile</p>
            <p className="text-[11px] text-slate-500 dark:text-white/40">Your account information</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {[{label:'Name',value:user?.name||''},{label:'Email',value:user?.email||''},{label:'Currency',value:user?.currency||'INR'}].map(f => (
            <div key={f.label} className="space-y-1.5">
              <Label className="text-slate-500 dark:text-white/50 text-xs font-semibold uppercase tracking-wide">{f.label}</Label>
              <Input value={f.value} disabled className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className={panelCls}>
        <div className={headerCls}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-blue-100 border-blue-200 dark:bg-blue-500/15 dark:border-blue-500/20">
            <Download className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Data Management</p>
            <p className="text-[11px] text-slate-500 dark:text-white/40">Export and manage your data</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          <div className={rowCls}>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white/90">Export All Expenses</p>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Download all your expenses as a CSV file</p>
            </div>
            <button onClick={handleExportAll} disabled={exporting}
              className="h-9 px-4 rounded-xl text-sm flex items-center gap-2 font-medium transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 bg-cyan-50 border border-cyan-200 text-cyan-700 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400 shadow-sm">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export
            </button>
          </div>
          <div className={rowCls}>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white/90">Clear Chat History</p>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Delete all AI chat messages permanently</p>
            </div>
            <button onClick={handleClearChat}
              className="h-9 px-4 rounded-xl text-sm flex items-center gap-2 font-medium transition-transform hover:scale-105 active:scale-95 bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 shadow-sm">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className={panelCls}>
        <div className={headerCls}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-emerald-100 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/20">
            <Shield className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Security</p>
            <p className="text-[11px] text-slate-500 dark:text-white/40">Account security options</p>
          </div>
        </div>
        <div className={rowCls}>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white/90">Sign Out</p>
            <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Sign out from your account on this device</p>
          </div>
          <button onClick={logout}
            className="h-9 px-4 rounded-xl text-sm flex items-center gap-2 font-medium transition-transform hover:scale-105 active:scale-95 bg-slate-100 border border-slate-200 text-slate-700 dark:bg-white/[0.06] dark:border-white/[0.1] dark:text-white/70 shadow-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="rounded-2xl py-6 text-center panel bg-slate-50 dark:bg-transparent shadow-sm dark:shadow-none border border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <p className="text-sm font-semibold text-slate-600 dark:text-white/60">kasu Expense Tracker v1.0.0</p>
        </div>
        <p className="text-xs text-slate-400 dark:text-white/30">Powered by Google Gemini AI</p>
      </div>
    </div>
  );
}
