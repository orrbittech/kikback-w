/** Base URL for referral landing (`/r/:code`). Prefer live origin in the browser. */
export function getReferralShareBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
  );
}

export function getReferralLink(code: string): string {
  const base = getReferralShareBaseUrl();
  return `${base}/r/${encodeURIComponent(code)}`;
}

/** Code-first invite body for intents; link is appended for platforms that need context. */
export function getReferralInviteBody(code: string, appName: string): string {
  const link = getReferralLink(code);
  return `Use referral code ${code} with ${appName}. Sign up here: ${link}`;
}

export type ReferralSharePlatform =
  | 'x'
  | 'whatsapp'
  | 'email'
  | 'facebook'
  | 'linkedin';

export function getReferralShareHref(
  platform: ReferralSharePlatform,
  code: string,
  appName: string,
): string {
  const body = getReferralInviteBody(code, appName);
  const link = getReferralLink(code);

  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(body)}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(body)}`;
    case 'email': {
      const subject = encodeURIComponent(`${appName} referral invite`);
      return `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
    }
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
  }
}
