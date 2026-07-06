'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Members', href: '/members' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-col p-6 space-y-8">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            A
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AutoOps AI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border-l-2 border-violet-500 text-violet-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserButton />
            <div className="text-sm">
              <p className="font-medium text-slate-200">Active Session</p>
              <p className="text-xs text-slate-500">AutoOps User</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <header className="h-16 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="font-semibold text-lg text-slate-200">
            {pathname === '/settings' ? 'Business Profile Settings' : 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Tenant
            </span>
          </div>
        </header>
        <div className="p-8 max-w-5xl w-full mx-auto flex-1">{children}</div>
      </main>
    </div>
  );
}
