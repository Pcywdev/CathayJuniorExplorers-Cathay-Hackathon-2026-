import { motion, useReducedMotion } from 'framer-motion'

// One short line from Pip, sitting just under Pip with its tail pointing up at Pip.
// It floats gently (a slow 3px bob, user-requested); reduced motion keeps it still. No shadow: it isn't a document.
export function SpeechLine({ children, tailLeft = 26 }: { children: string; tailLeft?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.p
      className="relative self-start rounded-pill bg-paper px-4 py-2 font-display text-body font-bold text-ink"
      animate={reduce ? undefined : { y: [0, -3, 0] }}
      transition={reduce ? undefined : { duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
      aria-live="polite"
    >
      <span
        className="absolute -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 bg-paper"
        style={{ left: tailLeft }}
        aria-hidden="true"
      />
      <span className="relative">{children}</span>
    </motion.p>
  )
}
