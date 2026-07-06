'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { fetchWithAuth } from '../../../../lib/api';

type EmployeeRole = 'OWNER' | 'ADMIN' | 'MEMBER';
type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'CANCELLED';

interface MemberUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface Member {
  id: string;
  role: EmployeeRole;
  status: string;
  title: string | null;
  createdAt: string;
  user: MemberUser;
}

interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: EmployeeRole;
  status: InvitationStatus;
  createdAt: string;
}

interface MembersPage {
  items: Member[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

interface InviteForm {
  email: string;
  firstName: string;
  lastName: string;
  role: EmployeeRole;
}

const ROLE_BADGE_STYLES: Record<EmployeeRole, string> = {
  OWNER: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  ADMIN: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  MEMBER: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

function RoleBadge({ role }: { role: EmployeeRole }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_BADGE_STYLES[role]}`}>
      {role}
    </span>
  );
}

function Avatar({ user }: { user: MemberUser }) {
  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((n) => n![0].toUpperCase())
      .join('') || user.email[0].toUpperCase();

  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={`${user.firstName ?? ''} ${user.lastName ?? ''}`}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover border border-slate-800"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-inner">
      {initials}
    </div>
  );
}

export default function BusinessMembersPage() {
  const { getToken, isLoaded } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'MEMBER',
  });

  const loadMembers = useCallback(
    async (cursor?: string, searchQuery?: string) => {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        const params = new URLSearchParams({ limit: '20' });
        if (cursor) params.set('cursor', cursor);
        if (searchQuery) params.set('search', searchQuery);

        const res = await fetchWithAuth<MembersPage>(
          `/businesses/active/members?${params.toString()}`,
          token,
        );

        if (res.success) {
          if (cursor) {
            setMembers((prev) => [...prev, ...res.data.items]);
          } else {
            setMembers(res.data.items);
          }
          setNextCursor(res.data.nextCursor);
          setHasNextPage(res.data.hasNextPage);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load members';
        setError(message);
      }
    },
    [isLoaded, getToken],
  );

  useEffect(() => {
    async function initialLoad() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        await loadMembers();
        const invRes = await fetchWithAuth<Invitation[]>(
          '/businesses/active/members?_invitations=1',
          token,
        );
        if (invRes.success) setInvitations(invRes.data ?? []);
      } catch {
        // invitations may not be available if user has MEMBER role
      } finally {
        setLoading(false);
      }
    }
    void initialLoad();
  }, [isLoaded, getToken, loadMembers]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await loadMembers(undefined, search);
    setLoading(false);
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    await loadMembers(nextCursor, search || undefined);
    setLoadingMore(false);
  };

  const validateInviteForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!inviteForm.email || inviteForm.email.trim() === '') {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inviteForm.email.trim())) {
        errors.email = 'Invalid email address format';
      }
    }

    if (!inviteForm.firstName || inviteForm.firstName.trim() === '') {
      errors.firstName = 'First name is required';
    } else if (inviteForm.firstName.trim().length > 50) {
      errors.firstName = 'First name must not exceed 50 characters';
    }

    if (!inviteForm.lastName || inviteForm.lastName.trim() === '') {
      errors.lastName = 'Last name is required';
    } else if (inviteForm.lastName.trim().length > 50) {
      errors.lastName = 'Last name must not exceed 50 characters';
    }

    if (inviteForm.role === 'OWNER') {
      errors.role = 'Cannot invite a user as OWNER';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateInviteForm()) return;

    setInviteLoading(true);
    try {
      const token = await getToken();
      const res = await fetchWithAuth<Invitation>('/businesses/active/members/invite', token, {
        method: 'POST',
        body: JSON.stringify({
          email: inviteForm.email.trim().toLowerCase(),
          firstName: inviteForm.firstName.trim(),
          lastName: inviteForm.lastName.trim(),
          role: inviteForm.role,
        }),
      });

      if (res.success) {
        setInvitations((prev) => [res.data, ...prev]);
        setInviteForm({ email: '', firstName: '', lastName: '', role: 'MEMBER' });
        setFormErrors({});
        setShowInviteForm(false);
        setSuccess(`Invitation sent to ${res.data.email}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInviteForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
        <p className="text-[#94A3B8] text-sm">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Team Members
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Manage who has access to your AutoOps workspace.
          </p>
        </div>
        <button
          onClick={() => {
            setShowInviteForm((v) => !v);
            setError(null);
            setSuccess(null);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/55"
        >
          {showInviteForm ? 'Cancel' : '+ Invite Member'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {showInviteForm && (
        <form
          onSubmit={handleInvite}
          className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-5 shadow-2xl"
        >
          <div>
            <h2 className="text-base font-semibold text-white">Invite a New Member</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              They will appear as a pending invitation until they sign up.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-350">First Name</label>
              <input
                type="text"
                name="firstName"
                value={inviteForm.firstName}
                onChange={handleFormChange}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  formErrors.firstName
                    ? 'border-rose-500/50'
                    : 'border-slate-800 focus:border-slate-700'
                }`}
              />
              {formErrors.firstName && (
                <p className="text-xs text-rose-400">{formErrors.firstName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-350">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={inviteForm.lastName}
                onChange={handleFormChange}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  formErrors.lastName
                    ? 'border-rose-500/50'
                    : 'border-slate-800 focus:border-slate-700'
                }`}
              />
              {formErrors.lastName && (
                <p className="text-xs text-rose-400">{formErrors.lastName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-350">Email Address</label>
              <input
                type="text"
                name="email"
                value={inviteForm.email}
                onChange={handleFormChange}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  formErrors.email
                    ? 'border-rose-500/50'
                    : 'border-slate-800 focus:border-slate-700'
                }`}
              />
              {formErrors.email && <p className="text-xs text-rose-400">{formErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-350">Role</label>
              <select
                name="role"
                value={inviteForm.role}
                onChange={handleFormChange}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  formErrors.role ? 'border-rose-500/50' : 'border-slate-800 focus:border-slate-700'
                }`}
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
              {formErrors.role && <p className="text-xs text-rose-400">{formErrors.role}</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={inviteLoading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-800/85 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/55"
            >
              {inviteLoading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 bg-[#111827] border border-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all"
        >
          Search
        </button>
      </form>

      <div className="bg-[#111827] border border-slate-800/60 rounded-2xl overflow-hidden shadow-md">
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Active Members <span className="text-[#94A3B8] font-normal">({members.length})</span>
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/40 flex items-center justify-center border border-slate-850">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-slate-200 text-sm font-medium">No active members found.</p>
            <p className="text-[#94A3B8] text-xs">
              Invite team members to give them access to this workspace.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/10 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar user={member.user} />
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {[member.user.firstName, member.user.lastName].filter(Boolean).join(' ') ||
                        'Unnamed User'}
                    </p>
                    <p className="text-xs text-[#94A3B8]">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {member.title && (
                    <span className="text-xs text-[#94A3B8]/80 hidden sm:block">
                      {member.title}
                    </span>
                  )}
                  <RoleBadge role={member.role} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {hasNextPage && (
          <div className="px-6 py-4 border-t border-slate-800/60">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-350 text-sm font-medium transition-all disabled:opacity-60"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {invitations.length > 0 && (
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl overflow-hidden shadow-md">
          <div className="px-6 py-4 border-b border-slate-800/60">
            <h2 className="text-sm font-semibold text-slate-200">
              Pending Invitations{' '}
              <span className="text-[#94A3B8] font-normal">({invitations.length})</span>
            </h2>
          </div>
          <ul className="divide-y divide-slate-800/60">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/10 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-800 flex items-center justify-center shadow-inner">
                    <span className="text-[#94A3B8] text-sm">?</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {inv.firstName} {inv.lastName}
                    </p>
                    <p className="text-xs text-[#94A3B8]">{inv.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                    Pending
                  </span>
                  <RoleBadge role={inv.role} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
