import { useState } from 'react'
import { ConceptLabel } from '../components/ConceptLabel'
import { HealthCard } from '../components/HealthCard'
import { JuniorModeToggle } from '../components/JuniorModeToggle'
import { RouteGlobeStatic } from '../components/RouteGlobeStatic'
import { formatNumber, missionById } from '../program'
import { mockTrip } from '../mocks/trip'
import type { GlobeLayout } from '../three/geo'

const DATA_USED = ['Age band', 'Destination', 'Flight length', 'Trip events']

// Thumbnail globe: whole disc centred in its box, looking straight at the route.
const thumbLayout = (w: number, h: number): GlobeLayout => ({
  r: w / 2 - 3,
  cx: w / 2,
  cy: h / 2,
  view: { lat: 24, lon: 127 },
})

// Mock timeline until the SSE stream exists. Done rows carry their result; upcoming rows show the scheduled time.
const checkin = missionById('checkin')
const TIMELINE = [
  { label: 'Checked in', time: '13:10', done: true, result: `${checkin.title}, +${checkin.miles} miles` },
  { label: 'Boarding', time: '14:45', done: false, result: 'Gate 23' },
  { label: 'Departs Hong Kong', time: '15:25', done: false, result: 'Terminal 1' },
  { label: 'Lands in Tokyo', time: '20:20', done: false, result: 'Narita Terminal 2' },
]

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
    </svg>
  )
}

// Parent view. Hero: the trip timeline, set like a departures board.
export function ParentScreen() {
  const trip = mockTrip
  const { flight } = trip
  const [junior, setJunior] = useState(true)

  return (
    <main className="mx-auto flex min-h-dvh max-w-[393px] flex-col gap-8 px-5 pt-8 pb-6">
      <header className="flex items-center gap-3">
        <span className="shrink-0 overflow-hidden rounded-pill bg-jade" aria-hidden="true">
          <RouteGlobeStatic from={flight.from} to={flight.to} progress={trip.progress} width={52} height={52} layout={thumbLayout} labels={false} />
        </span>
        <div className="flex flex-1 flex-col">
          <h1 className="font-display text-title">{trip.childName}'s trip</h1>
          <p className="font-mono text-flight text-ink-soft">
            {flight.carrier} {flight.number} {flight.from} → {flight.to}
          </p>
        </div>
        <JuniorModeToggle on={junior} onChange={setJunior} label="Junior mode" />
      </header>

      <p className="flex items-center gap-3 border-y border-line py-3 text-body" aria-live="polite">
        <span className="text-jade">
          <BellIcon />
        </span>
        <span className="flex-1">{trip.childName} is checked in for {flight.carrier} {flight.number}</span>
        <span className="font-mono text-flight text-ink-soft">{TIMELINE[0].time}</span>
      </p>

      <article className="guilloche flex flex-col rounded-doc shadow-doc" aria-label="Trip timeline">
        <div className="flex items-baseline justify-between gap-2 px-5 pt-5 pb-3">
          <h2 className="font-display text-heading">Trip timeline</h2>
          <span className="text-small text-ink-soft">
            {flight.duration} on an {flight.aircraft}
          </span>
        </div>
        <ol className="flex flex-col">
          {TIMELINE.map((step) => (
            <li key={step.label} className="flex items-start gap-4 border-t border-line px-5 py-3">
              <span className={`w-12 shrink-0 font-mono text-flight ${step.done ? 'text-ink' : 'text-ink-soft'}`}>{step.time}</span>
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-pill ${step.done ? 'bg-jade' : 'border-2 border-line'}`}
                aria-hidden="true"
              />
              <span className="flex flex-1 flex-col">
                <span className={`text-body ${step.done ? 'font-medium' : 'text-ink-soft'}`}>
                  {step.label}
                  {!step.done && <span className="sr-only"> (scheduled)</span>}
                </span>
                <span className="text-small text-ink-soft">{step.result}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="tabular border-t border-line px-5 py-4 text-body text-ink-soft">
          {formatNumber(trip.cap.used)} of {formatNumber(trip.cap.limit)} miles this year
        </p>
      </article>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-heading">Data used</h2>
        <ul className="grid grid-cols-2 gap-x-4">
          {DATA_USED.map((field) => (
            <li key={field} className="border-b border-line py-2 text-body">
              {field}
            </li>
          ))}
        </ul>
        <p className="text-small text-ink-soft">Never photos, location or health data.</p>
      </section>

      <HealthCard />

      <footer className="mt-auto">
        <ConceptLabel />
      </footer>
    </main>
  )
}
