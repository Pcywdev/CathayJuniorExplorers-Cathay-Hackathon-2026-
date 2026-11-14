import { BackLink } from '../../../components/BackLink'
import { ConceptLabel } from '../../../components/ConceptLabel'
import { PrimaryButton } from '../../../components/PrimaryButton'
import { navigate } from '../../../nav'
import { program } from '../../../program'
import { exitLine, xplorerTiers } from '../../../xplorers/tiers'

// Screen 2 (awareness → acquisition). The three tiers and the exit, set as one timeline you grow along.
// Hero: the tier timeline. Light screen: static, one tap forward ("Join" opens sign-up).

function CapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 9.5L12 5l9.5 4.5L12 14zM6.5 11.5v4.5c3 2.5 8 2.5 11 0v-4.5" />
    </svg>
  )
}

export function IntroScreen() {
  const x = program.xplorers

  return (
    <main className="guilloche-sky mx-auto flex min-h-dvh max-w-[393px] flex-col gap-6 px-5 pt-6">
      <BackLink onClick={() => navigate('/home')}>Home</BackLink>

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display">{x.modeName}</h1>
        <p className="text-body text-ink-soft">
          One membership that grows up with you. Explore what Cathay offers, and keep every mile in your own account.
        </p>
      </header>

      {/* Tiers as a vertical timeline: a Line rail, a Jade dot per tier, the exit at the end. */}
      <ol className="flex flex-col" aria-label="Tiers">
        {xplorerTiers.map((t) => (
          <li key={t.id} className="relative flex gap-4 pb-6">
            <span className="absolute top-5 bottom-0 left-[7px] w-0.5 bg-line" aria-hidden="true" />
            <span className="relative mt-1 h-4 w-4 shrink-0 rounded-pill border-2 border-sky bg-jade" aria-hidden="true" />
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-heading">{t.name}</h2>
                <span className="tabular shrink-0 text-small text-ink-soft">{t.ages}</span>
              </div>
              <p className="text-body text-ink">{t.line}</p>
              {t.signUp === 'guardianApproval' && <p className="text-small text-ink-soft">Joins with a guardian's approval</p>}
              {t.signUp === 'universityEmail' && <p className="text-small text-ink-soft">Verified with your university email</p>}
            </div>
          </li>
        ))}
        <li className="flex gap-4">
          <span className="relative flex h-6 w-4 shrink-0 items-center justify-center text-jade" aria-hidden="true">
            <CapIcon />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <h2 className="font-display text-heading">Graduate</h2>
            <p className="text-body text-ink">{exitLine}</p>
          </div>
        </li>
      </ol>

      <div className="sticky bottom-0 mt-auto flex flex-col gap-3 bg-sky pt-3 pb-6">
        <PrimaryButton onClick={() => navigate('/signup')}>Join</PrimaryButton>
        <ConceptLabel />
      </div>
    </main>
  )
}
