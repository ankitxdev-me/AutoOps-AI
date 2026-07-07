'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';
import { fetchWithAuth } from '../../lib/api';

interface OnboardingStatus {
  onboardingStep: string;
  completionPercentage: number;
  isCompleted: boolean;
}

interface AuthMePayload {
  user: {
    id: string;
    clerkId: string;
  };
  activeEmployee: {
    id: string;
    tenantId: string;
    tenantName: string;
  } | null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [tenantName, setTenantName] = useState('Workspace');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        // 1. Fetch user workspace profile details
        const meRes = await fetchWithAuth<AuthMePayload>('/auth/me', token);
        if (!meRes.success || !meRes.data.activeEmployee) {
          router.replace('/business/create');
          return;
        }

        setTenantName(meRes.data.activeEmployee.tenantName);

        // 2. Verify operational onboarding completions
        const res = await fetchWithAuth<OnboardingStatus>('/onboarding/status', token);
        if (res.success && res.data.onboardingStep !== 'completed') {
          router.replace('/onboarding');
        } else {
          setCheckingOnboarding(false);
        }
      } catch {
        router.replace('/business/create');
      }
    }
    void checkOnboardingStatus();
  }, [isLoaded, getToken, router]);

  const activePages = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Business Profile', href: '/business/profile', icon: '🏢' },
    { name: 'Business Settings', href: '/business/settings', icon: '⚙️' },
    { name: 'Team Members', href: '/business/members', icon: '👥' },
    { name: 'Onboarding Status', href: '/onboarding', icon: '📋' },
  ];

  const futurePages = [
    { name: 'Leads', href: '/leads', icon: '🎯' },
    { name: 'Customers', href: '/customers', icon: '🤝' },
    { name: 'Workflows', href: '/workflows', icon: '🔄' },
    { name: 'AI Assistant', href: '/assistant', icon: '🤖' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
    { name: 'Integrations', href: '/integrations', icon: '🔌' },
  ];

  // Breadcrumbs calculation
  const pathSegments = (pathname || '').split('/').filter(Boolean);
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    ...pathSegments.map((seg, idx) => {
      const href = '/' + pathSegments.slice(0, idx + 1).join('/');
      const name =
        (seg && seg.length > 0 ? seg.charAt(0).toUpperCase() : '') + (seg ? seg.slice(1) : '');
      return { name, href };
    }),
  ];

  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
        <p className="text-[#94A3B8] text-sm">Verifying onboarding status...</p>
      </div>
    );
  }

  const renderNavLinks = (items: typeof activePages, isDisabled = false) => {
    return items.map((item) => {
      const isActive = pathname === item.href;
      return (
        <Link
          key={item.href}
          href={isDisabled ? '#' : item.href}
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
            isActive
              ? 'bg-gradient-to-r from-blue-600/20 to-indigo-650/10 border-l-2 border-blue-500 text-blue-400 font-semibold'
              : isDisabled
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-[#94A3B8] hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-base">{item.icon}</span>
            <span className="text-sm">{item.name}</span>
          </div>
          {isDisabled && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 uppercase tracking-wider scale-90 group-hover:border-slate-750 transition-colors">
              Soon
            </span>
          )}
        </Link>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-blue-600/30">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-[#111827]/80 border-b border-slate-800/60 sticky top-0 z-20 backdrop-blur-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            A
          </div>
          <span className="font-bold text-base text-slate-100">{tenantName}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-white focus:outline-none p-1.5 rounded-lg bg-slate-900/50 border border-slate-850"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile Drawers */}
      <aside
        className={`${
          mobileMenuOpen ? 'flex animate-in slide-in-from-left duration-200' : 'hidden md:flex'
        } fixed inset-0 md:relative md:inset-auto z-30 md:z-10 w-full md:w-64 border-r border-slate-800/60 bg-[#111827]/90 md:bg-[#111827]/50 backdrop-blur-xl flex-col p-6 space-y-8 overflow-y-auto`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              A
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AutoOps AI
            </span>
          </div>
          {/* Mobile close toggle */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-850"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 flex flex-col space-y-6">
          <div className="space-y-1">
            <span className="px-4 text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]/60">
              Console Foundation
            </span>
            <nav className="space-y-0.5 mt-2">{renderNavLinks(activePages)}</nav>
          </div>

          <div className="space-y-1">
            <span className="px-4 text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]/60">
              Platform Roadmap
            </span>
            <nav className="space-y-0.5 mt-2">{renderNavLinks(futurePages, true)}</nav>
          </div>
        </div>

        {/* User profile footer */}
        <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserButton />
            <div className="text-xs">
              <p className="font-medium text-slate-200">
                {clerkUser?.firstName
                  ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`
                  : 'Workspace Member'}
              </p>
              <p className="text-[10px] text-[#94A3B8]/60 truncate max-w-[130px]">
                {clerkUser?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-900 bg-[#0B1220]/80 backdrop-blur-md px-6 md:px-8 flex items-center justify-between sticky top-0 z-10">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center space-x-2 text-xs md:text-sm text-[#94A3B8]">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <span className="text-slate-800">/</span>}
                <Link
                  href={crumb.href}
                  className={`hover:text-slate-200 transition-colors ${
                    idx === breadcrumbs.length - 1 ? 'text-slate-200 font-medium' : ''
                  }`}
                >
                  {crumb.name}
                </Link>
              </React.Fragment>
            ))}
          </div>

          {/* Right: Actions, Search, User Info */}
          <div className="flex items-center space-x-4">
            {/* Search Placeholder */}
            <div className="hidden md:flex items-center bg-[#111827] border border-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-[#94A3B8]/60 cursor-not-allowed">
              <span>Search settings...</span>
              <kbd className="ml-4 text-[9px] bg-slate-950 border border-slate-850 px-1 py-0.5 rounded text-slate-600">
                ⌘K
              </kbd>
            </div>

            {/* Notification Placeholder */}
            <button className="p-2 rounded-xl bg-[#111827] border border-slate-800/60 text-[#94A3B8] hover:text-slate-200 hover:bg-slate-850 cursor-not-allowed">
              🔔
            </button>

            {/* Active business label */}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {tenantName}
            </span>
          </div>
        </header>

        {/* Content Viewport container */}
        <div className="p-6 md:p-8 max-w-5xl w-full mx-auto flex-1">{children}</div>
      </main>
    </div>
  );
}
