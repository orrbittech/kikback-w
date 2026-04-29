'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

/** Optional dashboard link when signed in (marketing 404 inherits root layout). */
export function NotFoundActions() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="mt-10 flex justify-center gap-3">
        <span className="h-11 w-32 animate-pulse rounded-lg bg-foreground/[0.08]" />
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-wrap justify-center gap-3">
      <Link
        href="/"
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
      >
        Go home
      </Link>
      {isSignedIn ?
        <Link
          href="/dashboard/referrals"
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground/[0.04]"
        >
          Dashboard
        </Link>
      : null}
    </div>
  );
}
