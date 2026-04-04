'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Wallet,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useCurrency } from '@/lib/context/AuthContext';

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/transactions',  label: 'Transactions', icon: Receipt },
  { href: '/analytics',     label: 'Analytics',    icon: PieChart },
  { href: '/budgets',       label: 'Budgets',      icon: Wallet },
  { href: '/settings',      label: 'Settings',     icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const symbol = useCurrency();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0a0813] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
        <div className="relative w-10 h-10 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 0 20px rgba(124,58,237,0.45)',
            }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-tight">kasu</h1>
          <p className="text-[11px] text-white/30">Expense Tracker</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 px-3 mb-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'text-white'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
              )}
              style={
                isActive
                  ? {
                      background:
                        'linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(99,102,241,0.08) 100%)',
                      border: '1px solid rgba(139,92,246,0.25)',
                    }
                  : {}
              }
            >
              {/* Left accent bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{
                    background: 'linear-gradient(180deg,#a78bfa,#818cf8)',
                    boxShadow: '0 0 8px rgba(167,139,250,0.7)',
                  }}
                />
              )}
              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-all duration-200',
                  isActive
                    ? 'text-violet-400'
                    : 'text-white/35 group-hover:text-white/65'
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400"
                  style={{ boxShadow: '0 0 6px rgba(167,139,250,0.9)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom tip */}
      <div className="p-3 border-t border-white/[0.06]">
        <div
          className="relative rounded-xl p-4 overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.10) 100%)',
            border: '1px solid rgba(139,92,246,0.22)',
          }}
        >
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-violet-500/20 blur-xl pointer-events-none" />
          <Zap className="w-4 h-4 text-violet-400 mb-2" />
          <p className="text-xs font-semibold text-white/80 mb-0.5">Quick Add</p>
          <p className="text-[11px] text-white/38 leading-relaxed">
            Chat: &ldquo;Spent {symbol}200 on lunch&rdquo;
          </p>
        </div>
      </div>
    </aside>
  );
}
