'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { fetchWithAuth } from '../../../../lib/api';

interface BusinessProfile {
  legalBusinessName: string;
  displayName: string;
  businessEmail: string | null;
  phoneNumber: string | null;
  website: string | null;
  industry: string;
  businessDescription: string | null;
  country: string;
  state: string | null;
  city: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  logoUrl: string | null;
}

export default function BusinessProfilePage() {
  const { getToken, isLoaded } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<Partial<BusinessProfile>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        const profileRes = await fetchWithAuth<BusinessProfile>(
          '/businesses/active/profile',
          token,
        );
        if (profileRes.success) setProfileData(profileRes.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load business profile';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [isLoaded, getToken]);

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};
    if (!profileData.legalBusinessName || profileData.legalBusinessName.trim().length === 0) {
      errors.legalBusinessName = 'Business name is required';
    } else if (profileData.legalBusinessName.length > 100) {
      errors.legalBusinessName = 'Business name must not exceed 100 characters';
    }
    if (!profileData.displayName || profileData.displayName.trim().length === 0) {
      errors.displayName = 'Display name is required';
    } else if (profileData.displayName.length > 100) {
      errors.displayName = 'Display name must not exceed 100 characters';
    }
    if (profileData.businessEmail && profileData.businessEmail.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.businessEmail)) {
        errors.businessEmail = 'Invalid email address format';
      }
    }
    if (profileData.phoneNumber && profileData.phoneNumber.trim() !== '') {
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(profileData.phoneNumber)) {
        errors.phoneNumber = 'Invalid phone number format';
      }
    }
    if (profileData.website && profileData.website.trim() !== '') {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]+)*\/?$/;
      if (!urlRegex.test(profileData.website)) {
        errors.website = 'Invalid website URL format';
      }
    }
    if (profileData.postalCode && profileData.postalCode.trim() !== '') {
      const postalRegex = /^[a-zA-Z0-9\s\-]{3,10}$/;
      if (!postalRegex.test(profileData.postalCode)) {
        errors.postalCode = 'Invalid postal code format';
      }
    }
    if (profileData.businessDescription && profileData.businessDescription.length > 1000) {
      errors.businessDescription = 'Description must not exceed 1000 characters';
    }
    if (profileData.logoUrl && profileData.logoUrl.trim() !== '') {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]+)*\/?$/;
      if (!urlRegex.test(profileData.logoUrl)) {
        errors.logoUrl = 'Invalid URL format for logo';
      }
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value === '' ? null : value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validateProfile()) return;

    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetchWithAuth<BusinessProfile>('/businesses/active/profile', token, {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      });
      if (res.success) {
        setProfileData(res.data);
        setSuccess('Business profile updated successfully!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save business profile';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-violet-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading business profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <form
        onSubmit={handleSaveProfile}
        className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-8"
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-100 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Business Profile Details
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Update your business identity and contact details used across the dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Business Name</label>
            <input
              type="text"
              name="legalBusinessName"
              value={profileData.legalBusinessName || ''}
              onChange={handleProfileChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                profileErrors.legalBusinessName
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {profileErrors.legalBusinessName && (
              <p className="text-xs text-rose-400">{profileErrors.legalBusinessName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Display Name</label>
            <input
              type="text"
              name="displayName"
              value={profileData.displayName || ''}
              onChange={handleProfileChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                profileErrors.displayName
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {profileErrors.displayName && (
              <p className="text-xs text-rose-400">{profileErrors.displayName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Business Email</label>
            <input
              type="text"
              name="businessEmail"
              value={profileData.businessEmail || ''}
              onChange={handleProfileChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                profileErrors.businessEmail
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {profileErrors.businessEmail && (
              <p className="text-xs text-rose-400">{profileErrors.businessEmail}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Phone</label>
            <input
              type="text"
              name="phoneNumber"
              value={profileData.phoneNumber || ''}
              onChange={handleProfileChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                profileErrors.phoneNumber
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {profileErrors.phoneNumber && (
              <p className="text-xs text-rose-400">{profileErrors.phoneNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Website</label>
            <input
              type="text"
              name="website"
              value={profileData.website || ''}
              onChange={handleProfileChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                profileErrors.website
                  ? 'border-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {profileErrors.website && (
              <p className="text-xs text-rose-400">{profileErrors.website}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Industry</label>
            <input
              type="text"
              name="industry"
              value={profileData.industry || ''}
              onChange={handleProfileChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-300">Logo URL</label>
            <input
              type="text"
              name="logoUrl"
              placeholder="https://example.com/logo.png"
              value={profileData.logoUrl || ''}
              onChange={handleProfileChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                profileErrors.logoUrl
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {profileErrors.logoUrl && (
              <p className="text-xs text-rose-400">{profileErrors.logoUrl}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea
              name="businessDescription"
              rows={4}
              value={profileData.businessDescription || ''}
              onChange={handleProfileChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                profileErrors.businessDescription
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {profileErrors.businessDescription && (
              <p className="text-xs text-rose-400">{profileErrors.businessDescription}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Address Line 1</label>
            <input
              type="text"
              name="addressLine1"
              value={profileData.addressLine1 || ''}
              onChange={handleProfileChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Address Line 2</label>
            <input
              type="text"
              name="addressLine2"
              value={profileData.addressLine2 || ''}
              onChange={handleProfileChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">City</label>
            <input
              type="text"
              name="city"
              value={profileData.city || ''}
              onChange={handleProfileChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">State</label>
            <input
              type="text"
              name="state"
              value={profileData.state || ''}
              onChange={handleProfileChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Country</label>
            <input
              type="text"
              name="country"
              value={profileData.country || ''}
              onChange={handleProfileChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={profileData.postalCode || ''}
              onChange={handleProfileChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                profileErrors.postalCode
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {profileErrors.postalCode && (
              <p className="text-xs text-rose-400">{profileErrors.postalCode}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/80 text-white font-medium text-sm transition-all duration-200 shadow-lg"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
