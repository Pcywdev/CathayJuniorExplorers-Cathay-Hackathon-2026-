import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useState } from 'react'
import { Barcode } from './Barcode'
import { HoldButton } from './HoldButton'
import { PlaneIcon } from './PlaneIcon'
import { formatNumber } from '../program'

interface Props {
  missionTitle: string
  miles: number
  passenger: string
  flight: string
  from: string
  to: string
  fromCity: string
  toCity: string
  departs: string
  gate: string
  seat: string
  serial: string
  onStart?: () => void
}

const TILT = 7

// Hero document. Drag it to tilt it in your hand; press and hold "Start mission" to tear off the reward stub.
export function BoardingPass(p: Props) {
  const reduce = useReducedMotion()
  const rx = useSpring(useMotionValue(0), { stiffness: 260, damping: 22 })
  const ry = useSpring(useMotionValue(0), { stiffness: 260, damping: 22 })
  const [torn, setTorn] = useState(false)

  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || e.buttons === 0) return
    const box = e.currentTarget.getBoundingClientRect()
    const nx = (e.clientX - box.left) / box.width - 0.5
    const ny = (e.clientY - box.top) / box.height - 0.5
    ry.set(nx * TILT * 2)
    rx.set(-ny * TILT * 2)
  }
  const settle = () => {
    rx.set(0)
    ry.set(0)
  }

  const tear = () => {
    setTorn(true)
    window.setTimeout(() => p.onStart?.(), reduce ? 0 : 420)
  }

  return (
    <motion.article
      onPointerMove={tilt}
      onPointerDown={tilt}
      onPointerUp={settle}
      onPointerLeave={settle}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="relative flex rounded-doc"
      aria-label={`Boarding pass: ${p.missionTitle}`}
    >
      {/* Two pieces of one document. Notches are real cut-outs (masks), so the shadow is a drop-shadow that follows them. */}
      <div className="doc-shadow flex min-w-0 flex-1">
      <div className="notch-right guilloche flex min-w-0 flex-1 flex-col gap-4 rounded-l-doc border-r-2 border-dashed border-line p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-heading">{p.missionTitle}</h2>
          <span className="font-mono text-flight text-ink-soft">{p.flight}</span>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="font-mono text-airport">{p.from}</span>
            <span className="text-small text-ink-soft">{p.fromCity}</span>
          </div>
          <span className="mx-2 mb-6 flex flex-1 items-center gap-1 text-jade" aria-hidden="true">
            <span className="flex-1 border-t-2 border-dotted border-line" />
            <PlaneIcon />
            <span className="flex-1 border-t-2 border-dotted border-line" />
          </span>
          <div className="flex flex-col items-end">
            <span className="font-mono text-airport">{p.to}</span>
            <span className="text-small text-ink-soft">{p.toCity}</span>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 font-mono text-flight">
          <div className="flex flex-col">
            <dt className="font-text text-small text-ink-soft">Departs</dt>
            <dd>{p.departs}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="font-text text-small text-ink-soft">Gate</dt>
            <dd>{p.gate}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="font-text text-small text-ink-soft">Seat</dt>
            <dd>{p.seat}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2">
          <HoldButton compact onComplete={tear}>
            Start mission
          </HoldButton>
          <p className="text-small text-ink-soft">Press and hold to tear your ticket</p>
        </div>
      </div>

      </div>

      <motion.div
        className="doc-shadow w-[92px] shrink-0"
        animate={torn ? { x: 36, y: 10, rotate: 9, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.3, 0.7, 0.4, 1] }}
        style={{ transformOrigin: '0% 0%' }}
      >
        <div className="notch-left h-full rounded-r-doc bg-paper">
        <div className="flex h-full flex-col items-center justify-between rounded-r-doc bg-miles/15 px-2 py-5">
          <div className="flex flex-col items-center">
            <span className="tabular font-display text-title text-ink">+{formatNumber(p.miles)}</span>
            <span className="text-small text-ink">miles</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-small text-ink-soft">{p.passenger}</span>
            <Barcode value={p.serial} width={60} height={30} />
            <span className="font-mono text-[11px] leading-none tracking-[0.04em] text-ink-soft">{p.serial}</span>
          </div>
        </div>
        </div>
      </motion.div>
    </motion.article>
  )
}
