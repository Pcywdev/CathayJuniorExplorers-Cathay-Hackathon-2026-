import { useEffect, useRef, useState } from 'react'
import { missionById, program } from '../program'
import { resetLocalMissions } from '../trip/localMissions'
import type { TripStep } from '../trip/useTrip'
import { AgeTimeline } from '../components/AgeTimeline'
import { tierForAge } from '../xplorers/discover'

// Presenter view: the demo video as a fixed script. Each scene sets the child phone's screen, the trip moment,
// Mei's age (in the URL, read by useMemberAge) and whether the parent phone shows. Next / Back (or the arrow keys)
// walk the script; clicking a phase or scene jumps to it. Each frame is the real route.

type PhaseId = 'join' | 'little' | 'teen' | 'campus' | 'exit'

interface Scene {
  phase: PhaseId
  label: string
  path: string
  params?: Record<string, string>
  step: TripStep
  age: number
  /** Parent phone route; without it only the child phone shows. */
  parent?: string
}

const mei = program.xplorers.personas.mei
const [LITTLE_AGE, TEEN_AGE, CAMPUS_AGE] = Object.keys(mei.balanceByAge).map(Number)

const PHASES: { id: PhaseId; label: string }[] = [
  { id: 'join', label: 'Join' },
  { id: 'little', label: 'Little Xplorers' },
  { id: 'teen', label: 'Teen Xplorers' },
  { id: 'campus', label: 'Campus Xplorers' },
  { id: 'exit', label: 'Exit' },
]

const stamp = (id: string) => `Stamp: ${missionById(id).title}`

// Teen and Campus: no missions or story, so the trip moments show on the plain ticket, then where it leads.
const grownUp = (phase: PhaseId, age: number): Scene[] => [
  { phase, age, label: 'Checked in', path: '/child', step: 'checkin' },
  { phase, age, label: 'Delayed', path: '/child', step: 'delayed' },
  { phase, age, label: 'Boarded', path: '/child', step: 'boarded' },
  { phase, age, label: 'Departed', path: '/child', step: 'departed' },
  { phase, age, label: 'Landed', path: '/child', step: 'landed' },
  { phase, age, label: 'Where this leads', path: '/ahead', step: 'landed' },
]

const SCENES: Scene[] = [
  { phase: 'join', age: LITTLE_AGE, label: 'App home', path: '/home', step: 'welcome' },
  { phase: 'join', age: LITTLE_AGE, label: 'Xplorers intro', path: '/xplorers', step: 'welcome' },
  { phase: 'join', age: LITTLE_AGE, label: 'Sign-up', path: '/signup', step: 'welcome' },
  { phase: 'join', age: LITTLE_AGE, label: "Mei's welcome", path: '/welcome', step: 'welcome' },

  { phase: 'little', age: LITTLE_AGE, label: 'Checked in', path: '/child', step: 'checkin', parent: '/parent' },
  { phase: 'little', age: LITTLE_AGE, label: stamp('checkin'), path: '/complete', params: { m: 'checkin' }, step: 'checkin', parent: '/parent' },
  { phase: 'little', age: LITTLE_AGE, label: 'Delayed', path: '/child', step: 'delayed', parent: '/parent' },
  { phase: 'little', age: LITTLE_AGE, label: 'Boarded', path: '/child', step: 'boarded', parent: '/parent' },
  { phase: 'little', age: LITTLE_AGE, label: stamp('boarding'), path: '/complete', params: { m: 'boarding' }, step: 'boarded', parent: '/parent' },
  { phase: 'little', age: LITTLE_AGE, label: 'Departed', path: '/child', step: 'departed', parent: '/parent' },
  { phase: 'little', age: LITTLE_AGE, label: 'Story', path: '/story', step: 'departed', parent: '/parent' },
  { phase: 'little', age: LITTLE_AGE, label: 'Landed', path: '/child', step: 'landed', parent: '/parent' },
  { phase: 'little', age: LITTLE_AGE, label: stamp('arrival'), path: '/complete', params: { m: 'arrival' }, step: 'landed', parent: '/parent' },
  { phase: 'little', age: LITTLE_AGE, label: 'Family miles', path: '/child', step: 'landed', parent: '/family' },

  ...grownUp('teen', TEEN_AGE),
  ...grownUp('campus', CAMPUS_AGE),

  { phase: 'exit', age: mei.exitAge, label: 'Graduated', path: '/exit', step: 'landed' },
]

const firstOf = (phase: PhaseId) => SCENES.findIndex((s) => s.phase === phase)

const phaseForAge = (age: number): PhaseId => (age >= mei.exitAge ? 'exit' : (tierForAge(age).id as PhaseId))

const url = (path: string, s: Scene, params: Record<string, string> = {}) =>
  `${path}?${new URLSearchParams({ ...params, at: s.step, age: String(s.age) })}`

