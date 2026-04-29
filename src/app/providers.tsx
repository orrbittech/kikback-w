'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { AttachReferralOnSignIn } from '@/components/attach-referral-on-sign-in';
import { WebVitalsReporter } from '@/components/web-vitals-reporter';

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (
      status !== undefined &&
      status >= 400 &&
      status < 500 &&
      status !== 408 &&
      status !== 429
    ) {
      return false;
    }
  }
  return true;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: shouldRetryQuery,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        variables: {
          fontFamily:
            'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
          fontSize: '1rem',
        },
      }}
      signInFallbackRedirectUrl="/dashboard/referrals"
      signUpFallbackRedirectUrl="/dashboard/referrals"
    >
      <QueryClientProvider client={queryClient}>
        <WebVitalsReporter />
        <Toaster position="bottom-center" />
        <AttachReferralOnSignIn />
        {children}
      </QueryClientProvider>
    </ClerkProvider>
  );
}
