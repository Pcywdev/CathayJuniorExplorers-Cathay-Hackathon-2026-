import { AnimatePresence, motion } from 'framer-motion'
import { useId, useState } from 'react'
import { BackLink } from '../../../components/BackLink'
import { ConceptLabel } from '../../../components/ConceptLabel'
import { PrimaryButton } from '../../../components/PrimaryButton'
import { navigate } from '../../../nav'
import { formatNumber, program } from '../../../program'
import { MAX_AGE, MIN_AGE } from '../../../xplorers/discover'
import { tierAges } from '../../../xplorers/tiers'

// Screen 4 (acquisition + activation). Mei joins Cathay Xplorers: one persona through the whole video (user decision,
// replacing plan.md's Leo). The form is editable but pre-filled; the tier follows the age typed in.
// Step 1: the form, with guardian approval (under 18) or university email (18+) already passed: never collected (plan.md).
// Step 2: the tier card, "Welcome to <tier>", then "Start exploring" opens Home with the name and age.

const mei = program.xplorers.personas.mei
// Mei's teen stop on the persona slider (plan.md: 7 → 15 → 20 → exit).
const DEFAULT_AGE = 15
// New members' welcome balance. Held under `personas.leo` in program.json until Earth gives it a generic name.
const WELCOME_MILES = program.xplorers.personas.leo.startingBalance

const SPEND_ON: Record<string, string> = {
  little: 'Trip missions and stamps',
  teen: 'Snacks, drinks, blind boxes',
  campus: 'Student fares and packages',
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
    </svg>
  )
}

// A read-only row: label over value, Line divider.
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-3">
      <span className="text-small text-ink-soft">{label}</span>
      {children}
    </div>
  )
}

// An editable row: the same shape, plus a pencil cue and a 2px Jade bar along the divider while focused
// (the bar is the focus indicator, so the input itself drops the outline). Only the field name is the <label>,
// so the note stays a description (aria-describedby) rather than part of the input's name.
function EditField({ label, htmlFor, invalid, note, children }: { label: string; htmlFor: string; invalid?: boolean; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="group relative flex flex-col gap-0.5 border-b border-line py-3">
      <label htmlFor={htmlFor} className="text-small text-ink-soft">
        {label}
      </label>
      <span className="flex items-center gap-2">
        {children}
        <span className="text-ink-soft group-focus-within:text-jade">
          <PencilIcon />
        </span>
      </span>
      {note}
      <span
        className={`absolute inset-x-0 -bottom-px h-0.5 origin-left scale-x-0 transition-transform duration-200 ease-out group-focus-within:scale-x-100 ${invalid ? 'bg-ink' : 'bg-jade'}`}
        aria-hidden="true"
      />
    </div>
  )
}

const INPUT = 'h-8 min-w-0 flex-1 bg-transparent text-body font-medium text-ink caret-jade outline-none'

