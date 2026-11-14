import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BackLink } from '../../../components/BackLink'
import { ConceptLabel } from '../../../components/ConceptLabel'
import { Pip } from '../../../components/Pip'
import { PrimaryButton } from '../../../components/PrimaryButton'
import { MemoryPassport } from '../../../components/MemoryPassport'
import { graduationInputs, mockGraduation } from '../../../mocks/graduation'
import { mockAllStamps } from '../../../mocks/trip'
import { navigate } from '../../../nav'
import { useMemberAge } from '../../../xplorers/memberAge'
import { formatNumber, program } from '../../../program'

// Screen 10 (retention). Mei leaves Cathay Xplorers at exit (university graduation or 25, plan.md v2)
// and becomes a full member, carrying everything over. This replaces the old "Mei at 18" graduation screen.
// The one orchestrated moment (DESIGN.md Exit): the score counts up and the bars fill, landing exactly.
// The interaction: "Continue as a Cathay member" turns the page into her new member card.
//
// Preview (`/ahead`, from Home's "See where this leads"): the member hasn't graduated and is still a member, so the
// same page reads as a projection: future tense, no celebration header, no member card, the passport so far,
// and "Back to Home".

function Bar({ value, max, fill }: { value: number; max: number; fill: number }) {
  return (
    <div className="h-2 w-full rounded-pill bg-line" aria-hidden="true">
      <div className="h-full rounded-pill bg-jade" style={{ width: `${(value / max) * fill * 100}%` }} />
    </div>
  )
}

