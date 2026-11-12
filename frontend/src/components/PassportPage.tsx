import { motion } from 'framer-motion'
import { useState } from 'react'
import { Stamp, type StampShape } from './Stamp'

interface StampData {
  city: string
  date: string
  shape: StampShape
  rotate: number
  opacity: number
}

const SPOTS = ['top-3 left-2', 'top-[70px] left-[108px]']

const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

// Passport page: collected stamps staggered and overlapping, then a dashed "Next stop".
// Tap a stamp to lift it off the page and read where and when it was collected.
export function PassportPage({ stamps, nextCity }: { stamps: readonly StampData[]; nextCity: string }) {
  const [picked, setPicked] = useState<number | null>(null)
  const chosen = picked === null ? null : stamps[picked]

  return (
    <section className="flex flex-col gap-3" aria-label="Passport page">
      <h2 className="font-display text-heading">My passport</h2>
      <div className="guilloche relative h-[196px] overflow-hidden rounded-doc shadow-doc">
        {stamps.slice(0, SPOTS.length).map((s, i) => (
          <motion.button
            key={s.city}
            type="button"
            onClick={() => setPicked(picked === i ? null : i)}
            aria-pressed={picked === i}
            aria-label={`${s.city} stamp`}
            className={`absolute ${SPOTS[i]} rounded-doc`}
            animate={picked === i ? { scale: 1.06, rotate: -s.rotate, zIndex: 2 } : { scale: 1, rotate: 0, zIndex: 1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <Stamp {...s} />
          </motion.button>
        ))}
        <div
          className="absolute top-8 right-4 flex h-[108px] w-[116px] -rotate-3 flex-col items-center justify-center rounded-pill border-2 border-dashed border-line"
          aria-label={`Next stop: ${nextCity}`}
        >
          <span className="text-small text-ink-soft">Next stop</span>
          <span className="font-display text-body font-bold text-ink-soft">{nextCity}</span>
        </div>
      </div>
      <p className="min-h-[18px] text-small text-ink-soft" aria-live="polite">
        {chosen ? `${chosen.city}, collected ${longDate(chosen.date)}` : 'Tap a stamp to see when you collected it'}
      </p>
    </section>
  )
}
