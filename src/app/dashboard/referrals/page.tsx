'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Hand, Mail, X } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createAuthedApi } from '@/lib/api';
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
  return `${points.toLocaleString()} pts`;
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

type ReferralsDashboardResponse = {
  stats: {
    totalSignups: number;
    totalPurchased: number;
    pendingRewardPoints: number;
    issuedRewardPoints: number;
  };
  items: ReferralActivityItem[];
  referralSignups: ReferralSignupSummary[];
  totalItems: number;
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
    label: 'Pending points',
    get: (d: ReferralsDashboardResponse) => d.stats.pendingRewardPoints,
    display: formatPoints,
  },
  {
    label: 'Issued points',
    get: (d: ReferralsDashboardResponse) => d.stats.issuedRewardPoints,
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
  const [selectedRow, setSelectedRow] = useState<ReferralActivityItem | null>(
    null,
  );

  const onSessionInvalid = useCallback(() => {
    void signOut({ redirectUrl: '/sign-in' });
  }, [signOut]);

  const queryEnabled = Boolean(isLoaded && isSignedIn);

  const dashboardTake = isDev ? 100 : 20;

  const dashboard = useQuery({
    queryKey: ['referrals', 'dashboard', dashboardTake],
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
      const { data } = await api.get<ReferralsDashboardResponse>(
        `/referrals/me/dashboard${qs}`,
      );
      return data;
    },
  });

  const myCode = useQuery({
    queryKey: ['referrals', 'my-code'],
    enabled: queryEnabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const api = createAuthedApi(getToken, {
        onSessionInvalid,
      });
      const { data } = await api.get<{ code: string; shareUrl: string }>(
        '/referrals/me/code',
      );
      return data;
    },
  });

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
                      avatarBox: 'h-8 w-8 ring-1 ring-border',
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
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Referral dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-700 sm:mx-0 mx-auto">
            Copy your code, share it anywhere, and track signups and reward points.
          </p>
        </div>

        {showYourCodeSection ?
          <section className="rounded border border-border bg-card p-5 sm:p-6">
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
              className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
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
                        Purchase
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 sm:px-6">
                        Points earned
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
                    : dashboard.data.items.length === 0 ?
                      <tr>
                        <td
                          colSpan={EMPTY_COL_SPAN}
                          className="px-4 py-10 text-center text-zinc-700 sm:px-6"
                        >
                          {dashboard.data.stats.totalSignups > 0 ?
                            'No orders yet — referrals with signups will appear here after a qualifying purchase.'
                          : 'No referrals yet — share your code to get started.'}
                        </td>
                      </tr>
                    : (
                      dashboard.data.items.map((row) => {
                        const receipt = formatPurchaseReceiptId(row);
                        return (
                          <tr
                            key={row.id}
                            role="button"
                            tabIndex={0}
                            className="cursor-pointer hover:bg-foreground/[0.03]"
                            onClick={() => setSelectedRow(row)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedRow(row);
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
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <Dialog
              open={selectedRow !== null}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedRow(null);
                }
              }}
            >
              <DialogContent>
                {selectedRow ?
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
                    <PurchaseDetailPanel row={selectedRow} />
                  </>
                : null}
              </DialogContent>
            </Dialog>
          </>
        : null}
      </main>
    </div>
  );
}
