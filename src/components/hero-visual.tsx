/** Decorative fan of placeholder “art cards” — no external assets. */

const cards: { rotate: number; x: number; y: number; gradient: string }[] = [
  { rotate: -22, x: -72, y: 8, gradient: 'from-teal-500/85 to-cyan-900/60' },
  { rotate: -12, x: -38, y: 4, gradient: 'from-orange-400/80 to-rose-900/55' },
  { rotate: -4, x: 0, y: 0, gradient: 'from-violet-500/75 to-indigo-950/60' },
  { rotate: 8, x: 38, y: 5, gradient: 'from-emerald-500/78 to-teal-950/55' },
  { rotate: 18, x: 72, y: 12, gradient: 'from-fuchsia-500/70 to-purple-950/55' },
];

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-0 z-20 rounded-full border border-white/10 bg-blue-600 px-2.5 py-1 text-[10px] font-medium text-white shadow-md sm:left-[14%] sm:text-xs"
      >
        @coplin
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-[6%] top-1 z-20 rounded-full border border-white/10 bg-green-600 px-2.5 py-1 text-[10px] font-medium text-white shadow-md sm:right-[12%] sm:text-xs"
      >
        @andrea
      </div>
      <div className="relative mx-auto flex h-48 w-full items-center justify-center sm:h-56">
        <div className="relative h-32 w-40 sm:h-36 sm:w-48">
          {cards.map((c, i) => (
            <div
              key={i}
              className={`absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-gradient-to-br shadow-2xl ring-1 ring-white/5 sm:h-28 sm:w-28 ${c.gradient}`}
              style={{
                transform: `translate(calc(-50% + ${c.x}px), calc(-50% + ${c.y}px)) rotate(${c.rotate}deg)`,
                zIndex: i,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
