const TEAM = [
  {
    name: 'Partnerships',
    role: 'Creator success',
    blurb:
      'We help ambassadors turn their audiences into thriving referral circles.',
  },
  {
    name: 'Growth',
    role: 'Rewards & points',
    blurb:
      'Transparent point balances, clear states, and support when you need it.',
  },
  {
    name: 'Product',
    role: 'Referral engine',
    blurb:
      'Short /r/CODE links, dashboard insights, and fair program rules built in.',
  },
];

export function TeamSection() {
  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-3">
      {TEAM.map((m) => (
        <div
          key={m.name}
          className="rounded-xl border border-border bg-card/50 p-6 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/50">
            {m.role}
          </p>
          <h3 className="mt-2 text-lg font-semibold uppercase tracking-tight text-foreground">
            {m.name}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-foreground/75">{m.blurb}</p>
        </div>
      ))}
    </div>
  );
}
