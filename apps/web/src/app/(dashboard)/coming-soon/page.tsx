'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function ComingSoonPage() {
  const pathname = usePathname();
  const pageName = pathname
    .split('/')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-violet-500/10 border border-blue-500/20 flex items-center justify-center text-4xl animate-pulse">
        🚀
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          {pageName || 'Module'} Coming Soon
        </h1>
        <p className="text-[#94A3B8] text-sm max-w-md mx-auto leading-relaxed">
          We are currently building this platform module as part of our sprint roadmap. Check back
          soon!
        </p>
      </div>
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold uppercase tracking-wider animate-pulse">
        Sprint Roadmap Feature
      </div>
    </div>
  );
}
