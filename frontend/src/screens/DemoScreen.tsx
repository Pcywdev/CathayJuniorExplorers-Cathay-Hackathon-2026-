import { useEffect, useState } from 'react'
import { missionById } from '../program'
import { resetLocalMissions } from '../trip/localMissions'
import { currentStep, TRIP_STEPS, type TripStep } from '../trip/useTrip'

// Presenter view: a control panel plus both phones side by side. Each frame is the real route,
// so once the screens use the live API they sync through the backend stream.
// The panel picks which screen the child phone shows and which trip moment both phones are at.

interface ChildView {
  id: string
  label: string
  path: string
  params?: Record<string, string>
  /** The trip moment this screen belongs to; picking the screen moves both phones there. */
  step?: TripStep
}

const CHILD_VIEWS: ChildView[] = [
  { id: 'welcome', label: 'Welcome', path: '/welcome', step: 'welcome' },
  { id: 'home', label: 'Home', path: '/child' },
  { id: 'story', label: 'Story', path: '/story' },
  { id: 'complete-checkin', label: `Stamp: ${missionById('checkin').title}`, path: '/complete', params: { m: 'checkin' }, step: 'checkin' },
  { id: 'complete-boarding', label: `Stamp: ${missionById('boarding').title}`, path: '/complete', params: { m: 'boarding' }, step: 'boarded' },
  { id: 'complete-arrival', label: `Stamp: ${missionById('arrival').title}`, path: '/complete', params: { m: 'arrival' }, step: 'landed' },
  { id: 'graduation', label: 'Graduation at 18', path: '/graduation', step: 'landed' },
]

const PARENT_VIEWS = [
  { id: 'trip', label: 'Trip', path: '/parent' },
  { id: 'family', label: 'Family miles', path: '/family' },
]

const STEP_LABEL: Record<TripStep, string> = {
  welcome: 'Junior mode on',
  checkin: 'Checked in',
  delayed: 'Delayed',
  boarded: 'Boarded',
  departed: 'Departed',
  landed: 'Landed',
}

const url = (path: string, step: TripStep, params: Record<string, string> = {}) =>
  `${path}?${new URLSearchParams({ ...params, at: step })}`

function Option({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex min-h-8 w-full items-center rounded-pill px-3 py-1 text-left text-small active:scale-[0.97] ${
        on ? 'bg-jade text-paper' : 'text-ink active:bg-line'
      }`}
    >
      {children}
    </button>
  )
}

const PHONE = { w: 393, h: 852 }
const GAP = 24
const CAPTION = 26

// Sidebar is at most a fifth of the window; the phones scale down (never up) so both fit beside it.
function usePhoneScale() {
  const measure = () => {
    const side = Math.min(200, window.innerWidth / 5)
    const freeW = window.innerWidth - side - GAP * 3 - 32
    const freeH = window.innerHeight - 32 - CAPTION
    return Math.min(1, freeW / (PHONE.w * 2), freeH / PHONE.h)
  }
  const [scale, setScale] = useState(measure)
  useEffect(() => {
    const on = () => setScale(measure())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return scale
}

export function DemoScreen() {
  const [view, setView] = useState<ChildView>(CHILD_VIEWS[1])
  const [step, setStep] = useState<TripStep>(currentStep())
  const [parent, setParent] = useState(PARENT_VIEWS[0])
  const [run, setRun] = useState(0)
  const scale = usePhoneScale()

  const pickView = (v: ChildView) => {
    setView(v)
    if (v.step) setStep(v.step)
  }

  // A trip moment drives both phones. Screens that belong to one moment (welcome, a stamp, graduation)
  // hand the child phone back to Home, so the passport cover doesn't reopen at every step.
  const pickStep = (s: TripStep) => {
    setStep(s)
    if (view.step && view.step !== s) setView(CHILD_VIEWS[1])
  }

  // Clears missions finished on the phones and reloads both frames.
  const reset = () => {
    resetLocalMissions()
    setRun((n) => n + 1)
  }

  const childSrc = url(view.path, step, view.params)
  const parentSrc = url(parent.path, step)

  return (
    <main className="flex min-h-dvh items-start justify-center bg-sky p-4" style={{ gap: GAP }}>
      <aside className="flex w-[20vw] max-w-[200px] min-w-[140px] shrink-0 flex-col gap-3" aria-label="Demo controls">
        <section className="flex flex-col gap-1">
          <h2 className="px-3 font-display text-body font-bold">Child screen</h2>
          {CHILD_VIEWS.map((v) => (
            <Option key={v.id} on={v.id === view.id} onClick={() => pickView(v)}>
              {v.label}
            </Option>
          ))}
        </section>

        <section className="flex flex-col gap-1 border-t border-line pt-3">
          <h2 className="px-3 font-display text-body font-bold">Trip moment</h2>
          <ol className="flex flex-col gap-1">
            {TRIP_STEPS.map((s) => (
              <li key={s}>
                <Option on={s === step} onClick={() => pickStep(s)}>
                  {STEP_LABEL[s]}
                </Option>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-1 border-t border-line pt-3">
          <h2 className="px-3 font-display text-body font-bold">Parent screen</h2>
          {PARENT_VIEWS.map((v) => (
            <Option key={v.id} on={v.id === parent.id} onClick={() => setParent(v)}>
              {v.label}
            </Option>
          ))}
        </section>

        <button
          type="button"
          onClick={reset}
          className="mx-3 h-8 self-start rounded-pill border-2 border-line px-3 text-small text-ink active:scale-[0.97] active:bg-line"
        >
          Reset trip
        </button>

        <p className="px-3 text-small text-ink-soft">Concept screen, synthetic data</p>
      </aside>

      {[
        { src: childSrc, label: 'Child phone' },
        { src: parentSrc, label: 'Parent phone' },
      ].map((p) => (
        <figure key={p.label} className="flex shrink-0 flex-col gap-2" style={{ width: PHONE.w * scale }}>
          {/* The phone renders at its real 393x852 and is scaled as a picture, so its layout is unchanged. */}
          <div style={{ width: PHONE.w * scale, height: PHONE.h * scale }}>
            <iframe
              key={`${p.src}#${run}`}
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