function MemberCard() {
  const g = mockGraduation
  const mei = program.xplorers.personas.mei
  const memberSince = mockAllStamps[mockAllStamps.length - 1].date.slice(0, 4)

  return (
    <motion.section
      key="member"
      className="flex flex-1 flex-col gap-6"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      aria-label="Your member card"
    >
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-title">Welcome, {mei.name}</h1>
        <p className="text-body text-ink-soft">You're a Cathay member now. Everything came with you.</p>
      </header>

      <article className="guilloche flex flex-col rounded-doc shadow-doc" aria-label="Member card">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="flex flex-col">
              <span className="text-small text-ink-soft">Member</span>
              <span className="font-display text-title">{mei.name}</span>
            </p>
            <span className="rounded-pill border-2 border-jade px-3 py-0.5 text-small text-jade">Since {memberSince}</span>
          </div>
          <p className="flex flex-col gap-1">
            <span className="text-small text-ink-soft">Miles</span>
            <span className="tabular self-start rounded-pill bg-miles/20 px-4 py-1 font-display text-display text-ink">
              {formatNumber(g.package.milesCarriedOver)}
            </span>
          </p>
        </div>
        <div className="relative border-t-2 border-dashed border-line" aria-hidden="true">
          <span className="absolute -top-[9px] -left-2 h-4 w-4 rounded-pill bg-sky" />
          <span className="absolute -top-[9px] -right-2 h-4 w-4 rounded-pill bg-sky" />
        </div>
        <dl className="grid grid-cols-2 gap-4 p-5">
          <div className="flex flex-col">
            <dt className="text-small text-ink-soft">Status Points</dt>
            <dd className="tabular text-body font-medium">
              {g.package.statusPointsHeadStart} <span className="font-normal text-ink-soft">of {g.package.silverThreshold} for Silver</span>
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-small text-ink-soft">Member years</dt>
            <dd className="tabular text-body font-medium">{graduationInputs.membershipYears}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-small text-ink-soft">Trips</dt>
            <dd className="tabular text-body font-medium">{graduationInputs.familyFlights}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-small text-ink-soft">Stamps</dt>
            <dd className="tabular text-body font-medium">{mockAllStamps.length}</dd>
          </div>
        </dl>
      </article>

      <section className="flex flex-col" aria-label="What changes now">
        <h2 className="pb-1 font-display text-heading">What changes now</h2>
        <div className="flex flex-col gap-2 border-t border-line py-3">
          <span className="text-body font-medium">Share miles with family</span>
          <ol className="grid grid-cols-3">
            {g.package.transferAllowance.map((amount, i) => (
              <li key={i} className={`flex flex-col ${i > 0 ? 'border-l border-line pl-3' : ''}`}>
                <span className="text-small text-ink-soft">Year {i + 1}</span>
                <span className="tabular text-body font-medium">{formatNumber(amount)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col border-t border-line py-3">
          <span className="text-body font-medium">Silver is close</span>
          <span className="tabular text-small text-ink-soft">
            {formatNumber(g.package.silverThreshold - g.package.statusPointsHeadStart)} more Status Points to go
          </span>
        </div>
      </section>
    </motion.section>
  )
}

export function ExitPreviewScreen() {
  return <ExitScreen preview />
}

export function ExitScreen({ preview = false }: { preview?: boolean } = {}) {
  const age = useMemberAge()
  const reduce = useReducedMotion() ?? false
  const g = mockGraduation
  const mei = program.xplorers.personas.mei
  const [t, setT] = useState(reduce ? 1 : 0)
  const [member, setMember] = useState(false)

  useEffect(() => {
    if (reduce) return
    const run = animate(0, 1, { duration: 1.1, delay: 0.2, ease: [0.2, 0.7, 0.3, 1], onUpdate: setT, onComplete: () => setT(1) })
    return () => run.stop()
  }, [reduce])

  const continueAsMember = () => {
    setMember(true)
    window.scrollTo(0, 0)
  }

  const shown = t === 1 ? g.score : Math.round(g.score * t)
  const p = g.package
  const top = g.band.index === g.bandCount

  const carried = [
    { label: 'Miles', value: formatNumber(graduationInputs.juniorMiles) },
    { label: 'Member years', value: String(graduationInputs.membershipYears) },
    { label: 'Trips', value: String(graduationInputs.familyFlights) },
    { label: 'Stamps', value: String(mockAllStamps.length) },
  ]

  return (
    <main className="mx-auto flex min-h-dvh max-w-[393px] flex-col gap-6 overflow-x-clip px-5 pt-6">
      <AnimatePresence mode="popLayout" initial={false}>
        {member ? (
          <MemberCard />
        ) : (
          <motion.div
            key="exit"
            className="flex flex-col gap-6"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {preview ? (
              <header className="flex flex-col gap-2">
                <BackLink onClick={() => navigate('/child')}>Home</BackLink>
                <h1 className="font-display text-title">Where this leads</h1>
                <p className="text-body text-ink-soft">
                  You're {age} now. Keep exploring, and this is what comes with you when you graduate, at {program.xplorers.exit.maxAge} at the latest.
                </p>
              </header>
            ) : (
              /* Centre alignment is allowed here: exit is the one celebration outside Little Xplorers. */
              <header className="flex flex-col items-center gap-2 text-center">
              <Pip pose="proud" size={60} />
              <h1 className="font-display text-title">You've graduated</h1>
              <p className="text-body text-ink-soft">
                {mei.name} at {mei.exitAge}, leaving {program.xplorers.modeName} with everything you earned
              </p>
            </header>
            )}

            {/* What carries over into full membership (plan.md v2: miles, years, trips, stamps) */}
            {preview && <h2 className="-mb-4 font-display text-heading">At graduation, if you keep going</h2>}
            <dl className="grid grid-cols-4 border-y border-line py-3" aria-label={preview ? 'What would come with you' : 'What comes with you'}>
              {carried.map((c, i) => (
                <div key={c.label} className={`flex flex-col-reverse items-center text-center ${i > 0 ? 'border-l border-line' : ''}`}>
                  <dt className="text-small text-ink-soft">{c.label}</dt>
                  <dd className="tabular font-display text-heading text-ink">{c.value}</dd>
                </div>
              ))}
            </dl>

            {/* Hero: the graduation page, score then package, split by a tear line */}
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
              </section>

              <div className="border-t-2 border-dashed border-line" aria-hidden="true" />

              <section className="flex flex-col gap-3 p-5" aria-label="Your package">
                <h2 className="font-display text-heading">{preview ? 'Your package at graduation' : 'Your package'}</h2>

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
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-body">Miles you can share with family</span>
                    <span className="text-small text-ink-soft">{preview ? 'Starts at graduation' : 'Starts now'}</span>
                  </div>
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

            {preview ? (
              <MemoryPassport age={age} title="My passport so far" />
            ) : (
              <MemoryPassport age={mei.exitAge} title={`Every stamp, ${mockAllStamps.length} of them`} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky bottom-0 mt-auto flex flex-col gap-3 bg-sky pt-3 pb-6">
        {preview ? (
          <PrimaryButton onClick={() => navigate('/child')}>Back to Home</PrimaryButton>
        ) : member ? (
          <PrimaryButton onClick={() => navigate('/home')}>Back to start</PrimaryButton>
        ) : (
          <PrimaryButton onClick={continueAsMember}>Continue as a Cathay member</PrimaryButton>
        )}
        <ConceptLabel />
      </div>
    </main>
  )
}
