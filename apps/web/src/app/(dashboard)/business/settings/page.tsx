'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { fetchWithAuth } from '../../../../lib/api';

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

export default function BusinessSettingsPage() {
  const { getToken, isLoaded } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settingsData, setSettingsData] = useState<Partial<BusinessSettings>>({});
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        const settingsRes = await fetchWithAuth<BusinessSettings>(
          '/businesses/active/settings',
          token,
        );
        if (settingsRes.success) setSettingsData(settingsRes.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load business settings';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [isLoaded, getToken]);

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
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-violet-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading business settings...</p>
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
        onSubmit={handleSaveSettings}
        className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-8"
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
                    <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={hours.closed}
                        onChange={(e) => handleBusinessHoursChange(day, 'closed', e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 text-violet-600 focus:ring-violet-500"
                      />
                      <span>Closed</span>
                    </label>

                    <input
                      type="text"
                      placeholder="09:00"
                      disabled={hours.closed}
                      value={hours.open || ''}
                      onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                      className="w-20 text-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
                    />

                    <span className="text-slate-600 text-xs">to</span>

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
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
