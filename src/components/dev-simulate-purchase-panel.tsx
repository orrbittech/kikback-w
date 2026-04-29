'use client';

import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getApiBaseUrl } from '@/lib/api';
import {
  previewFlatRewardPointsFromEnv,
  previewRewardPointsFromSubtotalCents,
} from '@/lib/referral-reward-points-preview';
import { cn } from '@/lib/utils';

type OrderCompleteSuccess = {
  referralId: string;
  purchaseId: string;
  rewardPoints: number;
  purchaseAt: string;
};

export type DevSimulatePurchaseReferralRow = {
  id: string;
  referredClerkId: string;
  codeUsed: string;
  signupAt: string;
};

export type DevSimulatePurchasePanelProps = {
  /** Current user's referral code (prefills the Code field). */
  defaultCode: string | undefined;
  /** Signups on the referrer’s account (from `referralSignups`). */
  referralRows: DevSimulatePurchaseReferralRow[];
  /** Total referral signups (server stats). */
  totalSignupCount?: number;
};

/** ISO 4217 codes for dev simulate; exponent 0 = whole units only (e.g. JPY). */
const DEV_SIMULATE_CURRENCY_OPTIONS: { code: string; label: string; exponent: number }[] =
  [
    { code: 'ZAR', label: 'ZAR', exponent: 2 },
    { code: 'USD', label: 'USD', exponent: 2 },
    { code: 'EUR', label: 'EUR', exponent: 2 },
    { code: 'GBP', label: 'GBP', exponent: 2 },
    { code: 'AUD', label: 'AUD', exponent: 2 },
    { code: 'CAD', label: 'CAD', exponent: 2 },
    { code: 'CHF', label: 'CHF', exponent: 2 },
    { code: 'NZD', label: 'NZD', exponent: 2 },
    { code: 'SGD', label: 'SGD', exponent: 2 },
    { code: 'HKD', label: 'HKD', exponent: 2 },
    { code: 'SEK', label: 'SEK', exponent: 2 },
    { code: 'NOK', label: 'NOK', exponent: 2 },
    { code: 'JPY', label: 'JPY', exponent: 0 },
    { code: 'KRW', label: 'KRW', exponent: 0 },
  ];

function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase();
}

function maskReferred(id: string): string {
  if (id.length <= 12) {
    return `${id.slice(0, 3)}…`;
  }
  return `${id.slice(0, 12)}…`;
}

function formatSignupAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function formatPurchaseAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
}

const fieldClassName =
  'rounded border border-border bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:bg-background dark:text-foreground';

const inputClassName = `mt-1 w-full ${fieldClassName}`;

function messageFromUnknownBody(body: unknown, fallback: string): string {
  if (typeof body !== 'object' || body === null) {
    return fallback;
  }
  const msg = (body as { message?: unknown }).message;
  if (typeof msg === 'string') {
    return msg;
  }
  if (Array.isArray(msg) && msg.length > 0 && typeof msg[0] === 'string') {
    return msg.join(' ');
  }
  return fallback;
}

function parseAmountToMinorUnits(raw: string, exponent: number): number | null {
  const trimmed = raw.trim().replace(/[$,€£¥₩\s]/g, '');
  if (trimmed === '') {
    return null;
  }
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  const factor = 10 ** exponent;
  return Math.round(n * factor);
}

function noEligibleRowsMessage(params: {
  referralRows: DevSimulatePurchaseReferralRow[];
  totalSignupCount: number | undefined;
  /** Uppercase trimmed code — must match normalized filter used for eligibility. */
  normalizedInputCode: string;
}): string {
  const { referralRows, totalSignupCount, normalizedInputCode } = params;

  const codeMatchRows = referralRows.filter(
    (row) => normalizeReferralCode(row.codeUsed) === normalizedInputCode,
  );

  let base: string;

  if (referralRows.length === 0) {
    base =
      'No referrals loaded yet. Paste the buyer’s Clerk user id below (internal bootstrap), or have another user attach your code (POST /referrals/attach or ?ref=), then reload.';
  } else if (codeMatchRows.length === 0) {
    base =
      'That code does not match any referral on your account. Use your current code (see “Your code”) or fix the field.';
  } else {
    base =
      'Could not resolve a referred user for this submission. Pick a buyer from the list or paste their Clerk user id.';
  }

  if (
    totalSignupCount != null &&
    totalSignupCount > referralRows.length
  ) {
    base += ` (${referralRows.length} of ${totalSignupCount} signups loaded; older rows may be off this page.)`;
  }

  return base;
}

