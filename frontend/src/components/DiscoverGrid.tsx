import { useState } from 'react'
import { pickForAge, tierForAge, type DiscoverItem, type DiscoverKind } from '../xplorers/discover'
import { formatNumber } from '../program'

const ICON_PATHS: Record<DiscoverKind, React.ReactNode> = {
  // Controller
  game: (
    <>
      <rect x="2.5" y="6.5" width="19" height="11" rx="5.5" />
      <path d="M8 10v4M6 12h4M15.5 11h.01M17.5 13h.01" />
    </>
  ),
  // Calendar
  event: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  // Tag
  discount: (
    <>
      <path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5l8 8a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0z" />
      <path d="M8 8h.01" />
    </>
  ),
  // Compass
  activity: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
}

const KIND_LABEL: Record<DiscoverKind, string> = {
  game: 'Game',
  event: 'Event',
  discount: 'Discount',
  activity: 'Activity',
}

function KindIcon({ kind }: { kind: DiscoverKind }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-jade">
      {ICON_PATHS[kind]}
    </svg>
  )
}

// Games earn miles; everything else with a number costs miles. Pale Miles tint behind the number (DESIGN.md).
function MilesPill({ item }: { item: DiscoverItem }) {
  if (item.miles == null) return <span className="text-small text-ink-soft">Free</span>
  const earn = item.kind === 'game'
  return (
    <span className="tabular inline-flex items-center gap-1.5 self-start rounded-pill bg-miles/15 px-2 py-0.5 text-small text-ink">
      <span className="inline-block h-2 w-2 rounded-pill bg-miles" aria-hidden="true" />
      {earn ? '+' : ''}
      {formatNumber(item.miles)} miles
    </span>
  )
}

// Replaces "My missions" on Home: a fresh age-weighted draw each time the screen mounts.
// Tiles, not cards: a two-column grid ruled with Line dividers (DESIGN.md: lists are not containers).
export function DiscoverGrid({ age }: { age: number }) {
  // Drawn once per mount, so trip moments re-rendering Home don't reshuffle it.
  const [items] = useState(() => pickForAge(age))
  const tier = tierForAge(age)

  return (
    <section className="flex flex-col" aria-label="Picked for you">
      <div className="flex items-baseline justify-between gap-2 pb-3">
        <h2 className="font-display text-heading">Picked for you</h2>
        <span className="text-small text-ink-soft">
          Age {age} · {tier.name}
        </span>
      </div>
      <ul className="grid grid-cols-2 border-t border-line">
        {items.map((item, i) => (
          <li key={item.id} className={`border-b border-line ${i % 2 === 0 ? 'border-r pr-3' : 'pl-3'}`}>
            <div className="flex h-full w-full flex-col gap-2 py-3">
              <span className="flex items-center justify-between gap-2">
                <KindIcon kind={item.kind} />
                <span className="text-small text-ink-soft">{KIND_LABEL[item.kind]}</span>
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-body font-medium text-ink">{item.title}</span>
                <span className="text-small text-ink-soft">{item.where}</span>
              </span>
              <MilesPill item={item} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
