import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// Full width, pill, Jade. 56px when pinned to the bottom; 48px inside a document.
// Pressed: scale 0.97 + darker, 100ms.
export function PrimaryButton({
  children,
  onClick,
  compact = false,
}: {
  children: ReactNode
  onClick?: () => void
  compact?: boolean
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={`${compact ? 'h-12' : 'h-14'} w-full rounded-pill bg-jade font-text text-body font-medium text-paper active:bg-jade-pressed`}
    >
      {children}
    </motion.button>
  )
}
