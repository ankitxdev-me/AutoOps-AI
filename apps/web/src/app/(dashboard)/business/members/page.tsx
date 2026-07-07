'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { fetchWithAuth } from '../../../../lib/api';
import { useToast } from '../../../../context/ToastContext';

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

interface AuthMePayload {
  user: {
    id: string;
    clerkId: string;
  };
  activeEmployee: {
    id: string;
    tenantId: string;
    tenantName: string;
    role: EmployeeRole;
    userId: string;
  } | null;
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
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const email = user?.email || '';

  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((n) => (n && n.length > 0 ? n[0].toUpperCase() : ''))
      .filter(Boolean)
      .join('') || (email && email.length > 0 ? email[0].toUpperCase() : '?');

  if (user?.avatarUrl) {
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
  const toast = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [callerEmployee, setCallerEmployee] = useState<AuthMePayload['activeEmployee']>(null);

  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

  // Modal States
  const [roleModal, setRoleModal] = useState<{
    employeeId: string;
    name: string;
    currentRole: EmployeeRole;
    newRole: EmployeeRole;
  } | null>(null);

  const [removeModal, setRemoveModal] = useState<{
    employeeId: string;
    name: string;
  } | null>(null);

  const [cancelModal, setCancelModal] = useState<{
    invitationId: string;
    email: string;
  } | null>(null);

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

        if (res.success && res.data) {
          const newItems = Array.isArray(res.data.items) ? res.data.items : [];
          if (cursor) {
            setMembers((prev) => [...(prev ?? []), ...newItems]);
          } else {
            setMembers(newItems);
          }
          setNextCursor(res.data.nextCursor || null);
          setHasNextPage(!!res.data.hasNextPage);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load members';
        setError(message);
        toast.error(message);
      }
    },
    [isLoaded, getToken, toast],
  );

  const loadData = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();

      // 1. Fetch Auth caller context
      const authMe = await fetchWithAuth<AuthMePayload>('/auth/me', token);
      if (authMe.success && authMe.data) {
        setCallerEmployee(authMe.data.activeEmployee);
      }

      // 2. Fetch Active Members
      await loadMembers();

      // 3. Fetch Pending Invitations
      const invRes = await fetchWithAuth<Invitation[]>(
        '/businesses/active/members?_invitations=1',
        token,
      );
      if (invRes.success && Array.isArray(invRes.data)) {
        setInvitations(invRes.data);
      } else {
        setInvitations([]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load team data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, getToken, loadMembers]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
    const toastId = toast.loading('Sending invitation...');
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

      if (res.success && res.data) {
        setInvitations((prev) => [res.data, ...(prev ?? [])]);
        setInviteForm({ email: '', firstName: '', lastName: '', role: 'MEMBER' });
        setFormErrors({});
        setShowInviteForm(false);
        setSuccess(`Invitation sent to ${res.data.email}`);
        toast.dismiss(toastId);
        toast.success(`Invitation sent to ${res.data.email}`);
        // Log activity client side
        const localAct = JSON.parse(
          localStorage.getItem(`activity_${callerEmployee?.tenantId}`) || '[]',
        );
        localStorage.setItem(
          `activity_${callerEmployee?.tenantId}`,
          JSON.stringify([
            { type: 'invite', email: res.data.email, timestamp: new Date().toISOString() },
            ...localAct,
          ]),
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(message);
      toast.dismiss(toastId);
      toast.error(message);
    } finally {
      setInviteLoading(false);
    }
  };

  const executeRoleChange = async () => {
    if (!roleModal) return;
    const { employeeId, currentRole, newRole, name } = roleModal;
    setRoleModal(null);

    const oldMembers = [...members];
    // Optimistic Update
    setMembers((prev) =>
      (prev ?? []).map((m) => (m.id === employeeId ? { ...m, role: newRole } : m)),
    );

    const toastId = toast.loading(`Updating ${name}'s role to ${newRole}...`);
    try {
      const token = await getToken();
      const res = await fetchWithAuth<Member>(
        `/businesses/active/members/${employeeId}/role`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({ role: newRole }),
        },
      );

      if (res.success && res.data) {
        toast.dismiss(toastId);
        toast.success(`${name}'s role updated to ${newRole}`);

        // Log activity
        const localAct = JSON.parse(
          localStorage.getItem(`activity_${callerEmployee?.tenantId}`) || '[]',
        );
        localStorage.setItem(
          `activity_${callerEmployee?.tenantId}`,
          JSON.stringify([
            {
              type: 'role_change',
              name,
              oldRole: currentRole,
              newRole,
              timestamp: new Date().toISOString(),
            },
            ...localAct,
          ]),
        );
      } else {
        throw new Error('Failed to update member role');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      setMembers(oldMembers); // Rollback
      toast.dismiss(toastId);
      toast.error(message);
    }
  };

  const executeRemoveMember = async () => {
    if (!removeModal) return;
    const { employeeId, name } = removeModal;
    setRemoveModal(null);

    setActionLoadingId(employeeId);
    const toastId = toast.loading(`Removing ${name} from business...`);
    try {
      const token = await getToken();
      const res = await fetchWithAuth(`/businesses/active/members/${employeeId}`, token, {
        method: 'DELETE',
      });

      if (res.success) {
        setMembers((prev) => (prev ?? []).filter((m) => m.id !== employeeId));
        toast.dismiss(toastId);
        toast.success(`${name} has been removed.`);

        // Log activity
        const localAct = JSON.parse(
          localStorage.getItem(`activity_${callerEmployee?.tenantId}`) || '[]',
        );
        localStorage.setItem(
          `activity_${callerEmployee?.tenantId}`,
          JSON.stringify([
            { type: 'remove_member', name, timestamp: new Date().toISOString() },
            ...localAct,
          ]),
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      toast.dismiss(toastId);
      toast.error(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const executeCancelInvitation = async () => {
    if (!cancelModal) return;
    const { invitationId, email } = cancelModal;
    setCancelModal(null);

    setActionLoadingId(invitationId);
    const toastId = toast.loading(`Cancelling invitation to ${email}...`);
    try {
      const token = await getToken();
      const res = await fetchWithAuth(
        `/businesses/active/members/invitations/${invitationId}`,
        token,
        {
          method: 'DELETE',
        },
      );

      if (res.success) {
        setInvitations((prev) => (prev ?? []).filter((inv) => inv.id !== invitationId));
        toast.dismiss(toastId);
        toast.success(`Invitation to ${email} cancelled.`);

        // Log activity
        const localAct = JSON.parse(
          localStorage.getItem(`activity_${callerEmployee?.tenantId}`) || '[]',
        );
        localStorage.setItem(
          `activity_${callerEmployee?.tenantId}`,
          JSON.stringify([
            { type: 'cancel_invite', email, timestamp: new Date().toISOString() },
            ...localAct,
          ]),
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel invitation';
      toast.dismiss(toastId);
      toast.error(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setActionLoadingId(invitationId);
    const toastId = toast.loading(`Resending invitation to ${email}...`);
    try {
      const token = await getToken();
      const res = await fetchWithAuth(
        `/businesses/active/members/invitations/${invitationId}/resend`,
        token,
        {
          method: 'POST',
        },
      );

      if (res.success) {
        // Refresh invitations list
        const invRes = await fetchWithAuth<Invitation[]>(
          '/businesses/active/members?_invitations=1',
          token,
        );
        if (invRes.success && Array.isArray(invRes.data)) {
          setInvitations(invRes.data);
        }
        toast.dismiss(toastId);
        toast.success('Invitation resent successfully.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend invitation';
      toast.dismiss(toastId);
      toast.error(message);
    } finally {
      setActionLoadingId(null);
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

  const isOwner = callerEmployee?.role === 'OWNER';
  const isAdminOrOwner = callerEmployee?.role === 'OWNER' || callerEmployee?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-800 animate-pulse rounded-lg" />
          <div className="h-10 w-32 bg-slate-800 animate-pulse rounded-xl" />
        </div>
        <div className="h-12 bg-slate-800 animate-pulse rounded-xl" />
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 space-y-4">
          <div className="h-5 w-32 bg-slate-800 animate-pulse rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex items-center justify-between py-2 border-b border-slate-800/40"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-slate-800 animate-pulse rounded" />
                    <div className="h-3 w-40 bg-slate-800 animate-pulse rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-slate-800 animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        </div>
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
        {isAdminOrOwner && (
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
        )}
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
          className="p-6 rounded-2xl bg-[#111827] border border-slate-800/60 space-y-4 animate-in slide-in-from-top-4 duration-200"
        >
          <h2 className="text-sm font-semibold text-slate-200">Invite New Team Member</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-800/85 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/10 focus:outline-none"
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
            <p className="text-slate-200 text-sm font-medium">No team members yet.</p>
            {isAdminOrOwner && (
              <button
                onClick={() => setShowInviteForm(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/10"
              >
                Invite Member
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Role</th>
                  {isOwner && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((member) => {
                  const targetUser = member.user;
                  const nameString = targetUser
                    ? [targetUser.firstName, targetUser.lastName].filter(Boolean).join(' ') ||
                      'Unnamed User'
                    : 'Unnamed User';
                  const emailString = targetUser?.email || 'No email';
                  const joinedDate = member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString()
                    : 'N/A';

                  const canManage =
                    isOwner && member.role !== 'OWNER' && targetUser?.id !== callerEmployee?.userId;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-800/10 transition-colors text-sm text-slate-300"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Avatar user={targetUser} />
                          <div>
                            <p className="font-semibold text-slate-100">{nameString}</p>
                            <p className="text-xs text-[#94A3B8]">{emailString}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">
                        {member.title || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{joinedDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <RoleBadge role={member.role} />
                          {canManage && (
                            <select
                              value={member.role}
                              onChange={(e) => {
                                const newRole = e.target.value as EmployeeRole;
                                setRoleModal({
                                  employeeId: member.id,
                                  name: nameString,
                                  currentRole: member.role,
                                  newRole,
                                });
                              }}
                              className="bg-[#0B1220] border border-slate-800 text-xs rounded px-1.5 py-0.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                            </select>
                          )}
                        </div>
                      </td>
                      {isOwner && (
                        <td className="px-6 py-4 text-right">
                          {canManage && (
                            <button
                              disabled={actionLoadingId === member.id}
                              onClick={() =>
                                setRemoveModal({ employeeId: member.id, name: nameString })
                              }
                              className="text-xs font-semibold text-rose-400 hover:text-rose-350 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      {/* Pending Invitations Section */}
      <div className="bg-[#111827] border border-slate-800/60 rounded-2xl overflow-hidden shadow-md">
        <div className="px-6 py-4 border-b border-slate-800/60">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span>Pending Invitations</span>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full font-normal text-slate-400">
              {invitations.length}
            </span>
          </h2>
        </div>

        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <p className="text-slate-400 text-xs">No pending invitations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="px-6 py-4">Invited Email</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Role</th>
                  {isAdminOrOwner && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-800/10 transition-colors text-sm text-slate-300"
                  >
                    <td className="px-6 py-4 font-medium text-slate-100">{inv.email}</td>
                    <td className="px-6 py-4 text-xs text-slate-450">
                      {inv.firstName} {inv.lastName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={inv.role} />
                    </td>
                    {isAdminOrOwner && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            disabled={actionLoadingId === inv.id}
                            onClick={() => handleResendInvitation(inv.id, inv.email)}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-350 disabled:opacity-50"
                          >
                            Resend
                          </button>
                          <button
                            disabled={actionLoadingId === inv.id}
                            onClick={() =>
                              setCancelModal({ invitationId: inv.id, email: inv.email })
                            }
                            className="text-xs font-semibold text-slate-400 hover:text-slate-300 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Change Confirmation Modal */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white">Confirm Role Transition</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Are you sure you want to change <strong>{roleModal.name}</strong>&apos;s role from{' '}
              <span className="text-slate-300 font-semibold">{roleModal.currentRole}</span> to{' '}
              <span className="text-blue-400 font-semibold">{roleModal.newRole}</span>?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setRoleModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeRoleChange}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-500/10"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {removeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white">Remove Team Member</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Are you absolutely sure you want to remove <strong>{removeModal.name}</strong> from
              the business? This will delete their active access immediately.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setRemoveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeRemoveMember}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-lg shadow-rose-500/10"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invitation Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white">Cancel Invitation</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Are you sure you want to cancel the pending invitation sent to{' '}
              <strong>{cancelModal.email}</strong>? They will no longer be able to accept it.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setCancelModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
              >
                Go Back
              </button>
              <button
                onClick={executeCancelInvitation}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-lg shadow-rose-500/10"
              >
                Cancel Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