function Option({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex min-h-8 w-full items-center gap-2 rounded-pill px-3 py-1 text-left text-small active:scale-[0.97] ${
        on ? 'bg-jade text-paper' : 'text-ink active:bg-line'
      }`}
    >
      {children}
    </button>
  )
}

const NEXT_KEYS = ['ArrowRight', 'PageDown']
const BACK_KEYS = ['ArrowLeft', 'PageUp']

// Keys typed into the sign-up form or the age slider belong to them, not to the script.
function ownsKeys(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable || el.getAttribute?.('role') === 'slider')
}

const PHONE = { w: 393, h: 852 }
const GAP = 24
const CAPTION = 26

// Sidebar is at most a fifth of the window; the phones scale down (never up) so they all fit beside it.
function usePhoneScale(count: number) {
  const measure = () => {
    const side = Math.min(200, window.innerWidth / 5)
    const freeW = window.innerWidth - side - GAP * (count + 1) - 32
    const freeH = window.innerHeight - 32 - CAPTION
    return Math.min(1, freeW / (PHONE.w * count), freeH / PHONE.h)
  }
  const [scale, setScale] = useState(measure)
  useEffect(() => {
    const on = () => setScale(measure())
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])
  return scale
}

export function DemoScreen() {
  const [i, setI] = useState(0)
  const [run, setRun] = useState(0)
  const scene = SCENES[i]
  const phaseScenes = SCENES.map((s, n) => ({ s, n })).filter(({ s }) => s.phase === scene.phase)
  const scale = usePhoneScale(scene.parent ? 2 : 1)

  const go = (n: number) => setI(Math.min(SCENES.length - 1, Math.max(0, n)))
  const goRef = useRef(go)
  goRef.current = go
  const iRef = useRef(i)
  iRef.current = i

  // One handler for the panel window and for each phone frame, so the keys still work after tapping a phone.
  const onKey = useRef((e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || ownsKeys(e.target)) return
    if (NEXT_KEYS.includes(e.key)) goRef.current(iRef.current + 1)
    else if (BACK_KEYS.includes(e.key)) goRef.current(iRef.current - 1)
    else return
    e.preventDefault()
  }).current

  useEffect(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onKey])

  // Clears missions finished on the phones and reloads both frames.
  const reset = () => {
    resetLocalMissions()
    setRun((n) => n + 1)
  }

  const phones = [
    { src: url(scene.path, scene, scene.params), label: 'Child phone' },
    ...(scene.parent ? [{ src: url(scene.parent, scene), label: 'Parent phone' }] : []),
  ]
  const phaseLabel = PHASES.find((p) => p.id === scene.phase)!.label
  const stepInPhase = phaseScenes.findIndex(({ n }) => n === i) + 1

  return (
    <main className="flex min-h-dvh items-start justify-center bg-sky p-4" style={{ gap: GAP }}>
      <aside className="flex w-[20vw] max-w-[200px] min-w-[140px] shrink-0 flex-col gap-3" aria-label="Demo controls">
        <section className="flex flex-col gap-1 border-b border-line pb-3">
          <h2 className="px-3 font-display text-body font-bold">Member age</h2>
          <AgeTimeline value={scene.age} onCommit={(a) => go(firstOf(phaseForAge(a)))} />
        </section>

        <nav className="flex flex-col gap-1" aria-label="Phases">
          {PHASES.map((p) => (
            <Option key={p.id} on={p.id === scene.phase} onClick={() => go(firstOf(p.id))}>
              {p.label}
            </Option>
          ))}
        </nav>

        <section className="flex flex-col gap-1 border-t border-line pt-3">
          <h2 className="px-3 font-display text-body font-bold">
            {phaseLabel}, {stepInPhase} of {phaseScenes.length}
          </h2>
          <ol className="flex flex-col">
            {phaseScenes.map(({ s, n }, k) => (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => go(n)}
                  aria-current={n === i ? 'step' : undefined}
                  className={`flex w-full gap-2 px-3 py-1 text-left text-small active:scale-[0.97] ${n === i ? 'font-medium text-jade' : 'text-ink-soft'}`}
                >
                  <span className="tabular w-4 shrink-0">{k + 1}</span>
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex gap-2 px-3">
          <button
            type="button"
            onClick={() => go(i - 1)}
            disabled={i === 0}
            className="h-10 flex-1 rounded-pill border-2 border-line text-small text-ink active:scale-[0.97] active:bg-line disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => go(i + 1)}
            disabled={i === SCENES.length - 1}
            className="h-10 flex-1 rounded-pill bg-jade text-small font-medium text-paper active:scale-[0.97] disabled:opacity-40"
          >
            Next
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          className="mx-3 h-8 self-start rounded-pill border-2 border-line px-3 text-small text-ink active:scale-[0.97] active:bg-line"
        >
          Reset trip
        </button>

        <p className="px-3 text-small text-ink-soft">Concept screen, synthetic data</p>
      </aside>

      {phones.map((p) => (
        <figure key={p.label} className="flex shrink-0 flex-col gap-2" style={{ width: PHONE.w * scale }}>
          {/* The phone renders at its real 393x852 and is scaled as a picture, so its layout is unchanged. */}
          <div style={{ width: PHONE.w * scale, height: PHONE.h * scale }}>
            <iframe
              key={`${p.src}#${run}`}
              onLoad={(e) => e.currentTarget.contentWindow?.addEventListener('keydown', onKey)}
              src={p.src}
              title={p.label}
              width={PHONE.w}
              height={PHONE.h}
              className="origin-top-left rounded-doc border-0 bg-sky shadow-doc"
              style={{ transform: `scale(${scale})` }}
            />
          </div>
          <figcaption className="flex justify-between gap-2 text-small text-ink-soft">
            <span>{p.label}</span>
            <span>{p.src.split('?')[0]}</span>
          </figcaption>
        </figure>
      ))}
    </main>
  )
}