export function DevSimulatePurchasePanel({
  defaultCode,
  referralRows,
  totalSignupCount,
}: DevSimulatePurchasePanelProps) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const [codeInput, setCodeInput] = useState(defaultCode ?? '');
  const [amountInput, setAmountInput] = useState('100.00');
  const [currencyCode, setCurrencyCode] = useState('ZAR');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selectedReferredId, setSelectedReferredId] = useState('');
  const [manualReferredClerkId, setManualReferredClerkId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [useFlatReward, setUseFlatReward] = useState(false);

  const currencyExponent = useMemo(() => {
    const found = DEV_SIMULATE_CURRENCY_OPTIONS.find((c) => c.code === currencyCode);
    return found?.exponent ?? 2;
  }, [currencyCode]);

  const selectedCurrencyOption = useMemo(
    () => DEV_SIMULATE_CURRENCY_OPTIONS.find((c) => c.code === currencyCode),
    [currencyCode],
  );

  const rewardPreview = useMemo(() => {
    if (useFlatReward) {
      const flat = previewFlatRewardPointsFromEnv();
      return { mode: 'flat' as const, points: flat };
    }
    const parsedMinor = parseAmountToMinorUnits(amountInput, currencyExponent);
    if (parsedMinor == null) {
      return {
        mode: 'subtotal' as const,
        points: null as number | null,
        minorUnits: null as number | null,
        amountValid: false,
      };
    }
    const pts = previewRewardPointsFromSubtotalCents(parsedMinor);
    return {
      mode: 'subtotal' as const,
      points: pts,
      minorUnits: parsedMinor,
      amountValid: true,
    };
  }, [useFlatReward, amountInput, currencyExponent]);

  useEffect(() => {
    if (defaultCode) {
      setCodeInput(defaultCode);
    }
  }, [defaultCode]);

  const normalizedInputCode = normalizeReferralCode(codeInput);

  const eligibleRows = useMemo(() => {
    if (!normalizedInputCode) {
      return [];
    }
    const matched = referralRows.filter(
      (row) =>
        normalizeReferralCode(row.codeUsed) === normalizedInputCode,
    );
    const seen = new Set<string>();
    return matched.filter((row) => {
      if (seen.has(row.referredClerkId)) {
        return false;
      }
      seen.add(row.referredClerkId);
      return true;
    });
  }, [referralRows, normalizedInputCode]);

  useEffect(() => {
    if (
      selectedReferredId &&
      !eligibleRows.some((r) => r.referredClerkId === selectedReferredId)
    ) {
      setSelectedReferredId('');
    }
  }, [eligibleRows, selectedReferredId]);

  async function simulatePurchase(e: React.FormEvent) {
    e.preventDefault();
    const token = await getToken();
    if (!token) {
      toast.error(
        'Sign in required — use your referrer account to simulate a purchase.',
        { duration: 6000 },
      );
      return;
    }
    if (!normalizedInputCode) {
      toast.error('Enter a referral code.');
      return;
    }

    let orderSubtotalCents: number | undefined;
    if (!useFlatReward) {
      const parsed = parseAmountToMinorUnits(amountInput, currencyExponent);
      if (parsed == null) {
        toast.error(
          `Enter a valid amount in ${currencyCode} (e.g. ${currencyExponent === 0 ? '10000' : '100.50'}).`,
        );
        return;
      }
      orderSubtotalCents = parsed;
    }

    let referredClerkId: string;
    let needsBootstrap = false;

    if (eligibleRows.length >= 1) {
      if (eligibleRows.length === 1) {
        referredClerkId = eligibleRows[0].referredClerkId;
      } else if (selectedReferredId) {
        referredClerkId = selectedReferredId;
      } else {
        toast.error('Multiple referred users match — pick which one below.');
        return;
      }
    } else {
      const manual = manualReferredClerkId.trim();
      if (manual) {
        needsBootstrap = true;
        referredClerkId = manual;
      } else {
        toast.error(
          noEligibleRowsMessage({
            normalizedInputCode,
            referralRows,
            totalSignupCount,
          }),
          { duration: 8000 },
        );
        return;
      }
    }

    const orderExternalId = `dev-sim-${Date.now()}`;

    const body: Record<string, unknown> = {
      referredClerkId,
      orderExternalId,
      discountApplied,
    };
    if (orderSubtotalCents !== undefined) {
      body.orderSubtotalCents = orderSubtotalCents;
    }

    setSubmitting(true);
    try {
      if (needsBootstrap) {
        const ensureUrl = `${getApiBaseUrl()}/referrals/internal/dev/ensure-referral`;
        const ensureRes = await fetch(ensureUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: codeInput,
            referredClerkId,
          }),
        });
        const ensureText = await ensureRes.text();
        let ensureParsed: unknown;
        try {
          ensureParsed = ensureText ? JSON.parse(ensureText) : null;
        } catch {
          ensureParsed = null;
        }
        if (!ensureRes.ok) {
          toast.error(
            messageFromUnknownBody(
              ensureParsed,
              ensureText || ensureRes.statusText,
            ),
          );
          return;
        }
      }

      const url = `${getApiBaseUrl()}/referrals/orders/complete`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let parsedBody: unknown;
      try {
        parsedBody = text ? JSON.parse(text) : null;
      } catch {
        parsedBody = null;
      }
      if (!res.ok) {
        toast.error(messageFromUnknownBody(parsedBody, text || res.statusText));
        return;
      }
      const data = parsedBody as OrderCompleteSuccess;
      const at = formatPurchaseAt(data.purchaseAt);
      toast.success(
        `Simulated — ${data.rewardPoints.toLocaleString()} pts pending · purchase ${data.purchaseId.slice(0, 8)}… · ${at}`,
        { duration: 6000 },
      );
      await queryClient.invalidateQueries({ queryKey: ['referrals', 'dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['referrals', 'my-code'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const showPicker = eligibleRows.length > 1;

  return (
    <section
      className="rounded border border-dotted border-black bg-white p-5 text-black shadow-sm sm:p-6 dark:border-zinc-300 dark:bg-card dark:text-zinc-100"
      aria-label="Development only: simulate purchase"
    >
      <div className="mb-4">
        <p>
          <span className="inline-block rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-zinc-950">
            Development only
          </span>
        </p>
        <h2 className="mt-2 text-lg font-medium text-black dark:text-foreground">
          Simulate purchase
        </h2>
      </div>
      <form onSubmit={(e) => void simulatePurchase(e)} className="space-y-4">
        <div>
          <label
            htmlFor="dev-referral-code"
            className="text-sm font-medium text-black dark:text-foreground"
          >
            Referral code
          </label>
          <input
            id="dev-referral-code"
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            className={inputClassName}
            placeholder="4XYKDBJ6XC"
          />
        </div>

        {eligibleRows.length === 0 ?
          <div>
            <label
              htmlFor="dev-manual-referred-id"
              className="text-sm font-medium text-black dark:text-foreground"
            >
              Referred user Clerk ID
            </label>
            <input
              id="dev-manual-referred-id"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={manualReferredClerkId}
              onChange={(e) => setManualReferredClerkId(e.target.value)}
              className={inputClassName}
              placeholder="user_2abc…"
            />
            <p className="mt-2 text-xs text-gray-600">
              When Activity has no eligible referral, paste the buyer’s Clerk user id (second test account).
              Bootstrap runs as your signed-in account via Clerk JWT (same as Simulate purchase).
            </p>
          </div>
        : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-black dark:text-foreground">
            <input
              type="checkbox"
              checked={discountApplied}
              onChange={(e) => setDiscountApplied(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Discount applied
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-black dark:text-foreground">
            <input
              type="checkbox"
              checked={useFlatReward}
              onChange={(e) => {
                setUseFlatReward(e.target.checked);
              }}
              className="h-4 w-4 rounded border-border"
            />
            Use flat points (omit subtotal)
          </label>
        </div>

        <div>
          <span
            id="dev-amount-label"
            className="text-sm font-medium text-black dark:text-foreground"
          >
            Amount (subtotal in selected currency, before tax/shipping)
          </span>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              id="dev-amount"
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              aria-labelledby="dev-amount-label"
              disabled={useFlatReward}
              className={`min-w-0 flex-1 ${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
              placeholder={currencyExponent === 0 ? '10000' : '100.00'}
            />
            <Popover
              open={useFlatReward ? false : currencyOpen}
              onOpenChange={(open) => {
                if (useFlatReward) {
                  return;
                }
                setCurrencyOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={useFlatReward}
                  aria-label="Currency"
                  className={cn(
                    fieldClassName,
                    'flex w-full shrink-0 items-center justify-between gap-2 font-normal disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[11rem] sm:w-auto',
                  )}
                >
                  <span className="min-w-0 text-left">
                    {selectedCurrencyOption?.label ?? currencyCode}
                  </span>
                  <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={4} className="min-w-[11rem] w-56 p-0">
                <PopoverHeader className="border-border border-b px-3 py-2">
                  <PopoverTitle className="text-muted-foreground text-xs font-medium">
                    Currency
                  </PopoverTitle>
                </PopoverHeader>
                <div className="max-h-[min(280px,50vh)] overflow-y-auto py-1">
                  {DEV_SIMULATE_CURRENCY_OPTIONS.map((c) => {
                    const isActive = c.code === currencyCode;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        className={
                          isActive
                            ? 'flex w-full items-center gap-2 bg-muted px-3 py-2 text-left text-sm font-medium hover:bg-muted'
                            : 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted'
                        }
                        onClick={() => {
                          setCurrencyCode(c.code);
                          setCurrencyOpen(false);
                        }}
                      >
                        <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                          {isActive ? <Check className="size-4" /> : null}
                        </span>
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {rewardPreview.mode === 'subtotal' &&
          rewardPreview.amountValid &&
          rewardPreview.points != null ?
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Preview ~{rewardPreview.points.toLocaleString()} pts (
              {rewardPreview.minorUnits?.toLocaleString()} minor units).
            </p>
          : null}
          {rewardPreview.mode === 'flat' && rewardPreview.points != null ?
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Preview flat ~{rewardPreview.points.toLocaleString()} pts.
            </p>
          : null}
        </div>
        {showPicker ?
          <div>
            <label
              htmlFor="dev-referred-id"
              className="text-sm font-medium text-black dark:text-foreground"
            >
              Referred user
            </label>
            <select
              id="dev-referred-id"
              value={selectedReferredId}
              onChange={(e) => setSelectedReferredId(e.target.value)}
              className={inputClassName}
            >
              <option value="">Choose referred user…</option>
              {eligibleRows.map((row) => (
                <option key={row.id} value={row.referredClerkId}>
                  {maskReferred(row.referredClerkId)} · signup {formatSignupAt(row.signupAt)}
                </option>
              ))}
            </select>
          </div>
        : null}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full cursor-pointer items-center justify-center rounded bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 sm:w-auto dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
        >
          {submitting ? 'Sending…' : 'Simulate purchase'}
        </button>
      </form>
    </section>
  );
}
