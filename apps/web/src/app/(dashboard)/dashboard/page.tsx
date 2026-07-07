'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { fetchWithAuth } from '../../../lib/api';

interface BusinessSummary {
  business: {
    id: string;
    name: string;
    industry: string;
    createdAt: string;
    profile: {
      createdAt: string;
      updatedAt: string;
    } | null;
    settings: {
      createdAt: string;
      updatedAt: string;
    } | null;
  } | null;
  members: {
    activeCount: number;
    pendingCount: number;
  };
  workflows: number;
  agents: number;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export default function DashboardPage() {
  const { getToken, isLoaded } = useAuth();
  const [summary, setSummary] = useState<BusinessSummary | null>(null);
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        const res = await fetchWithAuth<BusinessSummary>('/dashboard/summary', token);

        if (res.success && res.data) {
          setSummary(res.data);

          // Construct Dynamic Activity Feed (Task 8)
          const activities: ActivityItem[] = [];

          // 1. Business Created
          if (res.data.business) {
            activities.push({
              id: 'biz-created',
              type: 'system',
              message: `Business "${res.data.business.name}" created`,
              timestamp: res.data.business.createdAt || new Date().toISOString(),
              icon: '🏢',
              iconBg: 'bg-blue-500/10',
              iconColor: 'text-blue-400',
            });
          }

          // 2. Profile Updated
          if (res.data.business?.profile) {
            const profile = res.data.business.profile;
            if (profile.updatedAt && profile.updatedAt !== profile.createdAt) {
              activities.push({
                id: 'profile-updated',
                type: 'system',
                message: 'Business profile updated',
                timestamp: profile.updatedAt,
                icon: '📝',
                iconBg: 'bg-[#14B8A6]/10',
                iconColor: 'text-[#14B8A6]',
              });
            }
          }

          // 3. Settings Updated
          if (res.data.business?.settings) {
            const settings = res.data.business.settings;
            if (settings.updatedAt && settings.updatedAt !== settings.createdAt) {
              activities.push({
                id: 'settings-updated',
                type: 'system',
                message: 'Settings updated',
                timestamp: settings.updatedAt,
                icon: '⚙️',
                iconBg: 'bg-purple-500/10',
                iconColor: 'text-purple-400',
              });
            }
          }

          // 4. Load client side localStorage actions (like cancels, removes, resends, invites)
          const localActions = JSON.parse(
            localStorage.getItem(`activity_${res.data.business?.id}`) || '[]',
          ) as Array<{
            type: string;
            email?: string;
            name?: string;
            oldRole?: string;
            newRole?: string;
            timestamp: string;
          }>;

          localActions.forEach((act, idx) => {
            if (act.type === 'invite') {
              activities.push({
                id: `local-invite-${idx}`,
                type: 'invite',
                message: `Member invited: ${act.email}`,
                timestamp: act.timestamp,
                icon: '✉️',
                iconBg: 'bg-amber-500/10',
                iconColor: 'text-amber-400',
              });
            } else if (act.type === 'cancel_invite') {
              activities.push({
                id: `local-cancel-${idx}`,
                type: 'cancel',
                message: `Invitation to ${act.email} cancelled`,
                timestamp: act.timestamp,
                icon: '✕',
                iconBg: 'bg-rose-500/10',
                iconColor: 'text-rose-400',
              });
            } else if (act.type === 'remove_member') {
              activities.push({
                id: `local-remove-${idx}`,
                type: 'remove',
                message: `Member removed: ${act.name}`,
                timestamp: act.timestamp,
                icon: '👤',
                iconBg: 'bg-rose-500/10',
                iconColor: 'text-rose-400',
              });
            } else if (act.type === 'role_change') {
              activities.push({
                id: `local-role-${idx}`,
                type: 'role',
                message: `${act.name}'s role updated to ${act.newRole}`,
                timestamp: act.timestamp,
                icon: '⚡',
                iconBg: 'bg-emerald-500/10',
                iconColor: 'text-emerald-400',
              });
            }
          });

          // Sort activities newest first
          activities.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
          setFeed(activities);
        }
      } catch {
        // Fallback to default state
        setSummary(null);
        setFeed([]);
      } finally {
        setLoading(false);
      }
    }
    void loadDashboardData();
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

  const businessName = summary?.business?.name || 'Your Business';
  const industry = summary?.business?.industry || 'Real Estate';
  const createdDate = summary?.business?.createdAt
    ? new Date(summary.business.createdAt).toLocaleDateString()
    : 'N/A';

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="relative overflow-hidden bg-[#111827] border border-slate-800/60 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 relative z-10">
          <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
            AutoOps Workspace
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Welcome to {businessName}
          </h2>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Your multi-tenant business foundation is active. From here you can manage profile
            details, regional setting structures, and invite team members.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#94A3B8]">Total Members</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-bold text-slate-100">
              {summary?.members.activeCount || 0}
            </h4>
            <p className="text-xs text-[#94A3B8]/60">Active team members registered</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#94A3B8]">Pending Invites</span>
            <span className="text-lg">✉️</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-bold text-slate-100">
              {summary?.members.pendingCount || 0}
            </h4>
            <p className="text-xs text-[#94A3B8]/60">Awaiting user confirmation</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#94A3B8]">Running Workflows</span>
            <span className="text-lg">🔄</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-bold text-slate-100">0</h4>
            <p className="text-xs text-[#94A3B8]/60">Sprint 3 Feature</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#94A3B8]">AI Agents</span>
            <span className="text-lg">🤖</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-bold text-slate-100">0</h4>
            <p className="text-xs text-[#94A3B8]/60">Sprint 4 Feature</p>
          </div>
        </div>
      </div>

      {/* Business Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">
              Business Name
            </p>
            <h5 className="text-sm font-bold text-slate-100 mt-1">{businessName}</h5>
          </div>
          <span className="text-xl">🏢</span>
        </div>

        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Industry</p>
            <h5 className="text-sm font-bold text-slate-100 mt-1">{industry}</h5>
          </div>
          <span className="text-xl">🎯</span>
        </div>

        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">
              Created Date
            </p>
            <h5 className="text-sm font-bold text-slate-100 mt-1">{createdDate}</h5>
          </div>
          <span className="text-xl">📅</span>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
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

        {/* Recent Activity */}
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4 lg:col-span-2 shadow-md">
          <h3 className="text-sm font-semibold text-slate-355">Recent Workspace Activity</h3>

          {feed.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-1">
              <span className="text-2xl">⚡</span>
              <p className="text-slate-400 text-xs">No business activity yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {feed.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/40 border border-slate-850/50"
                >
                  <span className={`text-xs p-1.5 rounded-lg ${item.iconBg} ${item.iconColor}`}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-300 truncate">{item.message}</p>
                    <p className="text-[10px] text-[#94A3B8]/60 mt-0.5">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
