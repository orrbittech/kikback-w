'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export function LandingCtas() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="h-12 w-48 animate-pulse rounded-full bg-zinc-200" />
    );
  }

  if (isSignedIn) {
    return (
      <Link
        href="/dashboard/referrals"
        className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg hover:bg-zinc-200"
      >
        Open dashboard
      </Link>
    );
  }

  return (
    <Link
      href="/sign-up"
      className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg hover:bg-zinc-200"
    >
      Get started &amp; get your code
    </Link>
  );
}
