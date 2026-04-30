'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, Hand, Mail, X } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';
import { createAuthedApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  getReferralShareHref,
  type ReferralSharePlatform,
} from '@/lib/referral-share';
import { formatPurchaseReceiptId } from '@/lib/purchase-receipt-id';
import { DevSimulatePurchasePanel } from '@/components/dev-simulate-purchase-panel';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'KIKBACK';

const isDev = process.env.NODE_ENV === 'development';

/** Mirrors `ENV` in `.env` / server env (`next.config.ts` → `NEXT_PUBLIC_ENV`). */
const isDevelopmentEnv =
  process.env.NEXT_PUBLIC_ENV === 'development';

function formatPoints(points: number) {
  const abs = Math.abs(points);
  const base = `${abs.toLocaleString()} pts`;
  if (points < 0) {
    return `−${base}`;
  }
  return base;
}

function maskClerkIdPreview(id: string) {
  if (id.length <= 10) {
    return `${id.slice(0, 3)}…`;
  }
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

/** Mirrors dashboard purchase row from ReferralRowDto JSON. */
type ReferralActivityItem = {
  id: string;
  referralId: string;
  referredClerkId: string;
  codeUsed: string;
  signupAt: string;
  purchaseAt: string;
  orderExternalId: string;
  discountApplied: boolean;
  rewardPoints: number;
  rewardStatus: string;
  issuedAt: string | null;
  notes: string | null;
  metadata: unknown | null;
  createdAt?: string;
  updatedAt?: string;
};

function formatMetadataDisplay(metadata: unknown): string | null {
  if (metadata == null) {
    return null;
  }
  if (typeof metadata === 'string') {
    return metadata;
  }
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}

type ReferralSignupSummary = {
  id: string;
  referredClerkId: string;
  codeUsed: string;
  signupAt: string;
};

type WithdrawalActivityItem = {
  id: string;
  createdAt: string;
  pointsDelta: number;
  receiptLabel: string;
  summary: string;
  status: string;
  items?: Array<{
    sourceProductId: string;
    title: string;
    imageUrl: string | null;
    unitPoints: number;
    quantity: number;
    currencyUnitPrice: number | null;
  }>;
};

type DashboardActivityRow =
  | { kind: 'purchase'; purchase: ReferralActivityItem }
  | { kind: 'withdrawal'; withdrawal: WithdrawalActivityItem };

type ReferralsDashboardResponse = {
  stats: {
    totalSignups: number;
    totalPurchased: number;
    pendingRewardPoints: number;
    issuedRewardPoints: number;
    redeemedRewardPoints: number;
    availablePendingPoints: number
  };
  items: ReferralActivityItem[];
  referralSignups: ReferralSignupSummary[];
  totalItems: number;
  activity: DashboardActivityRow[];
};

type ClaimCatalogItem = {
  sourceProductId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  category: string | null;
  rawPrice: number;
  pointCost: number;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[minmax(10rem,1fr)_2fr] sm:gap-8">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </dt>
      <dd className="min-w-0 font-sans text-sm text-foreground break-words">
        {value}
      </dd>
    </div>
  );
}

function PurchaseDetailPanel({ row }: { row: ReferralActivityItem }) {
  const receipt = formatPurchaseReceiptId(row);
  const metaStr = formatMetadataDisplay(row.metadata);

  return (
    <div className="flex flex-col gap-6">
      <dl>
        <DetailRow label="Receipt #" value={receipt ?? '—'} />
        <DetailRow label="Code used" value={row.codeUsed} />
        <DetailRow
          label="Purchase"
          value={new Date(row.purchaseAt).toLocaleString()}
        />
        <DetailRow
          label="Signed up"
          value={new Date(row.signupAt).toLocaleString()}
        />
        <DetailRow
          label="Referred user"
          value={<span className="font-mono text-xs">{maskClerkIdPreview(row.referredClerkId)}</span>}
        />
        <DetailRow
          label="Order ID"
          value={row.orderExternalId ?? '—'}
        />
        <DetailRow
          label="Discount applied"
          value={row.discountApplied ? 'Yes' : 'No'}
        />
        <DetailRow
          label="Points earned"
          value={formatPoints(row.rewardPoints)}
        />
        <DetailRow
          label="Reward status"
          value={<span className="capitalize">{row.rewardStatus}</span>}
        />
        <DetailRow
          label="Issued at"
          value={
            row.issuedAt ?
              new Date(row.issuedAt).toLocaleString()
            : '—'}
        />
        {row.notes ?
          <DetailRow label="Notes" value={row.notes} />
        : null}
        {metaStr ?
          <DetailRow
            label="Metadata"
            value={
              <pre className="max-h-48 overflow-auto rounded bg-zinc-100 p-3 text-xs whitespace-pre-wrap max-w-full font-mono text-zinc-800">
                {metaStr}
              </pre>
            }
          />
        : null}
      </dl>
    </div>
  );
}

