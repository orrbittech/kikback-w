'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[dashboard-error]', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <Link href="/" className="font-semibold tracking-tight text-foreground">
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'KIKBACK'}
          </Link>
          <Link
            href="/"
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Dashboard couldn’t load
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground/60">
          We couldn’t load this screen. Try again—if the problem continues, check that the API is
          reachable.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
          >
            Try again
          </button>
          <Link
            href="/dashboard/referrals"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground/[0.04]"
          >
            Back to referrals
          </Link>
        </div>
      </main>
    </div>
  );
}