export function SignUpScreen() {
  const id = useId()
  const [joined, setJoined] = useState(false)
  const [name, setName] = useState(mei.name)
  const [ageText, setAgeText] = useState(String(DEFAULT_AGE))

  const age = Number(ageText)
  const ageOk = Number.isInteger(age) && age >= MIN_AGE && age <= MAX_AGE
  const nameOk = name.trim().length > 0
  const shownName = name.trim() || mei.name
  const tier = program.xplorers.tiers.find((t) => ageOk && age >= t.minAge && age <= t.maxAge) ?? program.xplorers.tiers[1]
  const adult = tier.signUp === 'universityEmail'

  const howItWorks = [
    { title: 'Earn on family trips', note: `Up to ${formatNumber(program.annualEarnCap)} miles a year` },
    { title: 'Spend a few', note: `${SPEND_ON[tier.id]}, at Cathay and partners` },
    { title: 'Keep the rest', note: 'Everything comes with you when you graduate' },
  ]

  const startExploring = () => navigate('/child', { name: shownName, age: String(age) })

  return (
    <main className="guilloche-sky mx-auto flex min-h-dvh max-w-[393px] flex-col gap-6 overflow-x-clip px-5 pt-6">
      <BackLink onClick={() => (joined ? setJoined(false) : navigate('/xplorers'))}>{joined ? 'Back' : program.xplorers.modeName}</BackLink>

      <AnimatePresence mode="popLayout" initial={false}>
        {!joined ? (
          <motion.form
            key="form"
            className="flex flex-col gap-6"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            aria-label="Sign-up form"
            onSubmit={(e) => {
              e.preventDefault()
              if (nameOk && ageOk) setJoined(true)
            }}
          >
            <header className="flex flex-col gap-1">
              <h1 className="font-display text-title">Join {tier.name}</h1>
              <p className="text-body text-ink-soft">We filled this in from your family account. Change anything that's wrong.</p>
            </header>

            <div className="flex flex-col">
              <EditField label="Name" htmlFor={`${id}-name`} invalid={!nameOk}>
                <input
                  id={`${id}-name`}
                  className={INPUT}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  maxLength={24}
                  aria-invalid={!nameOk}
                />
              </EditField>
              <EditField
                label="Age"
                htmlFor={`${id}-age`}
                invalid={!ageOk}
                note={
                  <span id={`${id}-age-note`} className={`text-small ${ageOk ? 'text-ink-soft' : 'font-medium text-ink'}`}>
                    {ageOk ? `${tier.name}, ${tierAges(tier)}` : `Cathay Xplorers is for ages ${MIN_AGE} to ${MAX_AGE}`}
                  </span>
                }
              >
                <input
                  id={`${id}-age`}
                  className={`${INPUT} tabular`}
                  value={ageText}
                  onChange={(e) => setAgeText(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  inputMode="numeric"
                  aria-invalid={!ageOk}
                  aria-describedby={`${id}-age-note`}
                />
              </EditField>
              <Row label="Miles go to">
                <span className="text-body font-medium text-ink">{shownName}'s own account</span>
              </Row>
              <div className="flex items-center justify-between gap-3 border-b border-line py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-small text-ink-soft">{adult ? 'Student' : 'Guardian'}</span>
                  <span className="text-body font-medium text-ink">{adult ? 'University email verified' : 'Approved by your parent'}</span>
                </div>
                <span className="flex items-center gap-1 rounded-pill bg-jade px-3 py-1 text-small text-paper">
                  <CheckIcon />
                  {adult ? 'Verified' : 'Approved'}
                </span>
              </div>
            </div>
            <p className="flex items-center gap-2 text-body text-ink">
              <span className="tabular rounded-pill bg-miles/20 px-3 py-0.5 font-medium">{formatNumber(WELCOME_MILES)} miles</span>
              to welcome you when you join
            </p>
            {/* Lets Enter submit; the visible button is pinned below the form. */}
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
          </motion.form>
        ) : (
          <motion.section
            key="card"
            className="flex flex-col gap-6"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            aria-label="Your membership"
          >
            <h1 className="font-display text-title">You're in, {shownName}</h1>

            {/* The tier card: a document, set like a membership ticket with a tear line and a stub. */}
            <article className="guilloche flex flex-col rounded-doc shadow-doc" aria-label={`Welcome to ${tier.name}`}>
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex flex-col">
                    <span className="text-small text-ink-soft">Welcome to</span>
                    <span className="font-display text-title text-ink">{tier.name}</span>
                  </p>
                  <span className="shrink-0 rounded-pill border-2 border-jade px-3 py-0.5 text-small text-jade">Age {age}</span>
                </div>
                <p className="flex flex-col gap-1">
                  <span className="text-small text-ink-soft">Welcome miles</span>
                  <span className="tabular self-start rounded-pill bg-miles/20 px-4 py-1 font-display text-display text-ink">
                    {formatNumber(WELCOME_MILES)}
                  </span>
                </p>
              </div>
              <div className="relative border-t-2 border-dashed border-line" aria-hidden="true">
                <span className="absolute -top-[9px] -left-2 h-4 w-4 rounded-pill bg-sky" />
                <span className="absolute -top-[9px] -right-2 h-4 w-4 rounded-pill bg-sky" />
              </div>
              <dl className="grid grid-cols-2 gap-4 p-5">
                <div className="flex flex-col">
                  <dt className="text-small text-ink-soft">Member</dt>
                  <dd className="text-body font-medium">{shownName}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-small text-ink-soft">Spend miles on</dt>
                  <dd className="text-body font-medium">{SPEND_ON[tier.id]}</dd>
                </div>
              </dl>
            </article>

            <section className="flex flex-col" aria-label="How it works">
              <h2 className="pb-1 font-display text-heading">How it works</h2>
              {howItWorks.map((h) => (
                <div key={h.title} className="flex flex-col border-t border-line py-3">
                  <span className="text-body font-medium text-ink">{h.title}</span>
                  <span className="text-small text-ink-soft">{h.note}</span>
                </div>
              ))}
            </section>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="sticky bottom-0 mt-auto flex flex-col gap-3 bg-sky pt-3 pb-6">
        {joined ? (
          <PrimaryButton onClick={startExploring}>Start exploring</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => nameOk && ageOk && setJoined(true)} disabled={!nameOk || !ageOk}>
            Join {tier.name}
          </PrimaryButton>
        )}
        <ConceptLabel />
      </div>
    </main>
  )
}
