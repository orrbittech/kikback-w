'use client';

import { useState, type ReactNode } from 'react';

export type AccordionItem = {
  id: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
};

export function ServicesAccordion({ items }: { items: AccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-border">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-foreground/5"
              aria-expanded={open}
            >
              <span>
                <span className="block text-sm font-semibold uppercase tracking-tight text-foreground">
                  {item.title}
                </span>
                {item.subtitle ? (
                  <span className="mt-1 block text-xs font-medium uppercase tracking-wider text-foreground/55">
                    {item.subtitle}
                  </span>
                ) : null}
              </span>
              <span
                className="mt-0.5 shrink-0 text-foreground/50 transition-transform"
                style={{ transform: open ? 'rotate(45deg)' : undefined }}
                aria-hidden
              >
                +
              </span>
            </button>
            {open ? (
              <div className="border-t border-border bg-card/40 px-4 pb-4 pt-3 text-sm leading-relaxed text-foreground/80">
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
