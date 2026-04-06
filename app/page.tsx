'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="text-center">
        <div className="flex items-center justify-center mb-10 relative group">
          <img src="/kasu-logo.png" alt="kasu logo" className="w-80 md:w-[450px] h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] animate-pulse" style={{ filter: 'brightness(1) invert(0)' }} />
        </div>
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-400" />
      </div>
    </div>
  );
}
