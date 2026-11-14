import type { ReactNode } from 'react'

// Text back link used at the top of secondary screens (same look as Family and Story).
export function BackLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="-ml-1 flex h-11 items-center gap-1 self-start text-body font-medium text-jade active:text-jade-pressed">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" />
      </svg>
      {children}
    </button>
  )
}
