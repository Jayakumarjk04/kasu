'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Settings, Sparkles, LayoutDashboard, Receipt, PieChart, Wallet, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/analytics',    label: 'Analytics',    icon: PieChart },
  { href: '/budgets',      label: 'Budgets',      icon: Wallet },
  { href: '/settings',     label: 'Settings',     icon: Settings },
];

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      <header className="sticky top-0 z-40 w-full nav-header backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', boxShadow: '0 0 16px rgba(6,182,212,0.4)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base hidden sm:block">kasu</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'nav-active flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
                      : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  )}
                >
                  <item.icon className={cn('w-4 h-4', isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-white/40')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: toggle + user + mobile toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />

            {/* Mobile menu button */}
            <Button
              variant="ghost" size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white rounded-xl"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-auto rounded-xl text-slate-700 hover:text-slate-900 dark:text-white/80 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/20"
                    style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}
                  >
                    {initials}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end" className="w-52 rounded-xl shadow-2xl bg-white dark:bg-[#0a1628] border-slate-200 dark:border-cyan-500/15"
              >
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-cyan-500/10">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-white/40 truncate">{user?.email}</p>
                </div>
                <div className="p-1 mt-0.5">
                  <DropdownMenuItem asChild className="rounded-lg text-slate-600 dark:text-white/60 focus:bg-slate-100 dark:focus:bg-white/[0.06] cursor-pointer">
                    <Link href="/settings"><Settings className="w-4 h-4 mr-2" />Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-cyan-500/10 my-1" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-rose-500 focus:text-rose-600 focus:bg-rose-50 dark:text-rose-400 dark:focus:text-rose-300 dark:focus:bg-rose-500/10 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />Sign Out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-30 animate-slide-down nav-header backdrop-blur-xl border-b shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10' : 'text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                  )}
                >
                  <item.icon className={cn('w-4 h-4', isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-white/40')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
