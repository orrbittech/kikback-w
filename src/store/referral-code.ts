import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'kikback-referral-pending';

type ReferralStore = {
  pendingCode: string | null;
  setPending: (code: string | null) => void;
  clearPending: () => void;
};

export const useReferralStore = create<ReferralStore>()(
  persist(
    (set) => ({
      pendingCode: null,
      setPending: (code) =>
        set({
          pendingCode: code ? code.trim().toUpperCase() : null,
        }),
      clearPending: () => set({ pendingCode: null }),
    }),
    { name: STORAGE_KEY },
  ),
);
