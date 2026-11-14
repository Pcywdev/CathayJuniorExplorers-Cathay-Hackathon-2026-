import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { ConceptLabel } from '../components/ConceptLabel'
import { Pip } from '../components/Pip'
import { PrimaryButton } from '../components/PrimaryButton'
import { mockEvents } from '../mocks/events'
import { mockFlight } from '../mocks/trip'
import { navigate } from '../nav'
import { formatNumber, missionById, program } from '../program'

function GlobeMark() {
  return (
    <svg viewBox="0 0 64 64" width="88" height="88" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="32" cy="32" r="26" />
      <path d="M6 32h52M32 6c8 7 11 16 11 26s-3 19-11 26c-8-7-11-16-11-26S24 13 32 6z" />
      <path d="M10 19h44M10 45h44" strokeDasharray="1 4" />
    </svg>
  )
}

// Welcome (junior mode on). Hero: the child's own passport. Pip peeks over the top edge;
// tap or swipe the cover open to find chapter 1 and the first mission waiting inside.
export function WelcomeScreen() {
  const reduce = useReducedMotion() ?? false
  const [open, setOpen] = useState(false)
  const name = program.demoMember.name
  const hello = mockEvents[0].childMessage
  const first = missionById('checkin')
  const flight = mockFlight

  return (
    <main className="guilloche-sky mx-auto flex min-h-dvh max-w-[393px] flex-col gap-6 px-5 pt-8 pb-6">
      <h1 className="font-display text-title">Your passport is ready</h1>

      <div className="relative mx-auto mt-8 h-[500px] w-[312px]" style={{ perspective: 1200 }}>
        {/* Pip, peeking over the top edge of the passport */}
        <div className="absolute -top-[34px] left-1/2 z-20 -translate-x-1/2">
          <Pip pose="peek" size={60} />
        </div>

        {/* first page, under the cover */}
        <article className="guilloche absolute inset-0 flex flex-col gap-4 rounded-doc p-6 pt-10 shadow-doc" aria-hidden={!open}>
          <p className="font-display text-heading">{hello}</p>
          <div className="flex flex-col gap-1 border-t border-line pt-4">
            <span className="text-small text-ink-soft">Your first mission</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-body font-medium">{first.title}</span>
              <span className="tabular rounded-pill bg-miles/20 px-3 py-0.5 text-body font-medium text-ink">+{formatNumber(first.miles)} miles</span>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
            <div className="flex flex-col">
              <dt className="text-small text-ink-soft">Flight</dt>
              <dd className="font-mono text-flight">
                {flight.carrier} {flight.number}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-small text-ink-soft">Date</dt>
              <dd className="font-mono text-flight">{flight.date}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-small text-ink-soft">{flight.fromCity}</dt>
              <dd className="font-mono text-airport">{flight.from}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-small text-ink-soft">{flight.toCity}</dt>
              <dd className="font-mono text-airport">{flight.to}</dd>
            </div>
          </dl>
          <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
            <span
              className="flex h-[92px] w-[92px] shrink-0 -rotate-6 flex-col items-center justify-center rounded-pill border-2 border-dashed border-line"
              aria-hidden="true"
            >
              <span className="text-small text-ink-soft">Next stop</span>
              <span className="font-display text-body font-bold text-ink-soft">{flight.toCity}</span>
            </span>
            <p className="text-body text-ink-soft">Your first stamp goes here when you land.</p>
          </div>
        </article>

        {/* the cover: swipe left or tap to open it like a book */}
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          onPanEnd={(_, info) => {
            if (info.offset.x < -40) setOpen(true)
          }}
          disabled={open}
          animate={{ rotateY: open ? -168 : 0 }}
          transition={{ duration: reduce ? 0 : 0.6, ease: [0.3, 0.7, 0.2, 1] }}
          whileTap={open ? undefined : { scale: 0.98 }}
          style={{ transformOrigin: '0% 50%', backfaceVisibility: 'hidden' }}
          className="guilloche-on-jade absolute inset-0 z-10 flex touch-pan-y flex-col items-start justify-between rounded-doc bg-jade p-6 pt-12 text-left text-paper shadow-doc"
          aria-label={`${name}'s junior passport. Open it`}
        >
          <span className="flex flex-col gap-1">
            <span className="font-display text-display">Little Xplorers</span>
            <span className="text-body text-paper/85">Junior passport</span>
          </span>
          <span className="self-center text-paper/90">
            <GlobeMark />
          </span>
          <span className="flex w-full items-end justify-between">
            <span className="font-display text-title">{name}</span>
            <span className="font-mono text-flight text-paper/85">
              {flight.from} → {flight.to}
            </span>
          </span>
        </motion.button>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {open ? (
          <PrimaryButton onClick={() => navigate('/child')}>Start my adventure</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => setOpen(true)}>Open my passport</PrimaryButton>
        )}
        <ConceptLabel />
      </div>
    </main>
  )
}