function WithdrawalDetailPanel({ row }: { row: WithdrawalActivityItem }) {
  return (
    <div className="flex flex-col gap-6">
      <dl>
        <DetailRow label="Receipt #" value={row.receiptLabel} />
        <DetailRow
          label="Requested"
          value={new Date(row.createdAt).toLocaleString()}
        />
        <DetailRow label="Summary" value={row.summary} />
        <DetailRow label="Points" value={formatPoints(row.pointsDelta)} />
        <DetailRow
          label="Status"
          value={(
            <span className="capitalize">
              {row.status.replace(/_/g, ' ')}
            </span>
          )}
        />
        {row.items && row.items.length > 0 ?
          <DetailRow
            label="Line items"
            value={(
              <ul className="list-inside list-disc space-y-2 text-sm">
                {row.items.map((line) => (
                  <li key={`${line.sourceProductId}-${line.unitPoints}`}>
                    {line.title} × {line.quantity} —{' '}
                    {formatPoints(line.unitPoints * line.quantity)}
                  </li>
                ))}
              </ul>
            )}
          />
        : null}
      </dl>
    </div>
  );
}

const shareIconClass = 'h-4 w-4 shrink-0';
const shareButtonClass =
  'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-border bg-background text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-100';

const STAT_DEFS = [
  {
    label: 'Referrals',
    get: (d: ReferralsDashboardResponse) => d.stats.totalSignups,
    display: (n: number) => String(n),
  },
  {
    label: 'Purchased',
    get: (d: ReferralsDashboardResponse) => d.stats.totalPurchased,
    display: (n: number) => String(n),
  },
  {
    label: 'Available points',
    get: (d: ReferralsDashboardResponse) => d.stats.availablePendingPoints,
    display: formatPoints,
  },
  {
    label: 'Claimed points',
    get: (d: ReferralsDashboardResponse) => d.stats.redeemedRewardPoints,
    display: formatPoints,
  },
] as const;

const ACTIVITY_SKELETON_ROWS = 5;
const EMPTY_COL_SPAN = 4;

