'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MembersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/business/members');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
      <p className="text-[#94A3B8] text-sm">Redirecting to Team Members...</p>
    </div>
  );
}
