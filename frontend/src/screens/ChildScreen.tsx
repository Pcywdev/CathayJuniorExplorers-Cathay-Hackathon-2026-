import { BoardingPass } from '../components/BoardingPass'
import { ConceptLabel } from '../components/ConceptLabel'
import { HealthCard } from '../components/HealthCard'
import { MilesProgress } from '../components/MilesProgress'
import { PrimaryButton } from '../components/PrimaryButton'
import { missionById, program } from '../program'

// Placeholder home. Flight fields are synthetic until /api/flights/lookup exists.
export function ChildScreen() {
  const boarding = missionById('boarding')
  const name = program.demoMember.name

  return (
    <main className="mx-auto flex min-h-dvh max-w-[393px] flex-col gap-8 px-5 pt-12 pb-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-title">{name}'s trip</h1>
        <p className="font-mono text-flight text-ink-soft">HKG → TYO</p>
      </header>

      <BoardingPass missionTitle={boarding.title} miles={boarding.miles} from="HKG" to="TYO" gate="23" seat="34K" />

      <MilesProgress used={program.demoMember.startingBalance} limit={program.annualEarnCap} />

      <ul className="flex flex-col">
        {program.missions
          .filter((m) => m.id !== boarding.id)
          .map((m) => (
            <li key={m.id} className="flex justify-between border-b border-line py-3 text-body">
              <span>{m.title}</span>
              <span className="tabular font-medium">+{m.miles}</span>
            </li>
          ))}
      </ul>

      <HealthCard />

      <footer className="mt-auto flex flex-col gap-4">
        <PrimaryButton>Read my trip story</PrimaryButton>
        <ConceptLabel />
      </footer>
    </main>
  )
}
