import { animate, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ConceptLabel } from '../components/ConceptLabel'
import { Pip } from '../components/Pip'
import { PrimaryButton } from '../components/PrimaryButton'
import { graduationInputs, mockGraduation } from '../mocks/graduation'
import { navigate } from '../nav'
import { formatNumber, program } from '../program'

function Bar({ value, max, fill }: { value: number; max: number; fill: number }) {
  return (
    <div className="h-2 w-full rounded-pill bg-line" aria-hidden="true">
      <div className="h-full rounded-pill bg-jade" style={{ width: `${(value / max) * fill * 100}%` }} />
    </div>
  )
}

// Graduation (Mei at 18). Hero: the last page of her junior passport, with the score and the package.
// The one moment: the score counts up and the bars fill, landing exactly on the final values.
export function GraduationScreen() {
  const reduce = useReducedMotion() ?? false
  const g = mockGraduation
  const name = program.demoMember.name
  const [t, setT] = useState(reduce ? 1 : 0)

  useEffect(() => {
    if (reduce) return
    const run = animate(0, 1, { duration: 1.1, delay: 0.2, ease: [0.2, 0.7, 0.3, 1], onUpdate: setT, onComplete: () => setT(1) })
    return () => run.stop()
  }, [reduce])

  const shown = t === 1 ? g.score : Math.round(g.score * t)
  const p = g.package
  const top = g.band.index === g.bandCount

  return (
    <main className="mx-auto flex min-h-dvh max-w-[393px] flex-col gap-5 px-5 pt-6">
      <header className="flex items-end gap-3">
        <Pip pose="proud" size={60} />
        <div className="flex flex-1 flex-col pb-1">
          <h1 className="font-display text-title">{name} at 18</h1>
          <p className="text-body text-ink-soft">Grown up, with everything you earned</p>
        </div>
      </header>

      <article className="guilloche flex flex-col rounded-doc shadow-doc" aria-label="Graduation page">
        <section className="flex flex-col gap-3 p-5">
          <div className="flex items-end justify-between gap-3">
            <p className="flex items-baseline gap-2">
              <span className="tabular font-display text-display text-ink" aria-hidden="true">
                {shown}
              </span>
              <span className="text-body text-ink-soft">of {g.maxScore} points</span>
              <span className="sr-only">
                {g.score} of {g.maxScore} points
              </span>
            </p>
            <span className="mb-1.5 rounded-pill border-2 border-jade px-3 py-0.5 text-small text-jade">
              {top ? 'Top band' : `Band ${g.band.index} of ${g.bandCount}`}
            </span>
          </div>

          <ul className="flex flex-col">
            {g.breakdown.map((b) => (
              <li key={b.id} className="flex flex-col gap-1.5 border-t border-line py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-body">{b.label}</span>
                  <span className="tabular text-body font-medium">
                    {b.points} <span className="font-normal text-ink-soft">of {b.max}</span>
                  </span>
                </div>
                <Bar value={b.points} max={b.max} fill={t} />
              </li>
            ))}
          </ul>
          <p className="text-small text-ink-soft">
            From {graduationInputs.membershipYears} membership years, {graduationInputs.familyFlights} family flights and{' '}
            {formatNumber(graduationInputs.juniorMiles)} junior miles
          </p>
        </section>

        {/* tear line between the score and the package, like the boarding pass */}
        <div className="border-t-2 border-dashed border-line" aria-hidden="true" />

        <section className="flex flex-col gap-3 p-5" aria-label="Your package">
          <h2 className="font-display text-heading">Your package</h2>

          <div className="flex items-center justify-between gap-3">
            <span className="text-body">Miles you keep</span>
            <span className="tabular rounded-pill bg-miles/20 px-3 py-0.5 font-display text-heading text-ink">
              {formatNumber(p.milesCarriedOver)} miles
            </span>
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-body">Status Points head start</span>
              <span className="tabular text-body font-medium">{p.statusPointsHeadStart}</span>
            </div>
            <Bar value={p.statusPointsHeadStart} max={p.silverThreshold} fill={t} />
            <span className="tabular text-small text-ink-soft">Silver starts at {p.silverThreshold}</span>
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <span className="text-body">Miles you can share with family</span>
            <ol className="grid grid-cols-3">
              {p.transferAllowance.map((amount, i) => (
                <li key={i} className={`flex flex-col ${i > 0 ? 'border-l border-line pl-3' : ''}`}>
                  <span className="text-small text-ink-soft">Year {i + 1}</span>
                  <span className="tabular text-body font-medium">{formatNumber(amount)}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </article>

      <div className="sticky bottom-0 mt-auto flex flex-col gap-3 bg-sky pt-3 pb-6">
        <PrimaryButton onClick={() => navigate('/child')}>Back to my trip</PrimaryButton>
        <ConceptLabel />
      </div>
    </main>
  )
}
