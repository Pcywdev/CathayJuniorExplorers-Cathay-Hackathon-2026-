import { useEffect, useRef, useState } from 'react'
import { MAX_AGE, MIN_AGE, tierForAge } from '../xplorers/discover'
import { program } from '../program'

// Member age as a timeline (DESIGN.md "Persona slider"): a Line track with a tick per year,
// tier bands named underneath, the current age as a Jade dot. Not a raw range input.
// The label follows the finger live; `onCommit` fires once on release (or shortly after a key press),
// so the phone reloads once per move instead of on every pixel.

const SPAN = MAX_AGE - MIN_AGE
const pct = (age: number) => ((age - MIN_AGE) / SPAN) * 100
const clamp = (age: number) => Math.min(MAX_AGE, Math.max(MIN_AGE, age))

const SHORT_NAME: Record<string, string> = { little: 'Little', teen: 'Teen', campus: 'Campus' }

export function AgeTimeline({ value, onCommit }: { value: number; onCommit: (age: number) => void }) {
  const [age, setAge] = useState(value)
  const [dragging, setDragging] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const keyTimer = useRef<number | undefined>(undefined)

  useEffect(() => setAge(value), [value])
  useEffect(() => () => window.clearTimeout(keyTimer.current), [])

  const ageAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect()
    return clamp(Math.round(MIN_AGE + ((clientX - r.left) / r.width) * SPAN))
  }

  const commit = (a: number) => {
    if (a !== value) onCommit(a)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    setAge(ageAt(e.clientX))
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging) setAge(ageAt(e.clientX))
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return
    setDragging(false)
    const a = ageAt(e.clientX)
    setAge(a)
    commit(a)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }
    let next: number | undefined
    if (e.key in step) next = clamp(age + step[e.key])
    if (e.key === 'Home') next = MIN_AGE
    if (e.key === 'End') next = MAX_AGE
    if (next === undefined) return
    e.preventDefault()
    setAge(next)
    window.clearTimeout(keyTimer.current)
    const a = next
    keyTimer.current = window.setTimeout(() => commit(a), 350)
  }

  const tier = tierForAge(age)
  const tiers = program.xplorers.tiers.map((t) => ({ ...t, from: Math.max(t.minAge, MIN_AGE), to: Math.min(t.maxAge, MAX_AGE) }))

  return (
    <div className="flex flex-col gap-2 px-3">
      <p className="flex items-baseline justify-between gap-2">
        <span className="tabular font-display text-title text-ink">Age {age}</span>
        <span className="text-small text-ink-soft">{SHORT_NAME[tier.id] ?? tier.name}</span>
      </p>

      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label="Member age"
        aria-valuemin={MIN_AGE}
        aria-valuemax={MAX_AGE}
        aria-valuenow={age}
        aria-valuetext={`Age ${age}, ${tier.name}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={onKeyDown}
        className="relative h-8 cursor-pointer touch-none rounded-pill outline-offset-4 select-none focus-visible:outline-2 focus-visible:outline-jade"
      >
        {/* Track */}
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-pill bg-line" aria-hidden="true" />
        {/* Filled part up to the current age */}
        <span className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-pill bg-jade" style={{ width: `${pct(age)}%` }} aria-hidden="true" />
        {/* A tick per year, taller at tier boundaries */}
        {Array.from({ length: SPAN + 1 }, (_, i) => MIN_AGE + i).map((a) => {
          const edge = tiers.some((t) => t.from === a)
          return (
            <span
              key={a}
              className={`absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 ${edge ? 'h-3' : 'h-1.5'} ${a <= age ? 'bg-jade' : 'bg-line'}`}
              style={{ left: `${pct(a)}%` }}
              aria-hidden="true"
            />
          )
        })}
        {/* Current age */}
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-paper bg-jade ${dragging ? 'scale-110' : ''}`}
          style={{ left: `${pct(age)}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Tier bands named underneath */}
      <div className="relative h-[18px]" aria-hidden="true">
        {tiers.map((t) => {
          const on = t.id === tier.id
          return (
            <span
              key={t.id}
              className={`absolute text-small ${on ? 'text-ink' : 'text-ink-soft'}`}
              style={{ left: `${pct(t.from)}%`, width: `${pct(t.to) - pct(t.from)}%` }}
            >
              {SHORT_NAME[t.id] ?? t.name}
            </span>
          )
        })}
      </div>
    </div>
  )
}
