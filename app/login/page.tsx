'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowRight, Wallet, PieChart, Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) { 
      setError(err.message || 'An unexpected error occurred'); 
    }
    finally { setLoading(false); }
  };

  const featureCls = "flex items-center gap-4 bg-white/5 dark:bg-white/[0.04] p-4 rounded-xl border border-white/10 dark:border-white/[0.05] backdrop-blur-sm";

  return (
    <div className="min-h-screen flex transition-colors bg-slate-50 dark:bg-[#050d1a]">
      {/* Absolute theme toggle for guest view */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Left panel - Decorative */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #050d1a 100%)' }}>
        {/* Glow orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]" style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl">kasu</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">Master your finances with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Intelligent AI</span></h1>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">Join thousands of users tracking their expenses effortlessly using natural language.</p>
          
          <div className="space-y-4">
            <div className={featureCls}>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Smart Tracking</h3>
                <p className="text-sm text-slate-400">Just type what you spent</p>
              </div>
            </div>
            <div className={featureCls}>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Visual Analytics</h3>
                <p className="text-sm text-slate-400">Beautiful charts & insights</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 text-sm text-slate-500">
          <Shield className="w-4 h-4" /> Secure & Encrypted Connection
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-cyan-500/20" style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-xl">kasu</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="text-slate-500 dark:text-white/40 mt-2">Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 text-sm font-medium flex items-center gap-2 shadow-sm">
                <Shield className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wide">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"
                  className="pl-10 h-11 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/50 dark:bg-white/[0.04] dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/30 rounded-xl shadow-sm dark:shadow-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wide">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"
                  className="pl-10 h-11 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/50 dark:bg-white/[0.04] dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/30 rounded-xl shadow-sm dark:shadow-none" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 shadow-sm shadow-cyan-500/20 mt-6"
              style={{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-white/40">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 ml-1 hover:underline underline-offset-4 transition-all">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
