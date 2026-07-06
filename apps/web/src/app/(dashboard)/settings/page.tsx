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

export default function SettingsPage() {
  const { getToken, isLoaded } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadProfile() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        const res = await fetchWithAuth<BusinessProfile>('/businesses/active/profile', token);
        if (res.success) {
          setFormData(res.data);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load business profile';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [isLoaded, getToken]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.legalBusinessName || formData.legalBusinessName.trim().length === 0) {
      errors.legalBusinessName = 'Business name is required';
    } else if (formData.legalBusinessName.length > 100) {
      errors.legalBusinessName = 'Business name must not exceed 100 characters';
    }

    if (!formData.displayName || formData.displayName.trim().length === 0) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length > 100) {
      errors.displayName = 'Display name must not exceed 100 characters';
    }

    if (formData.businessEmail && formData.businessEmail.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.businessEmail)) {
        errors.businessEmail = 'Invalid email address format';
      }
    }

    if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        errors.phoneNumber = 'Invalid phone number format';
      }
    }

    if (formData.website && formData.website.trim() !== '') {
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlRegex.test(formData.website)) {
        errors.website = 'Invalid website URL format';
      }
    }

    if (formData.postalCode && formData.postalCode.trim() !== '') {
      const postalRegex = /^[a-zA-Z0-9\s\-]{3,10}$/;
      if (!postalRegex.test(formData.postalCode)) {
        errors.postalCode = 'Invalid postal code format';
      }
    }

    if (formData.businessDescription && formData.businessDescription.length > 1000) {
      errors.businessDescription = 'Description must not exceed 1000 characters';
    }

    if (formData.logoUrl && formData.logoUrl.trim() !== '') {
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlRegex.test(formData.logoUrl)) {
        errors.logoUrl = 'Invalid URL format for logo';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value === '' ? null : value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetchWithAuth<BusinessProfile>('/businesses/active/profile', token, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setFormData(res.data);
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-violet-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading profile settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <form
        onSubmit={handleSave}
        className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-8"
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

        {/* Form fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Business Name</label>
            <input
              type="text"
              name="legalBusinessName"
              value={formData.legalBusinessName || ''}
              onChange={handleInputChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                formErrors.legalBusinessName
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {formErrors.legalBusinessName && (
              <p className="text-xs text-rose-400">{formErrors.legalBusinessName}</p>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Display Name</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName || ''}
              onChange={handleInputChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                formErrors.displayName
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {formErrors.displayName && (
              <p className="text-xs text-rose-400">{formErrors.displayName}</p>
            )}
          </div>

          {/* Business Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Business Email</label>
            <input
              type="text"
              name="businessEmail"
              value={formData.businessEmail || ''}
              onChange={handleInputChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                formErrors.businessEmail
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {formErrors.businessEmail && (
              <p className="text-xs text-rose-400">{formErrors.businessEmail}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Phone</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handleInputChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                formErrors.phoneNumber
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {formErrors.phoneNumber && (
              <p className="text-xs text-rose-400">{formErrors.phoneNumber}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Website</label>
            <input
              type="text"
              name="website"
              value={formData.website || ''}
              onChange={handleInputChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                formErrors.website
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {formErrors.website && <p className="text-xs text-rose-400">{formErrors.website}</p>}
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Industry</label>
            <input
              type="text"
              name="industry"
              value={formData.industry || ''}
              onChange={handleInputChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>

          {/* Logo URL */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-300">Logo URL</label>
            <input
              type="text"
              name="logoUrl"
              placeholder="https://example.com/logo.png"
              value={formData.logoUrl || ''}
              onChange={handleInputChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                formErrors.logoUrl
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {formErrors.logoUrl && <p className="text-xs text-rose-400">{formErrors.logoUrl}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea
              name="businessDescription"
              rows={4}
              value={formData.businessDescription || ''}
              onChange={handleInputChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                formErrors.businessDescription
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {formErrors.businessDescription && (
              <p className="text-xs text-rose-400">{formErrors.businessDescription}</p>
            )}
          </div>

          {/* Address Line 1 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Address Line 1</label>
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1 || ''}
              onChange={handleInputChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>

          {/* Address Line 2 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Address Line 2</label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2 || ''}
              onChange={handleInputChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">City</label>
            <input
              type="text"
              name="city"
              value={formData.city || ''}
              onChange={handleInputChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>

          {/* State */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">State</label>
            <input
              type="text"
              name="state"
              value={formData.state || ''}
              onChange={handleInputChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country || ''}
              onChange={handleInputChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode || ''}
              onChange={handleInputChange}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                formErrors.postalCode
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-slate-700'
              }`}
            />
            {formErrors.postalCode && (
              <p className="text-xs text-rose-400">{formErrors.postalCode}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/80 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-violet-600/20 active:scale-98"
          >
            {saving ? 'Saving changes...' : 'Save Profile Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
