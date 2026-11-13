import { motion } from 'framer-motion'
import { useState } from 'react'
import type { EventType, TripEvent } from '../api/types'
import { ConceptLabel } from '../components/ConceptLabel'
import { HealthCard } from '../components/HealthCard'
import { JuniorModeToggle } from '../components/JuniorModeToggle'
import { RouteGlobeStatic } from '../components/RouteGlobeStatic'
import { addMinutes, DELAY_MINUTES, delayedArrives, delayedDeparts } from '../mocks/events'
import { mockFlight } from '../mocks/trip'
import { formatNumber } from '../program'
import type { GlobeLayout } from '../three/geo'
import { navigate } from '../nav'
import { useTrip } from '../trip/useTrip'

const DATA_USED = ['Age band', 'Destination', 'Flight length', 'Trip events']

// Thumbnail globe: whole disc centred in its box, looking straight at the route.
const thumbLayout = (w: number, h: number): GlobeLayout => ({
  r: w / 2 - 3,
  cx: w / 2,
  cy: h / 2,
  view: { lat: 24, lon: 127 },
})

const LABEL: Record<EventType, string> = {
  junior_mode_on: 'Junior mode on',
  checkin: 'Checked in',
  delayed: 'Delayed',
  boarded: 'Boarded',
  departed: 'Departed Hong Kong',
  landed: `Landed in ${mockFlight.toCity}`,
}

// Event time in its own airport's offset (the backend sends it that way).
const hhmm = (iso: string) => iso.slice(11, 16)

function result(e: TripEvent) {
  if (e.mission) {
    return `${e.mission.title}, +${formatNumber(e.mission.miles)} miles, ${formatNumber(e.cap.used)} of ${formatNumber(e.cap.limit)} this year`
  }
  if (e.type === 'junior_mode_on') return 'Chapter 1 of the story is ready'
  if (e.type === 'delayed') return `${e.parentMessage}, now departs ${delayedDeparts}`
  if (e.type === 'departed') return e.parentMessage.replace(/^Departed \d\d:\d\d, l/, 'L')
  return e.parentMessage
}

function AppIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-doc bg-jade text-paper" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16M12 4c2.5 2.2 3.5 5 3.5 8s-1 5.8-3.5 8c-2.5-2.2-3.5-5-3.5-8s1-5.8 3.5-8z" />
      </svg>
    </span>
  )
}

// Parent view. Hero: the trip timeline, set like a departures board, filling in as events arrive.
// The newest event also arrives as a phone notification (native styling, DESIGN.md overlay note).
export function ParentScreen() {
  const { trip, has, progress, latest } = useTrip()
  const flight = mockFlight
  const [junior, setJunior] = useState(true)
  const delayed = trip.branch === 'delayed'
  const shift = (t: string) => (delayed ? addMinutes(t, DELAY_MINUTES) : t)

  // Rows still to come show their scheduled (or delay-adjusted) time.
  const upcoming = [
    { type: 'checkin' as const, label: 'Check-in', time: '', note: 'Opens online before the flight' },
    { type: 'boarded' as const, label: 'Boarding', time: shift(flight.boards), note: `Gate ${flight.gate}` },
    { type: 'departed' as const, label: 'Departs Hong Kong', time: delayed ? delayedDeparts : flight.departs, note: flight.fromTerminal },
    { type: 'landed' as const, label: `Lands in ${flight.toCity}`, time: delayed ? delayedArrives : flight.arrives, note: flight.toTerminal },
  ].filter((u) => !has(u.type))

  return (
    <main className="mx-auto flex min-h-dvh max-w-[393px] flex-col gap-6 px-5 pt-6 pb-6">
      {/* Notification banner: system UI, not app content, so it uses the system font. */}
      <motion.div
        key={latest.type}
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex items-start gap-3 rounded-doc border border-line bg-paper p-3"
        style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
        role="status"
      >
        <AppIcon />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline justify-between gap-2 text-[13px] leading-[18px] text-ink-soft">
            <span>Little Explorers</span>
            <span>{latest.source === 'simulated' ? 'Simulated, now' : 'now'}</span>
          </div>
          <p className="text-[15px] leading-[20px] font-semibold text-ink">{latest.parentMessage}</p>
        </div>
      </motion.div>

      <header className="flex items-center gap-3">
        <span className="shrink-0 overflow-hidden rounded-pill bg-jade" aria-hidden="true">
          <RouteGlobeStatic from={flight.from} to={flight.to} progress={progress} width={52} height={52} layout={thumbLayout} labels={false} />
        </span>
        <div className="flex flex-1 flex-col">
          <h1 className="font-display text-title">{trip.childName}'s trip</h1>
          <p className="font-mono text-flight text-ink-soft">
            {flight.carrier} {flight.number} {flight.from} → {flight.to}
          </p>
        </div>
        <JuniorModeToggle on={junior} onChange={setJunior} label="Junior mode" />
      </header>

      <article className="guilloche flex flex-col rounded-doc shadow-doc" aria-label="Trip timeline">
        <div className="flex items-baseline justify-between gap-2 px-5 pt-5 pb-3">
          <h2 className="font-display text-heading">Trip timeline</h2>
          <span className="text-small text-ink-soft">
            {flight.duration} on an {flight.aircraft}
          </span>
        </div>
        <ol className="flex flex-col" aria-live="polite">
          {trip.events.map((e) => (
            <li key={e.type} className="flex items-start gap-4 border-t border-line px-5 py-3">
              <span className="w-12 shrink-0 font-mono text-flight text-ink">{hhmm(e.at)}</span>
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-pill bg-jade" aria-hidden="true" />
              <span className="flex flex-1 flex-col">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-body font-medium">{LABEL[e.type]}</span>
                  {e.source === 'simulated' && <span className="text-small text-ink-soft">Simulated</span>}
                </span>
                <span className="tabular text-small text-ink-soft">{result(e)}</span>
              </span>
            </li>
          ))}
          {upcoming.map((u) => (
            <li key={u.type} className="flex items-start gap-4 border-t border-line px-5 py-3">
              <span className="w-12 shrink-0 font-mono text-flight text-ink-soft">{u.time}</span>
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-pill border-2 border-line" aria-hidden="true" />
              <span className="flex flex-1 flex-col">
                <span className="text-body text-ink-soft">
                  {u.label}
                  <span className="sr-only"> (scheduled)</span>
                </span>
                <span className="text-small text-ink-soft">{u.note}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="tabular border-t border-line px-5 py-4 text-body text-ink-soft">
          {formatNumber(trip.cap.used)} of {formatNumber(trip.cap.limit)} miles this year
        </p>
      </article>

      <button
        type="button"
        onClick={() => navigate('/family')}
        className="-my-2 flex items-center gap-3 border-b border-line py-3 text-left text-ink active:text-jade"
      >
        <span className="flex flex-1 flex-col">
          <span className="font-display text-heading">Family miles</span>
          <span className="text-small text-ink-soft">Your balance, and how {trip.childName}'s miles grow to 18</span>
        </span>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

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
