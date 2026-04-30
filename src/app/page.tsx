import Image from 'next/image';
import Link from 'next/link';
import { createReferralJsonLd } from '@/lib/referral-json-ld';
import { AppChrome } from '@/components/marketing/app-chrome';
import { GallerySection } from '@/components/marketing/gallery-section';
import { HeroAuthActions } from '@/components/marketing/hero-auth-actions';
import { Reveal } from '@/components/marketing/reveal';
import {
  ServicesAccordion,
  type AccordionItem,
} from '@/components/marketing/services-accordion';
import { LandingFooter } from '@/components/landing-footer';
import { TeamSection } from '@/components/marketing/team-section';

const HERO_BG =
  'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1920';
const CONTACT_BG =
  'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1920';

const SERVICE_ITEMS: AccordionItem[] = [
  {
    id: 'code',
    title: 'Your code, their shortcut',
    subtitle: 'One sign-in, always on',
    content:
      'We mint your referral code when you sign in—text it, DM it, or give it at checkout. Nothing to shorten or chase; just the code they type in.',
  },
  {
    id: 'share',
    title: 'Share where it converts',
    subtitle: 'They save on first buy',
    content:
      'Friends who check out with your code get their discount when it matters—at payment. Fair rails: one signup per referrer path, self-referrals off the table.',
  },
  {
    id: 'earn',
    title: 'Trace every reward',
    subtitle: 'Pending → issued, in plain sight',
    content:
      'Your dashboard lines up signups, orders, and reward status. When a purchase clears, you see it move—no blind spots, no mystery totals.',
  },
  {
    id: 'payout',
    title: 'Issuance you can forecast',
    subtitle: 'Reviewed, on rhythm',
    content:
      'Points move from pending to issued after review—steady partner ops instead of surprise reconciliations.',
  },
];

function sectionSnap(): string {
  return 'snap-start min-h-dvh flex flex-col justify-center';
}

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'KIKBACK';

export default function HomePage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000';
  const structuredData = createReferralJsonLd(siteUrl, appName);
  return (
    <>
      {structuredData.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
      <AppChrome>
        <main
          id="main-content"
          tabIndex={-1}
          className="snap-y snap-proximity font-sans outline-none"
        >
          <Reveal>
            <section
              className={`relative ${sectionSnap()} overflow-hidden text-white`}
            >
              <Image
                src={HERO_BG}
                alt="People collaborating around a glowing laptop in a studio"
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-black/58" aria-hidden />
              <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-12 pt-24 md:px-6 md:pb-14 md:pt-28">
                <div className="max-w-2xl space-y-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/82">
                    Share your code. Fund their discount.
                  </p>
                  <h1 className="text-4xl font-semibold uppercase leading-[1.08] tracking-tight md:text-5xl lg:text-[3.25rem]">
                    <span className="block text-white/95">
                      Your kickback when the sale clears.
                    </span>
                  </h1>
                  <p className="max-w-xl text-base leading-relaxed text-white/92 md:text-lg">
                    You share your code—they enter it at checkout and unlock real savings. When their
                    order completes, your points show up in one dashboard. Trace the story from that code to issuance.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <HeroAuthActions />
                  </div>
                </div>
                <div className="mt-14 border-t border-white/22 pt-6 md:mt-16">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/74">
                    Launch-ready in one sitting
                  </p>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85">
                    Your referral code ready to share, live referral states, and point totals your crew can trust—skip the
                    spreadsheet necromancy.
                  </p>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section
              id="program"
              className={`${sectionSnap()} bg-brand-cream/90 text-foreground`}
            >
              <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 md:grid-cols-2 md:items-start md:gap-14 md:px-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground/60">
                    The playbook
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold uppercase tracking-tight md:text-4xl">
                    Built for the full loop
                  </h2>
                  <p className="max-w-xl text-sm leading-relaxed text-foreground/78 md:text-base">
                    Four moves from first code sent to issued points—creators, stores, and
                    marketplaces stay on the same plot without losing a single referral.
                  </p>
                </div>
                <div className="min-w-0 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65">
                    The flow
                  </p>
                  <div className="overflow-hidden rounded-xl border border-border bg-card/60 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.08)]">
                    <ServicesAccordion items={SERVICE_ITEMS} />
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section
              id="gallery"
              className={`${sectionSnap()} bg-background text-foreground`}
            >
              <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground/58">
                      Out in the wild
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold uppercase tracking-tight md:text-4xl">
                      Referrals that ship
                    </h2>
                  </div>
                  <p className="max-w-md text-sm leading-relaxed text-foreground/75">
                    Teams passing codes that unlock instant savings for friends—and points they
                    can trace from launch day through every monthly close.
                  </p>
                </div>
                <div className="mt-10">
                  <GallerySection />
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section
              className={`${sectionSnap()} bg-brand-cream/85 text-foreground`}
            >
              <div className="mx-auto w-full max-w-4xl px-4 text-center md:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/65">
                  What partners say
                </p>
                <blockquote className="mt-5 text-2xl font-semibold uppercase leading-snug tracking-tight text-foreground md:text-3xl">
                  &ldquo;We finally trust the referral math—signups, orders, and points in one
                  place.&rdquo;
                </blockquote>
                <p className="mt-7 text-sm font-semibold uppercase tracking-[0.22em] text-foreground/65">
                  Field teams using {appName}
                </p>
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section
              id="team"
              className={`${sectionSnap()} bg-background text-foreground`}
            >
              <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground/58">
                      Behind the program
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold uppercase tracking-tight md:text-4xl">
                      Who keeps the loop honest
                    </h2>
                  </div>
                  <p className="max-w-md text-sm leading-relaxed text-foreground/75">
                    Program, product, and partnerships in sync—so every code sent, save, and issuance
                    stays fair and visible.
                  </p>
                </div>
                <TeamSection />
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section
              id="contact"
              className={`relative ${sectionSnap()} overflow-hidden text-white`}
            >
              <Image
                src={CONTACT_BG}
                alt="Hands holding a phone showing a share sheet"
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-black/62" aria-hidden />
              <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-12 pt-20 md:flex-row md:items-center md:justify-between md:px-6 md:pb-16 md:pt-24">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/72">
                    Your dashboard is waiting
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold uppercase tracking-tight md:text-4xl">
                    Start earning in minutes
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/86">
                    Connect authentication, plug in checkout callbacks, and let {appName} run
                    referral state end-to-end—so every code, discount, and reward shows up where you
                    expect it.
                  </p>
                </div>
                <div className="mt-10 flex flex-wrap gap-3 md:mt-0">
                  <Link
                    href="/dashboard/referrals"
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-950 shadow-lg transition hover:bg-neutral-100"
                  >
                    Open dashboard
                  </Link>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center rounded-full border border-white/55 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                  >
                    Create account
                  </Link>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center rounded-full border border-white/55 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </section>
          </Reveal>

          <LandingFooter />
        </main>
      </AppChrome>
    </>
  );
}
