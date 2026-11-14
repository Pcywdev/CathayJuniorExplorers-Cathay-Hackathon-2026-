import { useState } from 'react'
import { mockAllStamps, mockFlight } from '../mocks/trip'
import { DEFAULT_AGE, tierForAge } from '../xplorers/discover'
import { Stamp, STAMP_SIZE } from './Stamp'

// The passport as a memory page, for Teen, Campus and exit (Little Xplorers keeps PassportPage).
// Nostalgia cues, all from data we already hold (stamp city + date, the member's age); no photos, places or anecdotes:
// - resurfacing: one stamp is featured as "N years ago · You were N", like an "on this day" memory;
// - a recap: how many stamps, since what age, across how many cities;
// - time on the page: older stamps are fainter, and childhood stamps keep their playful tilt while later ones sit straighter;
// - in order: oldest first, one run of stamps, so the page reads as a life so far.

type StampData = (typeof mockAllStamps)[number]

// Mei is 7 on the demo trip date, so her birth year anchors every "years ago" and "you were".
const TRIP_YEAR = Number(mockFlight.date.slice(0, 4))
const BIRTH_YEAR = TRIP_YEAR - DEFAULT_AGE
const MONTH_DAY = mockFlight.date.slice(4)

const MINI = 0.5
const FEATURE = 0.82

const monthYear = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

function yearsAgoText(years: number) {
  if (years <= 0) return 'This year'
  return years === 1 ? '1 year ago' : `${years} years ago`
}

/** A Stamp drawn at a fraction of its size, in a box that matches, so it lays out like a smaller element. */
function SizedStamp({ s, scale, rotate, opacity }: { s: StampData; scale: number; rotate: number; opacity: number }) {
  const { w, h } = STAMP_SIZE[s.shape]
  return (
    <span className="relative block" style={{ width: w * scale, height: h * scale }}>
      <span className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
        <Stamp city={s.city} date={s.date} shape={s.shape} rotate={rotate} opacity={opacity} />
      </span>
    </span>
  )
}

export function MemoryPassport({ age, title = 'My passport' }: { age: number; title?: string }) {
  const nowYear = BIRTH_YEAR + age
  const now = `${nowYear}${MONTH_DAY}`
  // Only stamps collected before "now" for this age: the passport fills as the member grows up.
  const stamps = mockAllStamps.filter((s) => s.date < now)
  const [picked, setPicked] = useState(0)

  if (stamps.length === 0) return null

  const yearOf = (s: StampData) => Number(s.date.slice(0, 4))
  const ageThen = (s: StampData) => yearOf(s) - BIRTH_YEAR
  const yearsAgo = (s: StampData) => nowYear - yearOf(s)
  // Fainter with time, but never below ~0.65 opacity so the smallest, oldest stamp is still readable.
  const faded = (s: StampData) => s.opacity * Math.max(0.74, 1 - yearsAgo(s) * 0.03)
  // Childhood stamps keep their full tilt; later ones are pressed straighter.
  const tilt = (s: StampData) => (tierForAge(ageThen(s)).id === 'little' ? s.rotate : s.rotate * 0.4)

  const featured = stamps[Math.min(picked, stamps.length - 1)]
  const featuredLabel = picked === 0 ? 'Your first stamp' : yearsAgoText(yearsAgo(featured))
  const cities = new Set(stamps.map((s) => s.city)).size
  const first = stamps[0]
  const last = stamps[stamps.length - 1]


  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-heading">{title}</h2>
        <span className="tabular text-small text-ink-soft">
          {stamps.length} stamps since you were {ageThen(first)}
        </span>
      </div>

      <article className="guilloche flex flex-col rounded-doc shadow-doc">
        {/* Featured memory: the stamp large, and when it was in your life */}
        <div className="flex items-center gap-4 p-5">
          <span className="flex h-[96px] w-[122px] shrink-0 items-center justify-center" aria-hidden="true">
            <SizedStamp s={featured} scale={FEATURE} rotate={tilt(featured)} opacity={featured.opacity} />
          </span>
          <p className="flex min-w-0 flex-col" aria-live="polite">
            <span className="text-small text-ink-soft">{featuredLabel}</span>
            <span className="font-display text-title text-ink">{featured.city}</span>
            <span className="text-body text-ink-soft">{monthYear(featured.date)}</span>
            <span className="text-body text-ink">You were {ageThen(featured)}</span>
          </p>
        </div>

        {/* The page fold, then every stamp in the order it was collected */}
        <div className="border-t-2 border-dashed border-line" aria-hidden="true" />
        <div className="p-5 pt-4">
          <ul className="flex flex-wrap items-center gap-x-1 gap-y-1" aria-label="Stamps, oldest first">
            {stamps.map((s, i) => (
              <li key={s.city} className={i % 2 ? 'translate-y-1.5' : '-translate-y-0.5'}>
                    <button
                      type="button"
                      onClick={() => setPicked(i)}
                      aria-pressed={i === picked}
                      aria-label={`${s.city}, ${monthYear(s.date)}, ${yearsAgoText(yearsAgo(s)).toLowerCase()}`}
                      className={`rounded-doc p-1 transition-transform duration-100 active:scale-[0.97] ${i === picked ? 'bg-stamp/10' : ''}`}
                    >
                      <SizedStamp s={s} scale={MINI} rotate={tilt(s)} opacity={faded(s)} />
                    </button>
                  </li>
            ))}
          </ul>
        </div>
      </article>

      <p className="tabular text-small text-ink-soft">
        {cities} cities, {yearOf(first)} to {yearOf(last)}. Tap a stamp to remember it.
      </p>
    </section>
  )
}
