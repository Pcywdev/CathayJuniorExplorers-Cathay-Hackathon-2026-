import { formatNumber } from '../program'

export function MilesProgress({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100)
  return (
    <div className="flex flex-col gap-2">
      <p className="tabular text-body">
        <span className="font-medium">{formatNumber(used)}</span> of {formatNumber(limit)} miles this year
      </p>
      <div className="h-2 w-full rounded-pill bg-line" role="presentation">
        <div className="h-2 rounded-pill bg-miles" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
