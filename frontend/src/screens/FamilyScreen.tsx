import { useState } from 'react'
import { ConceptLabel } from '../components/ConceptLabel'
import { ValueOverTime } from '../components/ValueOverTime'
import { findings, GRADUATION_AGE, mockChildAge, moneyAssumptions as money } from '../mocks/family'
import { navigate } from '../nav'
import { formatNumber, program } from '../program'
import { useTrip } from '../trip/useTrip'

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

const ICON = {
  tag: 'M3.5 12.5v-8h8l9 9-8 8zM8 8.5h.01',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
  wallet: 'M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5v10A2.5 2.5 0 0 0 6.5 20H20v-12H6.5A2.5 2.5 0 0 1 4 7.5zM16 14h.01',
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-jade">
      <path d={d} />
    </svg>
  )
}

// Parent: family miles, in money. Hero: what the family can use by each age if the child's miles move to the
// parent every year (a little now, then it stops) vs kept in the child's name (counted from graduation, then member
// discounts keep adding). HK$ per mile is cited; the discount and spend are illustrative (mocks/family.ts).
export function FamilyScreen() {
  const { trip } = useTrip()
  const name = trip.childName
  const g = program.graduation

  // The child's own miles at graduation (exit): this year's balance, then the annual cap every year until then.
  const childAtExit = trip.cap.used + (GRADUATION_AGE - 1 - mockChildAge) * program.annualEarnCap
  const [why, setWhy] = useState<number | null>(null)

  // Miles the child has by each age (annual cap from program.json), and what they're worth.
  const milesAt = (age: number) => trip.cap.used + (Math.min(age, GRADUATION_AGE - 1) - mockChildAge) * program.annualEarnCap
  const discountPerYear = money.familyFaresPerYear * money.memberDiscount
  const points = Array.from({ length: money.projectToAge - mockChildAge + 1 }, (_, i) => {
    const age = mockChildAge + i
    return {
      age,
      move: milesAt(age) * money.hkdPerMile,
      keep: age < GRADUATION_AGE ? 0 : childAtExit * money.hkdPerMile + (age - GRADUATION_AGE + 1) * discountPerYear,
    }
  })

  const atEighteen = [
    { icon: ICON.wallet, text: `${formatNumber(childAtExit)} miles stay with ${name}` },
    { icon: ICON.star, text: `${g.topBandStatusPointsHeadStart} Status Points head start` },
    { icon: ICON.tag, text: `${Math.round(money.memberDiscount * 100)}% off family fares every year (illustrative)` },
  ]

  return (
    <main className="mx-auto flex min-h-dvh max-w-[393px] flex-col gap-6 px-5 pt-6 pb-6">
      <button type="button" onClick={() => navigate('/parent')} className="-ml-1 flex h-11 items-center gap-1 self-start text-body font-medium text-jade">
        <BackIcon />
        Back to the trip
      </button>

      <h1 className="font-display text-title">Family miles</h1>

      <article className="guilloche flex flex-col gap-4 rounded-doc p-5 shadow-doc" aria-label={`Family miles at ${GRADUATION_AGE}`}>
        <h2 className="font-display text-heading">Keep {name}'s miles, save more later</h2>
        <ValueOverTime points={points} splitAge={GRADUATION_AGE} keepLabel={`Kept with ${name}`} moveLabel="Moved to you" />
        <p className="text-small text-ink-soft">
          Illustrative: HK${money.hkdPerMile.toFixed(2)} a mile (
          <a href={money.hkdPerMileSource.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Money Hero
          </a>
          ), {Math.round(money.memberDiscount * 100)}% off HK${formatNumber(money.familyFaresPerYear)} of family fares a year from {GRADUATION_AGE}.
        </p>
      </article>

      <section className="flex flex-col" aria-label={`At ${GRADUATION_AGE}`}>
        <h2 className="pb-2 font-display text-heading">At {GRADUATION_AGE}</h2>
        <ul className="flex flex-col">
          {atEighteen.map((row) => (
            <li key={row.text} className="tabular flex items-center gap-3 border-t border-line py-3 text-body">
              <Icon d={row.icon} />
              {row.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-label="Why start young">
        <h2 className="font-display text-heading">Why start young</h2>
        <div className="grid grid-cols-3 gap-2">
          {findings.map((f, i) => (
            <button
              key={f.stat}
              type="button"
              onClick={() => setWhy(why === i ? null : i)}
              aria-expanded={why === i}
              className={`flex flex-col items-start gap-1 rounded-doc border-2 p-3 text-left active:scale-[0.97] ${why === i ? 'border-ink' : 'border-line'}`}
            >
              <span className="font-display text-heading text-ink">{f.stat}</span>
              <span className="text-small text-ink-soft">{f.short}</span>
            </button>
          ))}
        </div>
        {why !== null && (
          <p className="text-small text-ink-soft" aria-live="polite">
            {findings[why].text}{' '}
            <a href={findings[why].url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {findings[why].source}
            </a>
          </p>
        )}
      </section>

      <footer className="mt-auto">
        <ConceptLabel />
      </footer>
    </main>
  )
}
