'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export function HeroAuthActions() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="h-12 max-w-[14rem] flex-1 animate-pulse rounded-full bg-white/20" />
    );
  }

  if (isSignedIn) {
    return (
      <Link
        href="/dashboard/referrals"
        className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-950 shadow-lg transition hover:bg-neutral-100"
      >
        Open dashboard
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/sign-up"
        className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-950 shadow-lg transition hover:bg-neutral-100"
      >
        Get started
      </Link>
      <Link
        href="/sign-in"
        className="inline-flex items-center justify-center rounded-full border border-white/50 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
      >
        Sign in
      </Link>
    </div>
  );
}
