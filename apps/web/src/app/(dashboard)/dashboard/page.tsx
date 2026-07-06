'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { fetchWithAuth } from '../../../lib/api';

interface DashboardStats {
  legalBusinessName: string;
  memberCount: number;
  onboardingStep: string;
}

interface OnboardingStatus {
  onboardingStep: string;
  completionPercentage: number;
  isCompleted: boolean;
}

interface MembersPage {
  items: unknown[];
}

interface BusinessProfile {
  legalBusinessName: string;
}

export default function DashboardPage() {
  const { getToken, isLoaded } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        const [statusRes, profileRes, membersRes] = await Promise.all([
          fetchWithAuth<OnboardingStatus>('/onboarding/status', token),
          fetchWithAuth<BusinessProfile>('/businesses/active/profile', token),
          fetchWithAuth<MembersPage>('/businesses/active/members', token),
        ]);

        setStats({
          legalBusinessName: profileRes.success
            ? profileRes.data.legalBusinessName
            : 'Your Business',
          memberCount: membersRes.success ? membersRes.data.items.length : 1,
          onboardingStep: statusRes.success ? statusRes.data.onboardingStep : 'completed',
        });
      } catch {
        // Fallback to defaults
        setStats({
          legalBusinessName: 'Your Business',
          memberCount: 1,
          onboardingStep: 'completed',
        });
      } finally {
        setLoading(false);
      }
    }
    void loadStats();
  }, [isLoaded, getToken]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-[#111827] border border-slate-800/40 rounded-xl w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-[#111827] border border-slate-800/40 rounded-2xl" />
          <div className="h-32 bg-[#111827] border border-slate-800/40 rounded-2xl" />
          <div className="h-32 bg-[#111827] border border-slate-800/40 rounded-2xl" />
        </div>
        <div className="h-64 bg-[#111827] border border-slate-800/40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="relative overflow-hidden bg-[#111827] border border-slate-800/60 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 relative z-10">
          <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
            AutoOps Workspace
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Welcome to {stats?.legalBusinessName}
          </h2>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Your multi-tenant business foundation is active. From here you can manage profile
            details, regional setting structures, and invite team members.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#94A3B8]">Team Size</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-bold text-slate-100">{stats?.memberCount || 1}</h4>
            <p className="text-xs text-[#94A3B8]/60">Active team members registered</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#94A3B8]">Business Profile</span>
            <span className="text-lg">🏢</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-bold text-slate-100">Setup Mapped</h4>
            <p className="text-xs text-[#94A3B8]/60">Active profile and localization initialized</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#94A3B8]">Onboarding Status</span>
            <span className="text-lg">✅</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-bold text-slate-100">Finished</h4>
            <p className="text-xs text-[#94A3B8]/60">All setup milestone requirements met</p>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4 lg:col-span-1 shadow-md">
          <h3 className="text-sm font-semibold text-slate-350">Quick Actions</h3>
          <div className="flex flex-col space-y-2">
            <Link
              href="/business/profile"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-850 hover:border-blue-500/30 text-slate-300 text-sm font-medium transition-all duration-200"
            >
              <span>Edit Business Profile</span>
              <span className="text-slate-500">→</span>
            </Link>
            <Link
              href="/business/settings"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-850 hover:border-blue-500/30 text-slate-300 text-sm font-medium transition-all duration-200"
            >
              <span>Edit Business Settings</span>
              <span className="text-slate-500">→</span>
            </Link>
            <Link
              href="/business/members"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-850 hover:border-blue-500/30 text-slate-300 text-sm font-medium transition-all duration-200"
            >
              <span>Invite Team Member</span>
              <span className="text-slate-500">→</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4 lg:col-span-2 shadow-md">
          <h3 className="text-sm font-semibold text-slate-355">Recent Workspace Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/40 border border-slate-850/50">
              <span className="text-xs p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                ⚡
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  Onboarding completed successfully
                </p>
                <p className="text-[10px] text-[#94A3B8]/60">Just now</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/40 border border-slate-850/50">
              <span className="text-xs p-1.5 rounded-lg bg-violet-500/10 text-violet-400">👤</span>
              <div>
                <p className="text-xs font-semibold text-slate-300">Business settings configured</p>
                <p className="text-[10px] text-[#94A3B8]/60">10 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/40 border border-slate-850/50">
              <span className="text-xs p-1.5 rounded-lg bg-blue-500/10 text-blue-400">🏢</span>
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  Business Tenant shell initialized
                </p>
                <p className="text-[10px] text-[#94A3B8]/60">15 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
