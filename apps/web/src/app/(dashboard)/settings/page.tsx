'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { fetchWithAuth } from '../../../lib/api';

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

interface BusinessHoursDay {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessSettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  businessHours: Record<string, BusinessHoursDay>;
  weekStartsOn: number;
  defaultCountry: string;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SettingsPage() {
  const { getToken, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile Form States
  const [profileData, setProfileData] = useState<Partial<BusinessProfile>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Settings Form States
  const [settingsData, setSettingsData] = useState<Partial<BusinessSettings>>({});
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        const [profileRes, settingsRes] = await Promise.all([
          fetchWithAuth<BusinessProfile>('/businesses/active/profile', token),
          fetchWithAuth<BusinessSettings>('/businesses/active/settings', token),
        ]);

        if (profileRes.success) setProfileData(profileRes.data);
        if (settingsRes.success) setSettingsData(settingsRes.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load business configurations';
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

  const validateSettings = (): boolean => {
    const errors: Record<string, string> = {};

    if (!settingsData.timezone || settingsData.timezone.trim() === '') {
      errors.timezone = 'Timezone is required';
    }

    if (!settingsData.currency || settingsData.currency.trim().length !== 3) {
      errors.currency = 'Currency must be a 3-character ISO code';
    }

    if (
      !settingsData.language ||
      settingsData.language.trim().length < 2 ||
      settingsData.language.trim().length > 5
    ) {
      errors.language = 'Language code must be between 2 and 5 characters';
    }

    if (!settingsData.defaultCountry || settingsData.defaultCountry.trim().length !== 2) {
      errors.defaultCountry = 'Default country must be a 2-character country code';
    }

    if (
      settingsData.weekStartsOn === undefined ||
      settingsData.weekStartsOn < 0 ||
      settingsData.weekStartsOn > 6
    ) {
      errors.weekStartsOn = 'Week start must be between 0 (Sunday) and 6 (Saturday)';
    }

    setSettingsErrors(errors);
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

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsedValue = name === 'weekStartsOn' ? parseInt(value, 10) : value;
    setSettingsData((prev) => ({ ...prev, [name]: parsedValue }));
    if (settingsErrors[name]) {
      setSettingsErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleBusinessHoursChange = (
    day: string,
    field: 'open' | 'close' | 'closed',
    value: string | boolean,
  ) => {
    setSettingsData((prev) => {
      const currentHours = prev.businessHours || {};
      const dayHours = currentHours[day] || { open: '09:00', close: '17:00', closed: false };

      let updatedDayHours = { ...dayHours, [field]: value };
      if (field === 'closed' && value === true) {
        updatedDayHours = { ...updatedDayHours, open: '', close: '' };
      } else if (field === 'closed' && value === false) {
        updatedDayHours = { ...updatedDayHours, open: '09:00', close: '17:00' };
      }

      return {
        ...prev,
        businessHours: {
          ...currentHours,
          [day]: updatedDayHours,
        },
      };
    });
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateSettings()) return;

    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetchWithAuth<BusinessSettings>('/businesses/active/settings', token, {
        method: 'PATCH',
        body: JSON.stringify(settingsData),
      });

      if (res.success) {
        setSettingsData(res.data);
        setSuccess('Operational settings updated successfully!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save business settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-violet-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading settings profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs list */}
      <div className="flex space-x-2 border-b border-slate-800 pb-px">
        <button
          onClick={() => {
            setActiveTab('profile');
            setError(null);
            setSuccess(null);
          }}
          className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeTab === 'profile'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Business Profile
        </button>
        <button
          onClick={() => {
            setActiveTab('settings');
            setError(null);
            setSuccess(null);
          }}
          className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeTab === 'settings'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Operational Settings
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-pulse">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-8 animate-fadeIn"
        >
          <div>
            <h2 className="text-xl font-semibold text-slate-100 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Business Profile
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Update your business identity and contact details used across the dashboard and AI
              tasks.
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
                    ? 'border-rose-500/50 focus:ring-rose-500/50'
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
              {saving ? 'Saving profile...' : 'Save Profile Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Settings Form */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-8 animate-fadeIn"
        >
          <div>
            <h2 className="text-xl font-semibold text-slate-100 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Operational Settings
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Configure date formats, default currency, timezones, and regional configurations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timezone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Timezone</label>
              <input
                type="text"
                name="timezone"
                value={settingsData.timezone || ''}
                onChange={handleSettingsChange}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                  settingsErrors.timezone
                    ? 'border-rose-500/50 focus:ring-rose-500/50'
                    : 'border-slate-800 focus:border-slate-700'
                }`}
              />
              {settingsErrors.timezone && (
                <p className="text-xs text-rose-400">{settingsErrors.timezone}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Default Currency</label>
              <input
                type="text"
                name="currency"
                placeholder="e.g. USD"
                value={settingsData.currency || ''}
                onChange={handleSettingsChange}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                  settingsErrors.currency
                    ? 'border-rose-500/50 focus:ring-rose-500/50'
                    : 'border-slate-800 focus:border-slate-700'
                }`}
              />
              {settingsErrors.currency && (
                <p className="text-xs text-rose-400">{settingsErrors.currency}</p>
              )}
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Language Code</label>
              <input
                type="text"
                name="language"
                placeholder="e.g. en"
                value={settingsData.language || ''}
                onChange={handleSettingsChange}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                  settingsErrors.language
                    ? 'border-rose-500/50 focus:ring-rose-500/50'
                    : 'border-slate-800 focus:border-slate-700'
                }`}
              />
              {settingsErrors.language && (
                <p className="text-xs text-rose-400">{settingsErrors.language}</p>
              )}
            </div>

            {/* Default Country */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Default Country (ISO)</label>
              <input
                type="text"
                name="defaultCountry"
                placeholder="e.g. US"
                value={settingsData.defaultCountry || ''}
                onChange={handleSettingsChange}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                  settingsErrors.defaultCountry
                    ? 'border-rose-500/50 focus:ring-rose-500/50'
                    : 'border-slate-800 focus:border-slate-700'
                }`}
              />
              {settingsErrors.defaultCountry && (
                <p className="text-xs text-rose-400">{settingsErrors.defaultCountry}</p>
              )}
            </div>

            {/* Date Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Date Format</label>
              <select
                name="dateFormat"
                value={settingsData.dateFormat || 'YYYY-MM-DD'}
                onChange={handleSettingsChange}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                <option value="YYYY/MM/DD">YYYY/MM/DD</option>
              </select>
            </div>

            {/* Time Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Time Format</label>
              <select
                name="timeFormat"
                value={settingsData.timeFormat || '24h'}
                onChange={handleSettingsChange}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none"
              >
                <option value="24h">24-hour (24h)</option>
                <option value="12h">12-hour (12h)</option>
              </select>
            </div>

            {/* Week Starts On */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Week Starts On</label>
              <select
                name="weekStartsOn"
                value={settingsData.weekStartsOn !== undefined ? settingsData.weekStartsOn : 1}
                onChange={handleSettingsChange}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <h3 className="text-md font-semibold text-slate-200">Weekly Business Hours</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define operational start and end times for each day.
              </p>
            </div>

            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const hours = (settingsData.businessHours || {})[day] || {
                  open: '09:00',
                  close: '17:00',
                  closed: false,
                };
                return (
                  <div
                    key={day}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-900 space-y-3 sm:space-y-0 sm:space-x-4"
                  >
                    <span className="text-sm font-medium text-slate-300 capitalize min-w-[100px]">
                      {day}
                    </span>

                    <div className="flex items-center space-x-6 flex-1 justify-end">
                      {/* Closed checkbox */}
                      <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-400">
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(e) =>
                            handleBusinessHoursChange(day, 'closed', e.target.checked)
                          }
                          className="rounded border-slate-800 bg-slate-900 text-violet-600 focus:ring-violet-500"
                        />
                        <span>Closed</span>
                      </label>

                      {/* Open time */}
                      <input
                        type="text"
                        placeholder="09:00"
                        disabled={hours.closed}
                        value={hours.open || ''}
                        onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                        className="w-20 text-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
                      />

                      <span className="text-slate-600 text-xs">to</span>

                      {/* Close time */}
                      <input
                        type="text"
                        placeholder="17:00"
                        disabled={hours.closed}
                        value={hours.close || ''}
                        onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                        className="w-20 text-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/80 text-white font-medium text-sm transition-all duration-200 shadow-lg"
            >
              {saving ? 'Saving settings...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
