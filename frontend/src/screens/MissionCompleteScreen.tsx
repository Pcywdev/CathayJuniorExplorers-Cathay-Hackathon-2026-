import { animate, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ConceptLabel } from '../components/ConceptLabel'
import { MilesProgress } from '../components/MilesProgress'
import { Pip } from '../components/Pip'
import { PrimaryButton } from '../components/PrimaryButton'
import { Stamp } from '../components/Stamp'
import { mockPastStamps, mockTrip } from '../mocks/trip'
import { navigate } from '../nav'
import { formatNumber, missionById } from '../program'
import { Scene3D } from '../three/Scene3D'
import { use3D } from '../three/support'
import { useElementSize } from '../useElementSize'

const loadPress = () => import('../three/StampPress3D')

// The demo flight date (OAG fixture CX500_2026-11-14).
const STAMP_DATE = '2026-11-14'

// Mission complete. Hero: the stamp. Press it onto the passport page, then the miles land exactly on the new total.
export function MissionCompleteScreen() {
  const reduce = useReducedMotion() ?? false
  const mission = missionById('boarding')
  const before = mockTrip.cap.used
  const after = Math.min(mockTrip.cap.limit, before + mission.miles)

  const [stamped, setStamped] = useState(reduce)
  const [shown, setShown] = useState(reduce ? after : before)
  const [signal, setSignal] = useState(0)
  const [pageRef, size] = useElementSize<HTMLDivElement>()

  // Miles counter: about one second, landing exactly on the final value.
  useEffect(() => {
    if (!stamped || reduce) return
    const run = animate(before, after, {
      duration: 1,
      delay: 0.25,
      ease: [0.2, 0.7, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => setShown(after),
    })
    return () => run.stop()
  }, [stamped, reduce, before, after])

  const pressByButton = () => {
    if (use3D()) setSignal((s) => s + 1)
    else setStamped(true)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[393px] flex-col items-center gap-5 px-5 pt-6 pb-6 text-center">
      <Pip pose="stamp" size={60} />

      <div ref={pageRef} className="guilloche relative h-[300px] w-full overflow-hidden rounded-doc shadow-doc" aria-label="Passport page">
        {/* an older stamp at the page edge, so it reads as a page that already has history */}
        <div className="absolute -top-6 -left-8 opacity-60">
          <Stamp {...mockPastStamps[0]} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          {stamped ? (
            <motion.div
              initial={{ scale: 1.3, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="scale-[1.1]">
                <Stamp city={mission.title} date={STAMP_DATE} shape="oval" rotate={-8} opacity={0.92} />
              </div>
            </motion.div>
          ) : (
            <div className="flex h-[136px] w-[212px] -rotate-3 items-center justify-center rounded-pill border-2 border-dashed border-line">
              <span className="text-small text-ink-soft">{mission.title}</span>
            </div>
          )}
        </div>

        {!reduce && size.width > 0 && (
          <Scene3D load={loadPress} props={{ ...size, pressSignal: signal, onStamp: () => setStamped(true) }} fallback={null} />
        )}
      </div>

      <div className="flex flex-col items-center gap-3" aria-live="polite">
        <h1 className="font-display text-title">{stamped ? `${mission.title.split(' ')[0]} mission complete!` : 'Press the stamp onto your passport'}</h1>
        <p className="tabular rounded-pill bg-miles/20 px-5 py-1 font-display text-display text-ink">
          +{formatNumber(mission.miles)} <span className="text-heading">miles</span>
        </p>
      </div>

      <div className="w-full text-left">
        <MilesProgress used={shown} limit={mockTrip.cap.limit} />
      </div>

      <div className="mt-auto flex w-full flex-col gap-3 text-left">
        {stamped ? (
          <PrimaryButton onClick={() => navigate('/child')}>Back to my trip</PrimaryButton>
        ) : (
          <PrimaryButton onClick={pressByButton}>Press the stamp</PrimaryButton>
        )}
        <ConceptLabel />
      </div>
    </main>
  )
}
