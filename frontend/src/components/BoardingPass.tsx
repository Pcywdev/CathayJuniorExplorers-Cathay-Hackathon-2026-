import { PlaneIcon } from './PlaneIcon'
import { formatNumber } from '../program'

interface Props {
  missionTitle: string
  miles: number
  from: string
  to: string
  gate: string
  seat: string
}

// Hero document: main section + stub, split by a dashed tear line with notches.
export function BoardingPass({ missionTitle, miles, from, to, gate, seat }: Props) {
  return (
    <article className="relative flex rounded-doc bg-paper shadow-doc" aria-label={`Boarding pass: ${missionTitle}`}>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <h2 className="font-display text-heading">{missionTitle}</h2>
        <div className="flex items-center gap-3 font-mono text-airport">
          <span>{from}</span>
          <PlaneIcon className="text-jade" />
          <span>{to}</span>
        </div>
        <div className="flex gap-6 font-mono text-flight">
          <span>Gate {gate}</span>
          <span>Seat {seat}</span>
        </div>
      </div>

      <div className="relative w-24 border-l-2 border-dashed border-line">
        <span className="absolute -top-3 -left-3 h-6 w-6 rounded-pill bg-sky" />
        <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-pill bg-sky" />
        <div className="flex h-full flex-col items-center justify-center rounded-r-doc bg-miles/15">
          <span className="tabular font-display text-title text-ink">+{formatNumber(miles)}</span>
          <span className="text-small text-ink">miles</span>
        </div>
      </div>
    </article>
  )
}
