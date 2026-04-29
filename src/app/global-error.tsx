'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[global-error]', error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background font-sans text-foreground antialiased">
        <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground/60">
            A critical error occurred. Please try again or return to the site.
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
        </div>
      </body>
    </html>
  );
}
