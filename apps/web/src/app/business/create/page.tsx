'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { fetchWithAuth } from '../../../lib/api';

export default function CreateBusinessPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('US');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const token = await getToken();
      const res = await fetchWithAuth<{ id: string }>('/businesses', token, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          industry: industry.trim(),
          country: country.trim(),
        }),
      });

      if (res.success) {
        // Redirect to onboarding step
        router.replace('/onboarding');
      } else {
        setError(res.error?.message || 'Failed to create business profile.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col justify-between py-12 px-6 lg:px-8">
      {/* Top Navbar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-[#8B5CF6] flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            A
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AutoOps AI
          </span>
        </div>
        <UserButton />
      </header>

      {/* Main Content */}
      <main className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white to-slate-450 bg-clip-text text-transparent">
            Create Your Business
          </h2>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Set up a multi-tenant business shell to initiate onboarding.
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800/60 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200">Business Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full bg-slate-950/80 border border-slate-800/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">Industry</label>
              <input
                type="text"
                required
                placeholder="e.g. Technology, Retail"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-1 w-full bg-slate-950/80 border border-slate-800/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Country Code (ISO 2-letter)
              </label>
              <input
                type="text"
                required
                maxLength={2}
                placeholder="e.g. US, CA, GB"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                className="mt-1 w-full bg-slate-950/80 border border-slate-800/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-800/50 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/55"
            >
              {submitting ? 'Initializing Business...' : 'Create Business'}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#94A3B8]/60 mt-8">
        © {new Date().getFullYear()} AutoOps AI. All rights reserved.
      </footer>
    </div>
  );
}
