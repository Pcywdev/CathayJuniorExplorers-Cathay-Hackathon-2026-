import { useState } from 'react'
import type { TripMission } from '../api/types'

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-jade">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-ink-soft">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function OpenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-jade">
      <circle cx="12" cy="12" r="7.5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-jade">
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 13V9.5M12 13h3M10 3h4" />
    </svg>
  )
}

const STATE_TEXT = { done: 'done', available: 'ready', locked: 'locked' } as const
const SHORT = 3

// Pick the three that matter now: the latest finished mission, then what's next (ready before locked).
// Finishing a mission keeps it on the list, ticked, so nothing seems to vanish.
function shortList(missions: TripMission[], doneOrder: string[]) {
  const latest = [...doneOrder].reverse().map((id) => missions.find((m) => m.id === id)).filter(Boolean) as TripMission[]
  const todo = [...missions.filter((m) => m.state === 'available'), ...missions.filter((m) => m.state === 'locked')]
  const pick = [...latest.slice(0, 1), ...todo]
  for (const m of latest.slice(1)) pick.push(m)
  const ids = new Set(pick.slice(0, SHORT).map((m) => m.id))
  return missions.filter((m) => ids.has(m.id))
}

// My missions: plain rows with Line dividers, not cards. Done missions show their earned miles with a Miles dot.
// The delay bonus is a row of its own with no miles (it awards none yet, docs/api.md).
export function MissionList({ missions, doneOrder, bonus }: { missions: TripMission[]; doneOrder: string[]; bonus?: string }) {
  const [all, setAll] = useState(false)
  const shown = all ? missions : shortList(missions, doneOrder)
  const doneCount = missions.filter((m) => m.state === 'done').length

  return (
    <section className="flex flex-col" aria-label="My missions">
      <div className="flex items-baseline justify-between gap-2 pb-1">
        <h2 className="font-display text-heading">
          My missions <span className="tabular text-body font-normal text-ink-soft">{doneCount} of {missions.length} done</span>
        </h2>
        {missions.length > SHORT && (
          <button type="button" onClick={() => setAll(!all)} aria-expanded={all} className="h-11 px-1 text-body font-medium text-jade active:text-jade-pressed">
            {all ? 'Show less' : 'See all'}
          </button>
        )}
      </div>
      <ul className="flex flex-col">
        {bonus && (
          <li className="flex items-center gap-3 border-t border-line py-3">
            <ClockIcon />
            <span className="flex flex-1 flex-col">
              <span className="text-body font-medium text-ink">{bonus}</span>
              <span className="text-small text-ink-soft">Bonus for the extra time</span>
            </span>
          </li>
        )}
        {shown.map((m) => (
          <li key={m.id} className="flex items-center gap-3 border-t border-line py-3">
            {m.state === 'done' ? <CheckIcon /> : m.state === 'available' ? <OpenIcon /> : <LockIcon />}
            <span className={`flex-1 text-body ${m.state === 'locked' ? 'text-ink-soft' : 'font-medium text-ink'}`}>
              {m.title}
              <span className="sr-only"> ({STATE_TEXT[m.state]})</span>
            </span>
            <span className={`tabular text-body font-medium ${m.state === 'locked' ? 'text-ink-soft' : 'text-ink'}`}>
              {m.state === 'done' && <span className="mr-1.5 inline-block h-2 w-2 rounded-pill bg-miles align-middle" aria-hidden="true" />}+{m.miles}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
