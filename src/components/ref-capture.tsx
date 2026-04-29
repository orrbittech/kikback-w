'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useReferralStore } from '@/store/referral-code';

/** Captures `?ref=` and `/r/[code]` flows (short link sets ref via redirect). */
export function RefCapture() {
  const searchParams = useSearchParams();
  const setPending = useReferralStore((s) => s.setPending);

  useEffect(() => {
    const ref = searchParams.get('ref')?.trim();
    if (ref) {
      setPending(ref.toUpperCase());
    }
  }, [searchParams, setPending]);

  return null;
}
