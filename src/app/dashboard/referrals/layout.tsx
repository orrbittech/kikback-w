import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'KIKBACK';

export const metadata: Metadata = {
  title: `Referrals | ${appName}`,
  description:
    'Track referral signups, purchases, and reward points. Copy your referral code and share it to grow your network.',
};

export default function ReferralsDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
