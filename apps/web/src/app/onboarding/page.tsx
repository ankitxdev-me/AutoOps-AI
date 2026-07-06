'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { fetchWithAuth } from '../../lib/api';

type EmployeeRole = 'OWNER' | 'ADMIN' | 'MEMBER';

interface OnboardingStatus {
  onboardingStep: string;
  completionPercentage: number;
  isCompleted: boolean;
}

interface BusinessProfile {
  legalBusinessName: string;
  displayName: string;
  industry: string;
  country: string;
}

interface BusinessSettings {
  timezone: string;
  currency: string;
  language: string;
}

interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: EmployeeRole;
  status: string;
}

export default function OnboardingPage() {
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Flow State
  const [currentStep, setCurrentStep] = useState<string>('1');
  const [completionPercentage, setCompletionPercentage] = useState(25);

  // Step 1 Form
  const [profile, setProfile] = useState<BusinessProfile>({
    legalBusinessName: '',
    displayName: '',
    industry: '',
    country: '',
  });

  // Step 2 Form
  const [settings, setSettings] = useState<BusinessSettings>({
    timezone: 'UTC',
    currency: 'USD',
    language: 'en',
  });

  // Step 3 Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<EmployeeRole>('MEMBER');
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    async function loadOnboarding() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        // 1. Fetch current status
        const statusRes = await fetchWithAuth<OnboardingStatus>('/onboarding/status', token);

        if (statusRes.success) {
          const { onboardingStep, completionPercentage: pct } = statusRes.data;

          if (onboardingStep === 'completed') {
            router.replace('/');
            return;
          }

          setCurrentStep(onboardingStep);
          setCompletionPercentage(pct);

          // 2. Fetch existing profile and settings to pre-fill
          const [profRes, settRes] = await Promise.all([
            fetchWithAuth<BusinessProfile>('/businesses/active/profile', token).catch(() => null),
            fetchWithAuth<BusinessSettings>('/businesses/active/settings', token).catch(() => null),
          ]);

          if (profRes && profRes.success) {
            setProfile({
              legalBusinessName: profRes.data.legalBusinessName || '',
              displayName: profRes.data.displayName || '',
              industry: profRes.data.industry || '',
              country: profRes.data.country || '',
            });
          }
          if (settRes && settRes.success) {
            setSettings({
              timezone: settRes.data.timezone || 'UTC',
              currency: settRes.data.currency || 'USD',
              language: settRes.data.language || 'en',
            });
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to initialize onboarding data';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    void loadOnboarding();
  }, [isLoaded, getToken, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      !profile.legalBusinessName ||
      !profile.displayName ||
      !profile.industry ||
      !profile.country
    ) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      // Save Profile
      await fetchWithAuth('/businesses/active/profile', token, {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });

      // Advance Step
      const nextStepRes = await fetchWithAuth<OnboardingStatus>('/onboarding/step', token, {
        method: 'PATCH',
        body: JSON.stringify({ step: '2' }),
      });

      if (nextStepRes.success) {
        setCurrentStep(nextStepRes.data.onboardingStep);
        setCompletionPercentage(nextStepRes.data.completionPercentage);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save business profile';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!settings.timezone || !settings.currency || !settings.language) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      // Save Settings
      await fetchWithAuth('/businesses/active/settings', token, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });

      // Advance Step
      const nextStepRes = await fetchWithAuth<OnboardingStatus>('/onboarding/step', token, {
        method: 'PATCH',
        body: JSON.stringify({ step: '3' }),
      });

      if (nextStepRes.success) {
        setCurrentStep(nextStepRes.data.onboardingStep);
        setCompletionPercentage(nextStepRes.data.completionPercentage);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings configurations';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inviteEmail || !inviteFirstName || !inviteLastName) {
      setError('First name, Last name and Email are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetchWithAuth<Invitation>('/businesses/active/members/invite', token, {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          firstName: inviteFirstName,
          lastName: inviteLastName,
          role: inviteRole,
        }),
      });

      if (res.success) {
        setInvitations((prev) => [...prev, res.data]);
        setInviteEmail('');
        setInviteFirstName('');
        setInviteLastName('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to invite member';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetchWithAuth<OnboardingStatus>('/onboarding/step', token, {
        method: 'PATCH',
        body: JSON.stringify({ step: 'completed' }),
      });

      if (res.success) {
        router.replace('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete onboarding';
      setError(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-violet-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading onboarding workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
            A
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Welcome to AutoOps AI
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Complete the onboarding setup to build your workspace foundation.
        </p>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Onboarding Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-900/40 border border-slate-800 py-8 px-6 shadow rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: BUSINESS PROFILE */}
          {currentStep === '1' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">
                Step 1: Business Profile Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Legal Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.legalBusinessName}
                    onChange={(e) => setProfile({ ...profile, legalBusinessName: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Display Name</label>
                  <input
                    type="text"
                    required
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Industry</label>
                  <input
                    type="text"
                    required
                    value={profile.industry}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Country</label>
                  <input
                    type="text"
                    required
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-sm font-medium transition-all shadow-lg"
              >
                {submitting ? 'Saving...' : 'Next: Settings Setup'}
              </button>
            </form>
          )}

          {/* STEP 2: BUSINESS SETTINGS */}
          {currentStep === '2' && (
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">
                Step 2: Operational Settings Configuration
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Timezone</label>
                  <input
                    type="text"
                    required
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Currency (ISO 3-Letter Code)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Language Code</label>
                  <input
                    type="text"
                    required
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-sm font-medium transition-all shadow-lg"
              >
                {submitting ? 'Saving...' : 'Next: Invite Team'}
              </button>
            </form>
          )}

          {/* STEP 3: INVITE TEAM MEMBERS */}
          {currentStep === '3' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">
                Step 3: Invite Team Members (Optional)
              </h3>
              <form onSubmit={handleInviteSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">First Name</label>
                    <input
                      type="text"
                      value={inviteFirstName}
                      onChange={(e) => setInviteFirstName(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Last Name</label>
                    <input
                      type="text"
                      value={inviteLastName}
                      onChange={(e) => setInviteLastName(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Workspace Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as EmployeeRole)}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
                >
                  {submitting ? 'Inviting...' : 'Add and Invite Member'}
                </button>
              </form>

              {/* Show invited list */}
              {invitations.length > 0 && (
                <div className="border-t border-slate-800 pt-3 mt-3">
                  <p className="text-xs font-semibold text-slate-400 mb-2">
                    Invited Members ({invitations.length})
                  </p>
                  <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {invitations.map((inv, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-950/60"
                      >
                        <span className="text-slate-300 font-medium">
                          {inv.firstName} {inv.lastName}
                        </span>
                        <span className="text-slate-500">{inv.email}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-3 mt-4 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-sm font-medium transition-all shadow-lg"
                >
                  {submitting ? 'Completing...' : 'Finish Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
