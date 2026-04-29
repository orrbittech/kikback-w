'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AppChrome } from '@/components/marketing/app-chrome';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[app-error]', error);
    }
  }, [error]);

  return (
    <AppChrome>
      <main
        id="main-content"
        className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col items-center justify-center px-4 pb-16 pt-10 text-center"
      >
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground/60">
          This part of the app hit an unexpected error. You can try again or return home.
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
            href="/"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground/[0.04]"
          >
            Go home
          </Link>
        </div>
      </main>
    </AppChrome>
  );
}
