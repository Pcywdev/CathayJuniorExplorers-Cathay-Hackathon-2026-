import { ConceptLabel } from '../components/ConceptLabel'
import { HealthCard } from '../components/HealthCard'
import { JuniorModeToggle } from '../components/JuniorModeToggle'
import { formatNumber, program } from '../program'

const UPCOMING = ['Checked in', 'Boarded', 'Departed', 'Landed']
const DATA_USED = ['Age band', 'Destination', 'Flight length', 'Trip events']

// Placeholder parent view. Hero: the trip timeline document.
export function ParentScreen() {
  const name = program.demoMember.name

  return (
    <main className="mx-auto flex min-h-dvh max-w-[393px] flex-col gap-6 px-5 pt-8 pb-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-title">{name}'s trip</h1>
          <p className="font-mono text-flight text-ink-soft">CX 500 HKG → TYO</p>
        </div>
        <label className="flex items-center gap-2 text-small text-ink-soft">
          Junior mode
          <JuniorModeToggle on />
        </label>
      </header>

      <article className="flex flex-col gap-3 rounded-doc bg-paper p-5 shadow-doc" aria-label="Trip timeline">
        <h2 className="font-display text-heading">Trip timeline</h2>
        <p className="text-body text-ink-soft">Updates appear here as {name}'s trip happens.</p>
        <ol className="flex flex-col">
          {UPCOMING.map((step) => (
            <li key={step} className="border-b border-line py-2 text-body text-ink-soft last:border-b-0">
              {step}
            </li>
          ))}
        </ol>
      </article>

      <p className="tabular text-body text-ink-soft">
        {formatNumber(program.demoMember.startingBalance)} of {formatNumber(program.annualEarnCap)} miles this year
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-heading">Data used</h2>
        <ul className="flex flex-col">
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
