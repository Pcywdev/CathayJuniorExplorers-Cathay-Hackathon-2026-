import type { MissionState } from '../mocks/trip'

interface Mission {
  id: string
  title: string
  miles: number
  state: MissionState
}

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

// Plain rows with Line dividers, not cards. Done missions show their earned miles in Miles colour.
export function MissionList({ missions }: { missions: Mission[] }) {
  return (
    <ul className="flex flex-col" aria-label="Missions">
      {missions.map((m) => (
        <li key={m.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
          {m.state === 'done' ? <CheckIcon /> : <LockIcon />}
          <span className={`flex-1 text-body ${m.state === 'done' ? 'font-medium text-ink' : 'text-ink-soft'}`}>
            {m.title}
            {m.state === 'locked' && <span className="sr-only"> (locked)</span>}
          </span>
          <span className={`tabular text-body font-medium ${m.state === 'done' ? 'text-ink' : 'text-ink-soft'}`}>
            {m.state === 'done' && <span className="mr-1.5 inline-block h-2 w-2 rounded-pill bg-miles align-middle" aria-hidden="true" />}+{m.miles}
          </span>
        </li>
      ))}
    </ul>
  )
}
