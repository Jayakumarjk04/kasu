'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Topbar } from '@/components/Topbar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#050d1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', boxShadow: '0 0 30px rgba(6,182,212,0.45)' }}>
            <Loader2 className="w-7 h-7 animate-spin text-white" />
          </div>
          <p className="text-slate-500 dark:text-white/40 text-sm">Loading kasu...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#050d1a]">
      <Topbar />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <ChatPanel />
    </div>
  );
}
