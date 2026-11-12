import { formatNumber } from '../program'

// Miles this year as a runway: the flown part in Miles, the next reward as a pale Miles stretch, the cap at the far end.
export function MilesProgress({ used, limit, pending = 0 }: { used: number; limit: number; pending?: number }) {
  const pct = Math.min(100, (used / limit) * 100)
  const next = Math.min(100 - pct, (pending / limit) * 100)
  return (
    <div className="flex flex-col gap-3">
      <p className="tabular text-body">
        <span className="font-medium">{formatNumber(used)}</span> of {formatNumber(limit)} miles this year
      </p>
      <div
        className="relative h-4 w-full rounded-pill bg-line"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-label="Miles this year"
      >
        <div className="absolute inset-y-0 left-0 rounded-pill bg-miles" style={{ width: `${pct}%` }} />
        {next > 0 && (
          <div className="absolute inset-y-0 rounded-r-pill bg-miles/25" style={{ left: `${pct}%`, width: `${next}%` }} />
        )}
        {/* runway centre line on the part still to fly */}
        <div
          className="absolute top-1/2 right-3 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-paper"
          style={{ left: `calc(${pct + next}% + 10px)` }}
          aria-hidden="true"
        />
      </div>
      {pending > 0 && (
        <p className="tabular text-small text-ink-soft">Your next mission adds {formatNumber(pending)} miles</p>
      )}
    </div>
  )
}
