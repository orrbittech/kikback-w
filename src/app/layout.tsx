import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Suspense } from 'react';
import './globals.css';
import { Providers } from './providers';
import { RefCapture } from '@/components/ref-capture';

/** Self-hosted (Fontsource) so dev/build do not depend on reaching fonts.googleapis.com. */
const urbanist = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/urbanist/files/urbanist-latin-wght-normal.woff2',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource-variable/urbanist/files/urbanist-latin-wght-italic.woff2',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-urbanist',
  display: 'swap',
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'http://localhost:3000';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'KIKBACK';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `Refer & Earn | ${appName} Referral Program`,
    template: `%s | ${appName}`,
  },
  description:
    'Referral program: your friends get a discount on their first purchase; you earn reward points when they buy. Share your unique link and track points in your dashboard.',
  keywords: [
    'referral program',
    'refer a friend',
    'reward points',
    'referral discount',
    appName,
  ],
  openGraph: {
    title: `Refer & Earn | ${appName}`,
    description:
      'Share your link, give friends a discount, earn reward points on qualifying purchases.',
    url: siteUrl,
    siteName: appName,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Refer & Earn | ${appName}`,
    description: 'Share your link. They save. You earn.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: { canonical: '/' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body className="bg-background font-sans text-foreground antialiased">
        <Providers>
          <Suspense fallback={null}>
            <RefCapture />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
