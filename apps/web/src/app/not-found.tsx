'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600/20 to-violet-500/10 border border-blue-500/20 flex items-center justify-center text-5xl mb-8 animate-bounce">
        🔍
      </div>

      <div className="space-y-3 max-w-md">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
          Error 404
        </span>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent pt-2">
          Page Not Found
        </h1>
        <p className="text-[#94A3B8] text-sm leading-relaxed">
          The workspace URL you requested does not exist or has been relocated. Check your path
          settings and retry.
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/55"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
