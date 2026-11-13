import { useState } from 'react'
import { formatNumber } from '../program'

export interface ValuePoint {
  age: number
  /** HK$ the family can use by this age if the child's miles move to the parent each year. */
  move: number
  /** ...if the child keeps them (miles usable from 18, plus member discounts after). */
  keep: number
}

const W = 313
const H = 150
const PAD = { top: 10, right: 6, bottom: 4, left: 6 }

const hkd = (n: number) => `HK$${formatNumber(Math.round(n))}`

// Two lines, one per choice: Keep = Jade, Move = Miles. Drag or tap across the chart to read both at any age.
// Lines are 2px; the end of each line carries its own label. A table mirrors it for screen readers.
export function ValueOverTime({ points, splitAge, moveLabel, keepLabel }: { points: ValuePoint[]; splitAge: number; moveLabel: string; keepLabel: string }) {
  const [pick, setPick] = useState(points.length - 1)
  const max = Math.max(...points.map((p) => Math.max(p.keep, p.move)))
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom)
  const path = (key: 'keep' | 'move') => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(' ')
  const splitI = points.findIndex((p) => p.age === splitAge)
  const p = points[pick]

  const scrub = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0 && e.pointerType !== 'mouse') return
    const box = e.currentTarget.getBoundingClientRect()
    const t = (e.clientX - box.left) / box.width
    setPick(Math.max(0, Math.min(points.length - 1, Math.round(t * (points.length - 1)))))
  }

  return (
    <figure className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3" aria-live="polite">
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-small text-ink-soft">
            <span className="h-0.5 w-4 bg-jade" aria-hidden="true" />
            {keepLabel}
          </span>
          <span className="tabular font-display text-title text-ink">{hkd(p.keep)}</span>
        </div>
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-small text-ink-soft">
            <span className="h-0.5 w-4 bg-miles" aria-hidden="true" />
            {moveLabel}
          </span>
          <span className="tabular font-display text-title text-ink">{hkd(p.move)}</span>
        </div>
      </div>
      <p className="-mt-1 text-small text-ink-soft">Value your family can use by age {p.age}</p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y select-none"
        onPointerDown={scrub}
        onPointerMove={scrub}
        aria-hidden="true"
      >
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="stroke-line" strokeWidth="1" />
        {/* 18th birthday */}
        <line x1={x(splitI)} x2={x(splitI)} y1={PAD.top} y2={H - PAD.bottom} className="stroke-ink-soft" strokeWidth="1.5" strokeDasharray="3 4" />
        <path d={path('move')} fill="none" className="stroke-miles" strokeWidth="2" strokeLinejoin="round" />
        <path d={path('keep')} fill="none" className="stroke-jade" strokeWidth="2" strokeLinejoin="round" />
        {/* scrubber */}
        <line x1={x(pick)} x2={x(pick)} y1={PAD.top} y2={H - PAD.bottom} className="stroke-ink" strokeWidth="1" />
        <circle cx={x(pick)} cy={y(p.move)} r="4.5" className="fill-miles stroke-paper" strokeWidth="2" />
        <circle cx={x(pick)} cy={y(p.keep)} r="4.5" className="fill-jade stroke-paper" strokeWidth="2" />
      </svg>

      <div className="relative h-[18px] text-small text-ink-soft" aria-hidden="true">
        {points.map((pt, i) =>
          i === 0 || i === points.length - 1 || pt.age === splitAge || i === pick ? (
            <span
              key={pt.age}
              className={`tabular absolute -translate-x-1/2 ${i === pick ? 'font-bold text-ink' : pt.age === splitAge ? 'font-medium text-ink' : ''}`}
              style={{ left: `${(x(i) / W) * 100}%` }}
            >
              {pt.age}
            </span>
          ) : null,
        )}
      </div>

      <div className="sr-only">
        <table>
          <caption>Value your family can use, by age</caption>
          <thead>
            <tr>
              <th>Age</th>
              <th>{keepLabel}</th>
              <th>{moveLabel}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((pt) => (
              <tr key={pt.age}>
                <th scope="row">{pt.age}</th>
                <td>{hkd(pt.keep)}</td>
                <td>{hkd(pt.move)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
