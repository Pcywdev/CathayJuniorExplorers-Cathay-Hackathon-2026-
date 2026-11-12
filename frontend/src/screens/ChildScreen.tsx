import { BoardingPass } from '../components/BoardingPass'
import { ConceptLabel } from '../components/ConceptLabel'
import { HarbourSilhouette } from '../components/HarbourSilhouette'
import { HealthCard } from '../components/HealthCard'
import { MilesProgress } from '../components/MilesProgress'
import { MissionList } from '../components/MissionList'
import { PassportPage } from '../components/PassportPage'
import { Pip } from '../components/Pip'
import { RouteGlobe } from '../components/RouteGlobe'
import { mockPastStamps, mockTrip } from '../mocks/trip'
import { navigate } from '../nav'

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13" />
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

// Home. Hero: the boarding pass, held over a Jade sky band with the turnable route globe.
export function ChildScreen() {
  const trip = mockTrip
  const { flight } = trip
  const next = trip.missions.find((m) => m.state === 'available') ?? trip.missions[0]
  const others = trip.missions.filter((m) => m.id !== next.id)

  return (
    <main className="guilloche-sky mx-auto flex min-h-dvh max-w-[393px] flex-col">
      <section className="guilloche-on-jade relative z-10 h-[300px] overflow-hidden" aria-label={`Route ${flight.from} to ${flight.to}`}>
        <RouteGlobe from={flight.from} to={flight.to} progress={trip.progress} />
        <header className="pointer-events-none relative flex items-center gap-3 px-5 pt-8">
          <span className="rounded-pill bg-paper p-1">
            <Pip pose="wave" size={44} />
          </span>
          <div className="flex flex-1 flex-col">
            <h1 className="font-display text-title text-paper">{trip.childName}'s trip</h1>
            <p className="font-mono text-flight text-paper/80">
              {flight.carrier} {flight.number}
            </p>
          </div>
        </header>
      </section>

      <div className="relative z-10 -mt-[96px] px-5">
        <BoardingPass
          missionTitle={next.title}
          miles={next.miles}
          passenger={trip.childName}
          flight={`${flight.carrier} ${flight.number}`}
          from={flight.from}
          to={flight.to}
          fromCity={flight.fromCity}
          toCity={flight.toCity}
          departs={flight.departs}
          gate={flight.gate}
          seat={flight.seat}
          serial={trip.serial}
          onStart={() => navigate('/complete')}
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-8 px-5 pt-8">
        <MilesProgress used={trip.cap.used} limit={trip.cap.limit} pending={next.miles} />

        <section className="flex flex-col">
          <button
            type="button"
            onClick={() => navigate('/story')}
            className="flex items-center gap-3 border-b border-line pb-3 text-left text-ink active:text-jade"
          >
            <span className="text-jade">
              <BookIcon />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="font-display text-heading">Read my trip story</span>
              <span className="text-small text-ink-soft">Chapter {trip.chaptersUnlocked} is ready</span>
            </span>
            <ChevronIcon />
          </button>
          <MissionList missions={others} />
        </section>

        <PassportPage stamps={mockPastStamps} nextCity={flight.toCity} />

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
