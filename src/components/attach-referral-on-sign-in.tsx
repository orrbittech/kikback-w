'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { createAuthedApi } from '@/lib/api';
import { useReferralStore } from '@/store/referral-code';

/** After sign-in, attaches pending `?ref` code to the current user (idempotent). */
export function AttachReferralOnSignIn() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const pendingCode = useReferralStore((s) => s.pendingCode);
  const clearPending = useReferralStore((s) => s.clearPending);
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !pendingCode) {
      return;
    }
    if (attempted.current === pendingCode) {
      return;
    }
    attempted.current = pendingCode;

    const api = createAuthedApi(getToken, {
      onSessionInvalid: () => void signOut({ redirectUrl: '/sign-in' }),
    });
    void api
      .post('/referrals/attach', { code: pendingCode })
      .then(() => clearPending())
      .catch(() => {
        /* invalid code or network — keep pending so user can retry */
        attempted.current = null;
      });
  }, [isLoaded, isSignedIn, pendingCode, getToken, clearPending, signOut]);

  return null;
}
