'use client';

import { useEffect, useRef, useState } from 'react';

const DIAGRAM_SOURCE = `flowchart TB
  KikBack["💻 KikBack_app"]
  erpPos["ERP/POS"]

  erpPos -->|"earn points from referral code"| KikBack
  KikBack -->|"trade goods for points"| erpPos`;

function newDiagramElementId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `m-explainer-${crypto.randomUUID()}`;
  }
  return `m-explainer-${Math.random().toString(36).slice(2, 11)}`;
}

export function DevSimulatePurchaseExplainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramIdRef = useRef(newDiagramElementId());
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    el.innerHTML = '';
    let cancelled = false;

    void (async () => {
      try {
        const { default: mermaid } = await import('mermaid');
        if (cancelled) {
          return;
        }
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
        });
        const { svg, bindFunctions } = await mermaid.render(
          diagramIdRef.current,
          DIAGRAM_SOURCE,
          el,
        );
        if (cancelled) {
          return;
        }
        el.innerHTML = svg;
        bindFunctions?.(el);
        setStatus('ready');
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-3 space-y-3">
      <p
        className="rounded-md bg-zinc-900 px-3 py-2 text-xs leading-snug text-white dark:bg-zinc-950"
        aria-live="polite"
      >
        <span className="block">
          Development only: simulate a completed purchase via the referrals API here to validate
          rewards and referral plumbing without calling live merchant systems.
        </span>
        <span className="mt-2 block">
          In production, KikBack integrates with merchant POS and ERP through APIs. Buyers enter their
          code at checkout; the transaction is captured in POS, ERP, or both, which drives earning
          points. Redeeming points flows through the claim module, settling as goods picked up via
          the POS or ERP path the retailer exposes — not wired by this preview.
        </span>
      </p>
      <div
        className="overflow-x-auto rounded border border-border bg-white p-3 dark:border-border dark:bg-background"
        aria-busy={status === 'loading'}
        aria-label="API-backed integration between KikBack and ERP/POS: referral code flows from ERP/POS to earn points on the app; one return path trades goods for points back to ERP/POS."
        role="img"
      >
        {status === 'loading' ?
          <p className="text-muted-foreground mb-2 text-xs">Loading diagram…</p>
        : null}
        {status === 'error' ?
          <p className="text-destructive text-xs">Could not render diagram.</p>
        : null}
        <div
          ref={containerRef}
          className="mermaid-explainer-svg flex min-h-[4rem] justify-center [&>svg]:max-h-[min(260px,40vh)]"
        />
      </div>
    </div>
  );
}
