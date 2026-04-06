'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowRight, Shield, User, Mail, Lock, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'JPY', symbol: '¥' },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name:'', email:'', password:'', currency:'INR' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.currency);
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
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" />
        
        <div className="relative z-10 flex items-center mb-16 justify-center group">
          <img src="/kasu-logo.png" alt="Kasu" className="w-[350px] h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500" />
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">Start your journey to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Financial Freedom</span></h1>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">Create your account in seconds and unlock the power of AI-driven expense management.</p>
          
          <div className="space-y-4">
            <div className={featureCls}>
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Assistant Included</h3>
                <p className="text-sm text-slate-400">Chat natively to log expenses</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 text-sm text-slate-500">
          <Shield className="w-4 h-4" /> Bank-grade securely encrypted
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center mb-12 justify-center relative group">
            <img src="/kasu-logo.png" alt="Kasu" className="w-64 h-auto object-contain drop-shadow-2xl group-hover:-translate-y-1 transition-all duration-300" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Create an account</h2>
            <p className="text-slate-500 dark:text-white/40 mt-2">Get started with your free intelligent tracker today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 text-sm font-medium flex items-center gap-2 shadow-sm">
                <Shield className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 focus-within:z-10">
                <Label className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wide">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                  <Input type="text" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} required placeholder="John Doe"
                    className="pl-10 h-11 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/50 dark:bg-white/[0.04] dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/30 rounded-xl shadow-sm dark:shadow-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wide">Currency</Label>
                <Select value={formData.currency} onValueChange={(v)=>setFormData({...formData,currency:v})}>
                  <SelectTrigger className="h-11 bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-cyan-500/50 dark:bg-white/[0.04] dark:border-white/[0.1] dark:text-white rounded-xl shadow-sm dark:shadow-none">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 dark:bg-[#0a1628] dark:border-cyan-500/15 rounded-xl shadow-lg">
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code} className="text-slate-700 focus:bg-slate-100 dark:text-white/70 dark:focus:bg-cyan-500/15 rounded-lg py-2">
                        {c.code} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wide">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                <Input type="email" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} required placeholder="you@example.com"
                  className="pl-10 h-11 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/50 dark:bg-white/[0.04] dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/30 rounded-xl shadow-sm dark:shadow-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wide">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                <Input type="password" value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} required placeholder="••••••••" minLength={6}
                  className="pl-10 h-11 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/50 dark:bg-white/[0.04] dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/30 rounded-xl shadow-sm dark:shadow-none" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 shadow-sm shadow-cyan-500/20 mt-6"
              style={{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-white/40">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 ml-1 hover:underline underline-offset-4 transition-all">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
