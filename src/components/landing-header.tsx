'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'KIKBACK';

export function LandingHeader() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-0 bg-transparent font-sans shadow-none">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <Link
          href="/"
          className="shrink-0 text-base font-semibold uppercase tracking-tight text-white hover:text-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40 md:text-lg"
        >
          {appName}
        </Link>
        <div className="flex min-w-0 shrink-0 items-center gap-3 md:gap-4">
          {!isLoaded ? (
            <span className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-white/20" />
          ) : isSignedIn ? (
            <>
              <Link
                href="/dashboard/referrals"
                className="hidden text-sm font-medium uppercase tracking-wide text-white hover:text-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40 md:inline"
              >
                Dashboard
              </Link>
              <div className="shrink-0">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'h-9 w-9 ring-2 ring-white/25',
                      userButtonPopoverCard: 'shadow-xl',
                    },
                    variables: {
                      colorNeutral: '#18181b',
                    },
                  }}
                />
              </div>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-neutral-950 shadow-md ring-1 ring-white/60 transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:px-6"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
