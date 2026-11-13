import { useState } from 'react'
import type { TripMission } from '../api/types'
import { BoardingPass } from '../components/BoardingPass'
import { ConceptLabel } from '../components/ConceptLabel'
import { HarbourSilhouette } from '../components/HarbourSilhouette'
import { HealthCard } from '../components/HealthCard'
import { MilesProgress } from '../components/MilesProgress'
import { MissionList } from '../components/MissionList'
import { PassportPage } from '../components/PassportPage'
import { Pip } from '../components/Pip'
import { RouteGlobe } from '../components/RouteGlobe'
import { SpeechLine } from '../components/SpeechLine'
import { DELAY_MINUTES, delayedDeparts } from '../mocks/events'
import { mockFlight, mockPastStamps, mockSerial } from '../mocks/trip'
import { navigate } from '../nav'
import { useTrip } from '../trip/useTrip'

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13" />
    </svg>
  )
}

function CapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 9.5L12 5l9.5 4.5L12 14zM6.5 11.5v4.5c3 2.5 8 2.5 11 0v-4.5M21.5 9.5v5" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

const OPENS_WHEN: Record<string, string> = {
  checkin: 'Opens at check-in',
  boarding: 'Opens after check-in',
  window: 'Opens after take-off',
  arrival: 'Opens when you land',
}

function RowLink({ icon, title, note, onClick }: { icon: React.ReactNode; title: string; note: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 border-b border-line py-3 text-left text-ink active:text-jade">
      <span className="text-jade">{icon}</span>
      <span className="flex flex-1 flex-col">
        <span className="font-display text-heading">{title}</span>
        <span className="text-small text-ink-soft">{note}</span>
      </span>
      <ChevronIcon />
    </button>
  )
}

// Home. Hero: the boarding pass, held over a Jade sky band with the turnable route globe.
// Every trip moment changes it: Pip's line and pose, the ticket's status, which mission the ticket carries.
export function ChildScreen() {
  const { trip, step, has, progress, latest } = useTrip()
  // Pip only speaks up for the delay (plan.md: "We have extra time!"); tap the line to put it away.
  const [hush, setHush] = useState(false)
  const flight = mockFlight
  const landed = has('landed')
  const delayed = trip.branch === 'delayed'
  const boarded = has('boarded')

  const byId = (id: string) => trip.missions.find((m) => m.id === id)!
  const hero: TripMission = landed
    ? byId('arrival')
    : (trip.missions.find((m) => m.state === 'available') ?? trip.missions.find((m) => m.state === 'locked') ?? byId('arrival'))
  // Arrival pays out on landing, so its ticket stays sealed until then.
  const ready = hero.state !== 'locked' && (hero.id !== 'arrival' || landed)

  const status = landed
    ? `Landed in ${flight.toCity}`
    : has('departed')
      ? 'In the air'
      : boarded
        ? 'On board'
        : delayed
          ? `Delayed ${DELAY_MINUTES} min`
          : undefined

  const lastChapter = Math.max(...trip.chapters.filter((c) => !c.locked).map((c) => c.number))
  const chapterNote = has('departed') && !landed ? `Chapter ${lastChapter} is ready, even offline` : `Chapter ${lastChapter} is ready`

  return (
    <main className="guilloche-sky mx-auto flex min-h-dvh max-w-[393px] flex-col">
      <section className="guilloche-on-jade relative z-10 h-[300px] overflow-hidden" aria-label={`Route ${flight.from} to ${flight.to}`}>
        <RouteGlobe from={flight.from} to={flight.to} progress={progress} />
        <header className="pointer-events-none relative flex flex-col gap-2.5 px-5 pt-8">
          <div className="flex items-center gap-3">
            <span className="rounded-pill bg-paper p-1">
              <Pip pose={step === 'delayed' ? 'extraTime' : 'wave'} size={44} />
            </span>
            <div className="flex flex-1 flex-col">
              <h1 className="font-display text-title text-paper">{trip.childName}'s trip</h1>
              <p className="font-mono text-flight text-paper/80">
                {flight.carrier} {flight.number}
              </p>
            </div>
          </div>
          {step === 'delayed' && !hush && (
            <button type="button" onClick={() => setHush(true)} className="pointer-events-auto self-start" aria-label="Dismiss Pip's message">
              <SpeechLine>{latest.childMessage}</SpeechLine>
            </button>
          )}
        </header>
      </section>

      <div className="relative z-10 -mt-[96px] px-5">
        <BoardingPass
          key={hero.id}
          missionTitle={hero.title}
          miles={hero.miles}
          passenger={trip.childName}
          flight={`${flight.carrier} ${flight.number}`}
          from={flight.from}
          to={flight.to}
          fromCity={flight.fromCity}
          toCity={flight.toCity}
          departs={delayed ? delayedDeparts : flight.departs}
          departsWas={delayed ? flight.departs : undefined}
          gate={flight.gate}
          seat={flight.seat}
          serial={mockSerial}
          status={status}
          action={
            ready
              ? { kind: 'hold', label: landed ? 'Collect my stamp' : 'Start mission', onDone: () => navigate('/complete', { m: hero.id }) }
              : { kind: 'waiting', text: OPENS_WHEN[hero.id] }
          }
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-8 px-5 pt-8">
        <MilesProgress used={trip.cap.used} limit={trip.cap.limit} pending={hero.state === 'available' ? hero.miles : 0} />

        <section className="flex flex-col">
          <RowLink icon={<BookIcon />} title="Read my trip story" note={chapterNote} onClick={() => navigate('/story')} />
          {landed && (
            <RowLink icon={<CapIcon />} title="See me at 18" note="What your trips add up to" onClick={() => navigate('/graduation')} />
          )}
        </section>

        <MissionList missions={trip.missions} doneOrder={trip.doneOrder} bonus={delayed && !boarded ? 'Count the planes at the gate' : undefined} />

        <PassportPage
          past={mockPastStamps}
          current={landed ? { city: flight.toCity, date: flight.date, shape: 'circle', rotate: 7, opacity: 0.92 } : undefined}
          nextCity={flight.toCity}
        />

        <HealthCard />
      </div>

      {/* Harbour skyline pinned to the bottom of the viewport while you scroll; content passes over it.
          Sticky, not fixed: the screen-slide wrapper has a transform, which would break position: fixed. */}
      <div className="pointer-events-none sticky bottom-0 z-0 -mt-[60px]" aria-hidden="true">
        <HarbourSilhouette />
      </div>
      <footer className="relative z-10 bg-sky px-5 pt-3 pb-6">
        <ConceptLabel />
      </footer>
    </main>
  )
}
