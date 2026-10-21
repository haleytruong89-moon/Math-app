/** A thin progress bar with "x/y" next to it (items reviewed, etc.). */
export function Progress({ value, total, label, className = "" }: { value: number; total: number; label?: string; className?: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="h-1.5 w-28 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={total} aria-label={label ?? `${value}/${total}`}>
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-11 font-mono text-xs text-muted">
        {value}/{total}
      </span>
    </span>
  );
}
