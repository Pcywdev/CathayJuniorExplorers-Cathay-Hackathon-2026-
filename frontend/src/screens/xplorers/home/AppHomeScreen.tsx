import { motion } from 'framer-motion'
import { ConceptLabel } from '../../../components/ConceptLabel'
import { navigate } from '../../../nav'
import { program } from '../../../program'
import { xplorerTiers } from '../../../xplorers/tiers'

// Screen 1 (awareness). A plain travel-app home, no logos. Hero: the Cathay Xplorers entry card.
// Light screen: static, one tap forward (the card opens the intro).

const ROWS = [
  { title: 'Book a flight', note: 'Search fares from Hong Kong', d: 'M3 14l7-2 4-8 2 1-2 7 6-1 1 2-7 3-3 6-2-1 1-5-6 2z' },
  { title: 'My trips', note: 'No trips booked yet', d: 'M4 7.5h16v12H4zM9 7.5V5h6v2.5M4 12h16' },
  { title: 'Miles', note: 'Earn and spend', d: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z' },
]

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-jade">
      <path d={d} />
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

export function AppHomeScreen() {
  const name = program.xplorers.personas.mei.name

  return (
    <main className="guilloche-sky mx-auto flex min-h-dvh max-w-[393px] flex-col gap-8 px-5 pt-8 pb-6">
      <header className="flex flex-col gap-1">
        <p className="text-body text-ink-soft">Good evening</p>
        <h1 className="font-display text-title">Hi {name}</h1>
      </header>

      {/* Hero: the entry card. A document, so it gets Paper, the 16px radius and the one shadow. */}
      <motion.button
        type="button"
        onClick={() => navigate('/xplorers')}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className="guilloche flex flex-col gap-5 rounded-doc p-5 text-left shadow-doc"
        aria-label={`${program.xplorers.modeName}: see what's in it`}
      >
        <span className="flex flex-col gap-2">
          <span className="font-display text-display text-ink">{program.xplorers.modeName}</span>
          <span className="text-body text-ink-soft">
            New for members up to {program.xplorers.exit.maxAge}. Explore what Cathay offers while you grow up, and keep every mile you earn.
          </span>
        </span>

        {/* The three tiers as a short timeline: Jade dots on a Line rail */}
        <ol className="relative flex justify-between" aria-label="Tiers">
          <span className="absolute top-[7px] right-4 left-4 h-0.5 bg-line" aria-hidden="true" />
          {xplorerTiers.map((t, i) => {
            const align = i === 0 ? 'items-start text-left' : i === xplorerTiers.length - 1 ? 'items-end text-right' : 'items-center text-center'
            return (
              <li key={t.id} className={`relative flex flex-1 flex-col gap-2 ${align}`}>
                <span className="h-4 w-4 rounded-pill border-2 border-paper bg-jade" aria-hidden="true" />
                <span className={`flex flex-col ${align}`}>
                  <span className="text-small text-ink">{t.name}</span>
                  <span className="tabular text-small text-ink-soft">{t.ages.replace(' to graduation or ', '–')}</span>
                </span>
              </li>
            )
          })}
        </ol>

        <span className="flex items-center justify-between border-t border-line pt-4 text-body font-medium text-jade">
          See what's in it
          <ChevronIcon />
        </span>
      </motion.button>

      <section className="flex flex-col" aria-label="More">
        {ROWS.map((r) => (
          <div key={r.title} className="flex items-center gap-3 border-b border-line py-3">
            <Icon d={r.d} />
            <span className="flex flex-1 flex-col">
              <span className="text-body font-medium text-ink">{r.title}</span>
              <span className="text-small text-ink-soft">{r.note}</span>
            </span>
          </div>
        ))}
      </section>

      <footer className="mt-auto">
        <ConceptLabel />
      </footer>
    </main>
  )
}
