// Read-only star row. Partial stars are drawn by clipping a filled row.
export function Stars({ value, size = "h-4 w-4", className = "" }: { value: number; size?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (cls: string) => (
    <span className={`flex ${cls}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={`${size} shrink-0`} fill="currentColor" aria-hidden="true">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </span>
  );
  return (
    <span className={`relative inline-flex ${className}`} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {row("text-stone-200")}
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>{row("text-amber-400")}</span>
    </span>
  );
}
