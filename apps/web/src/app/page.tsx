'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { fetchWithAuth } from '../lib/api';

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

export default function RootLandingPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkUserRouting() {
      if (!isLoaded) return;
      if (!isSignedIn) {
        setCheckingAuth(false);
        return;
      }

      try {
        const token = await getToken();
        // 1. Check if user belongs to a business
        const authMeRes = await fetchWithAuth<AuthMePayload>('/auth/me', token);

        if (!authMeRes.success || !authMeRes.data.activeEmployee) {
          // No business context -> redirect to create business page
          router.replace('/business/create');
          return;
        }

        // 2. Check if business completed onboarding
        const onboardingRes = await fetchWithAuth<OnboardingStatus>('/onboarding/status', token);

        if (onboardingRes.success && onboardingRes.data.onboardingStep !== 'completed') {
          router.replace('/onboarding');
        } else {
          router.replace('/dashboard');
        }
      } catch {
        // Safe fallback in case of errors
        router.replace('/business/create');
      }
    }

    void checkUserRouting();
  }, [isLoaded, isSignedIn, getToken, router]);

  // While verifying session route destination, display a loading screen
  if (!isLoaded || (isSignedIn && checkingAuth)) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
        <p className="text-[#94A3B8] text-sm">Configuring workspace shell...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 font-sans selection:bg-blue-600/30">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B1220]/80 border-b border-slate-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-[#8B5CF6] flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              A
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AutoOps AI
            </span>
          </div>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#94A3B8]">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#roadmap" className="hover:text-white transition-colors">
              Roadmap
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/10"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/10"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6 text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#8B5CF6]/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            🚀 Powered by AutoOps Core
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              AutoOps AI
            </span>
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-[#8B5CF6] tracking-wide">
            AI-Powered Business Operating System
          </p>
          <p className="text-base text-[#94A3B8] max-w-lg mx-auto leading-relaxed">
            Describe your business in plain English. Let AI automate your operations. Initiate
            workflows, map metrics, and manage teams contextually.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/10 focus:outline-none"
            >
              Get Started for Free
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium text-sm transition-all focus:outline-none"
            >
              Access Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Built for Scale
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
            Everything your team needs to map business processes, handle tasks, and scale
            multi-tenant models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/60 space-y-3 hover:border-blue-500/20 transition-all duration-300">
            <div className="text-2xl">🔒</div>
            <h3 className="text-base font-bold text-slate-100">Secure Authentication</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Protected endpoints and strict multi-tenant boundaries using Clerk credentials and
              local token guard policies.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/60 space-y-3 hover:border-blue-500/20 transition-all duration-300">
            <div className="text-2xl">🏢</div>
            <h3 className="text-base font-bold text-slate-100">Business Management</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Comprehensive profile definitions and settings layouts. Align localization, timezone
              preferences, and operating hours.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/60 space-y-3 hover:border-blue-500/20 transition-all duration-300">
            <div className="text-2xl">👥</div>
            <h3 className="text-base font-bold text-slate-100">Team Collaboration</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Invite active team members with granular roles (OWNER, ADMIN, MEMBER). Restrict
              actions contextually.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/60 space-y-3 hover:border-blue-500/20 transition-all duration-300">
            <div className="text-2xl">📊</div>
            <h3 className="text-base font-bold text-slate-100">Modern Dashboard</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Interactive widgets summarizing active team metrics, quick shortcuts, settings
              configuration status, and activity feeds.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/60 space-y-3 hover:border-blue-500/20 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-semibold text-blue-400 uppercase tracking-widest">
              Soon
            </div>
            <div className="text-2xl">🤖</div>
            <h3 className="text-base font-bold text-slate-100">AI Automation</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Harness AI capabilities to query customer data, write reports, and deploy custom
              trigger setups.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/60 space-y-3 hover:border-blue-500/20 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-semibold text-blue-400 uppercase tracking-widest">
              Soon
            </div>
            <div className="text-2xl">🔄</div>
            <h3 className="text-base font-bold text-slate-100">Workflow Engine</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Run background tasks, setup conditional integrations, and automate email workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="about" className="bg-[#111827]/40 border-y border-slate-900 py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Streamline Operations. Save Time.
            </h2>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              AutoOps AI reduces configuration overhead by utilizing a centralized business shell.
              Save hundreds of hours on workspace administration and operational tracking.
            </p>
            <ul className="space-y-3">
              {[
                'Save hours on administrative configuration',
                'Reduce manual multi-tenant database operations',
                'Improve team mapping productivity instantly',
                'Integrate pending membership workflows smoothly',
                'Prepare business data architecture for future AI agents',
              ].map((benefit, idx) => (
                <li
                  key={idx}
                  className="flex items-center space-x-3 text-sm text-slate-200 font-medium"
                >
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 rounded-3xl bg-[#111827] border border-slate-800/60 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/10 blur-2xl rounded-full" />
            <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
              Metrics Snapshot
            </h4>
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-white">99.9%</p>
                <p className="text-xs text-[#94A3B8]">Database Uptime</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-white">100%</p>
                <p className="text-xs text-[#94A3B8]">Tenant Isolation</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-white">&lt; 50ms</p>
                <p className="text-xs text-[#94A3B8]">API Response Envelope</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-white">10x</p>
                <p className="text-xs text-[#94A3B8]">Workflow Speedup</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            SaaS Roadmap
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-sm mx-auto">
            Our upcoming modules to enhance operations, CRM channels, and automation flows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/60 space-y-3">
            <h4 className="text-base font-bold text-white">Sprint 3: CRM & Integrations</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Integrates customizable lead capture pipelines, customer tracking widgets, and
              external communication Webhooks to channel incoming operational items.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/60 space-y-3">
            <h4 className="text-base font-bold text-white">Sprint 4: AI & Workflow Deployments</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Activates the core AI agent interface to parse leads, write conditional automation
              scripts, and sync tasks to backend processors with one-click actions.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/20 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[#94A3B8] text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-[#8B5CF6] flex items-center justify-center font-bold text-white text-[10px]">
              A
            </div>
            <span className="font-semibold text-slate-200">AutoOps AI</span>
          </div>

          <div className="flex space-x-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub Repository
            </a>
            <span className="text-slate-800">|</span>
            <span>Hackathon Project</span>
          </div>

          <div>© {new Date().getFullYear()} AutoOps AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
