/**
 * Client-side preview of referral reward math (must match server
 * `referral-reward-points.ts`). Optional `NEXT_PUBLIC_*` env mirrors server tuning.
 */

function parsePointsPerDollar(raw: string | undefined): number | null {
  if (raw == null || String(raw).trim() === '') {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return n;
}

function previewBpsFromEnv(): number | null {
  const fromDollar = parsePointsPerDollar(
    process.env.NEXT_PUBLIC_REFERRAL_POINTS_PER_DOLLAR,
  );
  if (fromDollar !== null) {
    return Math.round(fromDollar * 100);
  }
  const raw = process.env.NEXT_PUBLIC_REFERRAL_REWARD_BPS;
  if (raw == null || String(raw).trim() === '') {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Returns null when no preview env is set — server remains source of truth. */
export function previewRewardPointsFromSubtotalCents(
  subtotalCents: number,
): number | null {
  const bps = previewBpsFromEnv();
  if (bps == null) {
    return null;
  }
  return Math.floor((subtotalCents * bps) / 10_000);
}

export function previewFlatRewardPointsFromEnv(): number | null {
  const raw = process.env.NEXT_PUBLIC_REFERRAL_REWARD_POINTS_PER_ORDER;
  if (raw == null || String(raw).trim() === '') {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