function IconX() {
  return (
    <svg className={shareIconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg className={shareIconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg className={shareIconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg className={shareIconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const sharePlatforms: Array<{
  platform: ReferralSharePlatform;
  label: string;
  icon: ReactNode;
  external: boolean;
}> = [
  { platform: 'x', label: 'Share on X', icon: <IconX />, external: true },
  {
    platform: 'whatsapp',
    label: 'Share on WhatsApp',
    icon: <IconWhatsApp />,
    external: true,
  },
  { platform: 'email', label: 'Share by email', icon: <Mail className={shareIconClass} aria-hidden />, external: false },
  {
    platform: 'facebook',
    label: 'Share on Facebook',
    icon: <IconFacebook />,
    external: true,
  },
  {
    platform: 'linkedin',
    label: 'Share on LinkedIn',
    icon: <IconLinkedIn />,
    external: true,
  },
];

export default function ReferralsDashboardPage() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activityDetail, setActivityDetail] = useState<
    | { kind: 'purchase'; row: ReferralActivityItem }
    | { kind: 'withdrawal'; row: WithdrawalActivityItem }
    | null
  >(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});

  const onSessionInvalid = useCallback(() => {
    void signOut({ redirectUrl: '/sign-in' });
  }, [signOut]);

  const queryEnabled = Boolean(isLoaded && isSignedIn);

  const dashboardTake = isDev ? 100 : 20;

  type ReferralsMeSummaryResponse = {
    code: { code: string; shareUrl: string };
    dashboard: ReferralsDashboardResponse;
  };

  const meSummary = useQuery({
    queryKey: ['referrals', 'me-summary', dashboardTake],
    enabled: queryEnabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const api = createAuthedApi(getToken, {
        onSessionInvalid,
      });
      const qs = `?skip=0&take=${dashboardTake}`;
      const { data } = await api.get<ReferralsMeSummaryResponse>(
        `/referrals/me/summary${qs}`,
      );
      return data;
    },
  });

  const dashboard = {
    data: meSummary.data?.dashboard,
    isLoading: meSummary.isLoading,
    error: meSummary.error,
  };

  const myCode = {
    data: meSummary.data?.code,
    isLoading: meSummary.isLoading,
    error: meSummary.error,
  };

  const claimCatalog = useQuery({
    queryKey: ['referrals', 'claim-catalog'],
    enabled: queryEnabled && claimOpen,
    staleTime: 60_000,
    queryFn: async () => {
      const api = createAuthedApi(getToken, { onSessionInvalid });
      const { data } = await api.get<ClaimCatalogItem[]>(
        '/referrals/me/claim/catalog?limit=100',
      );
      return data;
    },
  });

  const submitClaim = useMutation({
    mutationFn: async (lines: Array<{ sourceProductId: string; quantity: number }>) => {
      const api = createAuthedApi(getToken, { onSessionInvalid });
      const { data } = await api.post<{
        id: string;
        receiptLabel: string;
        pointsTotal: number;
        status: string;
        posReference: string | null;
        erpReference: string | null;
      }>('/referrals/me/claim', { lines });
      return data;
    },
    onSuccess: () => {
      toast.success('Claim submitted');
      setClaimOpen(false);
      setQtyByProduct({});
      void queryClient.invalidateQueries({ queryKey: ['referrals', 'me-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['referrals', 'claim-catalog'] });
    },
    onError: (err: unknown) => {
      let msg = 'Claim failed';
      if (isAxiosError(err)) {
        const m = err.response?.data;
        if (m && typeof m === 'object' && 'message' in m) {
          const raw = (m as { message?: unknown }).message;
          msg = Array.isArray(raw) ? raw.join(', ') : String(raw ?? msg);
        } else if (err.message) {
          msg = err.message;
        }
      }
      toast.error(msg);
    },
  });

  const cartTotalPoints = useMemo(() => {
    const list = claimCatalog.data;
    if (!list) {
      return 0;
    }
    let t = 0;
    for (const p of list) {
      const q = qtyByProduct[p.sourceProductId] ?? 0;
      if (q > 0) {
        t += p.pointCost * q;
      }
    }
    return t;
  }, [claimCatalog.data, qtyByProduct]);

  function setProductQty(sourceProductId: string, quantity: number) {
    setQtyByProduct((prev) => {
      const next = { ...prev };
      if (quantity < 1) {
        delete next[sourceProductId];
      } else {
        next[sourceProductId] = quantity;
      }
      return next;
    });
  }

  async function copyCode() {
    const code = myCode.data?.code;
    if (!code) {
      return;
    }
    if (!navigator.clipboard?.writeText) {
      toast.error('Clipboard not available');
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied');
    } catch {
      toast.error('Could not copy');
    }
  }

  const code = myCode.data?.code;
  const showYourCodeSection = !myCode.error;
  const showDashboardSections = !dashboard.error;
  const dashboardInitialLoading =
    queryEnabled && dashboard.isLoading && !dashboard.data;

  const activityRows: DashboardActivityRow[] = useMemo(() => {
    const d = dashboard.data;
    if (!d) {
      return [];
    }
    if (Array.isArray(d.activity) && d.activity.length > 0) {
      return d.activity;
    }
    return d.items.map((purchase) => ({
      kind: 'purchase' as const,
      purchase,
    }));
  }, [dashboard.data]);

  const availableToClaim = dashboard.data?.stats.availablePendingPoints ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <Link href="/" className="font-semibold tracking-tight text-foreground">
            {appName}
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/"
              className="text-sm text-zinc-700 hover:text-foreground"
            >
              Home
            </Link>
            {!isLoaded ?
              <span className="h-8 w-8 shrink-0 animate-pulse rounded bg-foreground/10" />
            : isSignedIn ?
              <div className="shrink-0">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8 ring-1 !ring-zinc-300 ring-offset-0',
                      userButtonPopoverCard: 'shadow-xl',
                    },
                  }}
                />
              </div>
            : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="col-span-full min-w-0 text-center sm:col-span-1 sm:col-start-1 sm:row-start-1 sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Dashboard
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-700 sm:mx-0">
              Copy your code, share it anywhere, and track signups and reward points.
            </p>
          </div>

          {showYourCodeSection ?
            <section className="col-span-full row-start-2 rounded border border-border bg-card p-5 sm:col-span-2 sm:col-start-1 sm:row-start-2 sm:p-6">
              <h2 className="text-lg font-medium text-foreground">Your code</h2>
              {myCode.isLoading ?
                <div
                  className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
                  aria-busy="true"
                  aria-label="Loading referral code"
                >
                  <div className="min-w-0 flex-1 space-y-2 text-left">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-9 max-w-xs sm:h-10" />
                  </div>
                  <Skeleton className="h-10 w-full sm:w-36" />
                </div>
              : (
                <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0 text-left">
                    <p className="text-xs uppercase tracking-wide text-zinc-700">
                      Code
                    </p>
                    <p className="mt-1 font-sans text-xl font-semibold tracking-wide text-foreground sm:text-2xl">
                      {code}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
                  >
                    <Hand className="h-4 w-4" aria-hidden />
                    Copy code
                  </button>
                </div>
              )}

              {code ?
                <div className="mt-6 flex w-full flex-wrap justify-evenly gap-2 sm:justify-start">
                  {sharePlatforms.map(({ platform, label, icon, external }) => (
                    <a
                      key={platform}
                      className={shareButtonClass}
                      href={getReferralShareHref(platform, code, appName)}
                      {...(external ?
                        { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                      title={label}
                      aria-label={label}
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              : null}
            </section>
          : null}

          {showDashboardSections ?
            <button
              type="button"
              onClick={() => setClaimOpen(true)}
              disabled={
                dashboardInitialLoading ||
                (dashboard.data != null && availableToClaim <= 0)
              }
              className={cn(
                'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:justify-self-end sm:shrink-0',
                showYourCodeSection ? 'row-start-3' : 'row-start-2',
                'sm:col-start-2 sm:row-start-1',
              )}
            >
              <Gift className="h-4 w-4" aria-hidden />
              Claim
            </button>
          : null}
        </div>
        {isDevelopmentEnv ?
          <DevSimulatePurchasePanel
            defaultCode={myCode.data?.code}
            totalSignupCount={dashboard.data?.stats.totalSignups}
            referralRows={
              dashboard.data?.referralSignups.map((s) => ({
                id: s.id,
                referredClerkId: s.referredClerkId,
                codeUsed: s.codeUsed,
                signupAt: s.signupAt,
              })) ?? []
            }
          />
        : null}

        {showDashboardSections ?
          <>
            <section
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
              aria-busy={dashboardInitialLoading ? 'true' : undefined}
              aria-label={
                dashboardInitialLoading ? 'Loading referral statistics' : undefined
              }
            >
              {STAT_DEFS.map((def) => (
                <div
                  key={def.label}
                  className="rounded border border-border bg-card p-4 sm:p-5"
                >
                  {dashboardInitialLoading ?
                    <>
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="mt-3 h-9 w-20 sm:w-24" aria-hidden />
                    </>
                  : (
                    <>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-700">
                        {def.label}
                      </p>
                      {dashboard.data ?
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {def.display(def.get(dashboard.data))}
                        </p>
                      : (
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          —
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </section>

            <section className="overflow-hidden rounded border border-border bg-card">
              <div className="border-b border-border px-4 py-3 sm:px-6">
                <h2 className="text-lg font-medium text-foreground">Activity</h2>
              </div>
              <div
                className="min-h-[16rem] overflow-x-auto -mx-px"
                aria-busy={
                  dashboard.isLoading && !dashboard.data ? 'true' : undefined
                }
                aria-label={
                  dashboard.isLoading && !dashboard.data ?
                    'Loading referral activity'
                  : undefined
                }
              >
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead className="bg-zinc-100 text-xs font-medium uppercase tracking-wide text-zinc-900">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 sm:px-6">
                        Receipt #
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 sm:px-6">
                        Code used
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 sm:px-6">
                        Date
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 sm:px-6">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dashboard.isLoading && !dashboard.data ?
                      Array.from({ length: ACTIVITY_SKELETON_ROWS }, (_, i) => (
                        <tr key={`skeleton-${i}`}>
                          <td className="px-4 py-3 sm:px-6">
                            <Skeleton className="h-4 w-28" />
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <Skeleton className="h-4 w-14" />
                          </td>
                        </tr>
                      ))
                    : !dashboard.data ?
                      <tr>
                        <td
                          colSpan={EMPTY_COL_SPAN}
                          className="px-4 py-10 text-center text-zinc-700 sm:px-6"
                        >
                          {!queryEnabled ?
                            'Sign in to view referral activity.'
                          : 'No activity data yet.'}
                        </td>
                      </tr>
                    : activityRows.length === 0 ?
                      <tr>
                        <td
                          colSpan={EMPTY_COL_SPAN}
                          className="px-4 py-10 text-center text-zinc-700 sm:px-6"
                        >
                          {dashboard.data.stats.totalSignups > 0 ?
                            'No activity yet — purchases and reward claims will appear here.'
                          : 'No referrals yet — share your code to get started.'}
                        </td>
                      </tr>
                    : (
                      activityRows.map((entry) => {
                        if (entry.kind === 'purchase') {
                          const row = entry.purchase;
                          const receipt = formatPurchaseReceiptId(row);
                          return (
                            <tr
                              key={`p-${row.id}`}
                              role="button"
                              tabIndex={0}
                              className="cursor-pointer hover:bg-foreground/[0.03]"
                              onClick={() =>
                                setActivityDetail({
                                  kind: 'purchase',
                                  row,
                                })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setActivityDetail({
                                    kind: 'purchase',
                                    row,
                                  });
                                }
                              }}
                            >
                              <td className="px-4 py-3 font-sans text-xs sm:px-6">
                                {receipt ?? '—'}
                              </td>
                              <td className="px-4 py-3 font-sans text-xs sm:px-6">
                                {row.codeUsed}
                              </td>
                              <td className="px-4 py-3 text-zinc-700 sm:px-6">
                                {new Date(row.purchaseAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 sm:px-6">
                                {row.rewardPoints != null
                                  ? formatPoints(row.rewardPoints)
                                  : '—'}
                              </td>
                            </tr>
                          );
                        }
                        const w = entry.withdrawal;
                        return (
                          <tr
                            key={`w-${w.id}`}
                            role="button"
                            tabIndex={0}
                            className="cursor-pointer hover:bg-foreground/[0.03]"
                            onClick={() =>
                              setActivityDetail({
                                kind: 'withdrawal',
                                row: w,
                              })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setActivityDetail({
                                  kind: 'withdrawal',
                                  row: w,
                                });
                              }
                            }}
                          >
                            <td className="px-4 py-3 font-sans text-xs text-red-700 sm:px-6 dark:text-red-400">
                              {w.receiptLabel}
                            </td>
                            <td className="px-4 py-3 font-sans text-xs text-red-700 sm:px-6 dark:text-red-400">
                              —
                            </td>
                            <td className="px-4 py-3 text-red-700 sm:px-6 dark:text-red-400">
                              {new Date(w.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 font-medium text-red-700 sm:px-6 dark:text-red-400">
                              {formatPoints(w.pointsDelta)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <Dialog
              open={activityDetail !== null}
              onOpenChange={(open) => {
                if (!open) {
                  setActivityDetail(null);
                }
              }}
            >
              <DialogContent>
                {activityDetail?.kind === 'purchase' ?
                  <>
                    <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0 text-left">
                      <div className="min-w-0 space-y-1">
                        <DialogTitle>Purchase details</DialogTitle>
                        <DialogDescription className="sr-only">
                          Full purchase and referral information for this row.
                        </DialogDescription>
                      </div>
                      <DialogClose
                        type="button"
                        className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border border-border bg-background text-zinc-800 transition-colors hover:bg-zinc-100"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </DialogClose>
                    </DialogHeader>
                    <PurchaseDetailPanel row={activityDetail.row} />
                  </>
                : activityDetail?.kind === 'withdrawal' ?
                  <>
                    <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0 text-left">
                      <div className="min-w-0 space-y-1">
                        <DialogTitle>Claim details</DialogTitle>
                        <DialogDescription className="sr-only">
                          Reward withdrawal line items and status.
                        </DialogDescription>
                      </div>
                      <DialogClose
                        type="button"
                        className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border border-border bg-background text-zinc-800 transition-colors hover:bg-zinc-100"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </DialogClose>
                    </DialogHeader>
                    <WithdrawalDetailPanel row={activityDetail.row} />
                  </>
                : null}
              </DialogContent>
            </Dialog>

            <Dialog
              open={claimOpen}
              onOpenChange={(open) => {
                setClaimOpen(open);
                if (!open) {
                  setQtyByProduct({});
                }
              }}
            >
              <DialogContent className="max-h-[90vh] gap-2 overflow-y-auto border-0 shadow-lg ring-0 w-full max-w-lg sm:max-w-lg">
                <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-0 text-left">
                  <div className="min-w-0 flex-1 space-y-1 pr-2">
                    <DialogTitle>Claim rewards</DialogTitle>
                    <DialogDescription>
                      Select products to redeem with your available points (
                      {formatPoints(availableToClaim)} available).
                    </DialogDescription>
                  </div>
                  <DialogClose
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </DialogClose>
                </DialogHeader>
                {claimCatalog.isLoading ?
                  <div className="space-y-3 pt-1" aria-busy="true">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                : claimCatalog.error ?
                  <p className="pt-1 text-sm text-red-700">
                    Could not load catalog. Try again later.
                  </p>
                : (
                  <div className="flex flex-col gap-3 pt-1">
                    <ul className="max-h-[min(24rem,50vh)] space-y-3 overflow-y-auto pr-1">
                      {(claimCatalog.data ?? []).map((p) => {
                        const q = qtyByProduct[p.sourceProductId] ?? 0;
                        return (
                          <li
                            key={p.sourceProductId}
                            className="flex gap-3 rounded border border-border bg-background p-3"
                          >
                            {p.imageUrl ?
                              <Image
                                src={p.imageUrl}
                                alt=""
                                width={64}
                                height={64}
                                className="h-16 w-16 shrink-0 rounded object-contain"
                              />
                            : (
                              <div className="h-16 w-16 shrink-0 rounded bg-zinc-100" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-medium text-foreground">
                                {p.title}
                              </p>
                              <p className="mt-1 text-xs text-zinc-600">
                                {formatPoints(p.pointCost)} each
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  className="h-8 w-8 rounded border border-border text-sm font-medium hover:bg-zinc-50"
                                  onClick={() =>
                                    setProductQty(
                                      p.sourceProductId,
                                      Math.max(0, q - 1),
                                    )}
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
                                <span className="w-6 text-center text-sm tabular-nums">
                                  {q}
                                </span>
                                <button
                                  type="button"
                                  className="h-8 w-8 rounded border border-border text-sm font-medium hover:bg-zinc-50"
                                  onClick={() =>
                                    setProductQty(p.sourceProductId, q + 1)}
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="flex flex-col gap-2 border-t border-border pt-4">
                      <p className="text-sm text-zinc-700">
                        Total:{' '}
                        <span className="font-semibold text-foreground">
                          {formatPoints(cartTotalPoints)}
                        </span>
                      </p>
                      <button
                        type="button"
                        disabled={
                          submitClaim.isPending ||
                          cartTotalPoints < 1 ||
                          cartTotalPoints > availableToClaim
                        }
                        onClick={() => {
                          const lines = Object.entries(qtyByProduct)
                            .filter(([, n]) => n > 0)
                            .map(([sourceProductId, quantity]) => ({
                              sourceProductId,
                              quantity,
                            }));
                          if (lines.length === 0) {
                            return;
                          }
                          submitClaim.mutate(lines);
                        }}
                        className="inline-flex items-center justify-center rounded bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitClaim.isPending ? 'Submitting…' : 'Submit claim'}
                      </button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        : null}
      </main>
    </div>
  );
}
