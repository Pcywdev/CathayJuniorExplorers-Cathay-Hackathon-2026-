import { animate, motion, useMotionValue, type AnimationPlaybackControls } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

// Press and hold: a darker Jade fills the pill from the left; letting go early drains it.
// Keyboard (Enter / Space) completes straight away, so the action never depends on holding.
export function HoldButton({
  children,
  onComplete,
  holdMs = 800,
  compact = false,
}: {
  children: ReactNode
  onComplete: () => void
  holdMs?: number
  compact?: boolean
}) {
  const fill = useMotionValue(0)
  const run = useRef<AnimationPlaybackControls | null>(null)
  const done = useRef(false)

  const finish = () => {
    if (done.current) return
    done.current = true
    onComplete()
  }

  const start = () => {
    if (done.current) return
    run.current?.stop()
    run.current = animate(fill, 1, {
      duration: (holdMs / 1000) * (1 - fill.get()),
      ease: 'linear',
      onComplete: finish,
    })
  }

  const cancel = () => {
    if (done.current) return
    run.current?.stop()
    run.current = animate(fill, 0, { duration: 0.18, ease: 'easeOut' })
  }

  return (
    <motion.button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={(e) => {
        if (e.detail === 0) finish() // keyboard activation
      }}
      onContextMenu={(e) => e.preventDefault()}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={`relative ${compact ? 'h-12' : 'h-14'} w-full touch-none overflow-hidden rounded-pill bg-jade font-text text-body font-medium text-paper select-none`}
    >
      <motion.span aria-hidden="true" className="absolute inset-0 origin-left bg-jade-pressed" style={{ scaleX: fill }} />
      <span className="relative">{children}</span>
    </motion.button>
  )
}
