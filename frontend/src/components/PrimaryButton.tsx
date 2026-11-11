import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// Full width, pill, Jade, 56px. Pressed: scale 0.97 + darker, 100ms.
export function PrimaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className="h-14 w-full rounded-pill bg-jade font-text text-body font-medium text-paper active:bg-jade-pressed"
    >
      {children}
    </motion.button>
  )
}
