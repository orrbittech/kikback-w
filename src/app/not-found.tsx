import type { Metadata } from 'next';
import Link from 'next/link';
import { AppChrome } from '@/components/marketing/app-chrome';
import { NotFoundActions } from '@/components/not-found-actions';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'KIKBACK';

export const metadata: Metadata = {
  title: 'Page not found',
  description: `That page doesn’t exist on ${appName}.`,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <AppChrome>
      <main
        id="main-content"
        className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-xl flex-col items-center justify-center px-4 pb-16 pt-10 text-center"
      >
        <p className="text-[10rem] leading-none font-bold tabular-nums tracking-tighter text-foreground/[0.08] sm:text-[12rem]">
          404
        </p>
        <div className="-mt-[4.25rem] sm:-mt-[4.75rem]">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            This page slipped past us
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground/60">
            Check the URL, or head back{' '}
            <Link href="/" className="font-medium text-foreground underline underline-offset-4 hover:no-underline">
              home
            </Link>
            .
          </p>
          <NotFoundActions />
        </div>
      </main>
    </AppChrome>
  );
}
