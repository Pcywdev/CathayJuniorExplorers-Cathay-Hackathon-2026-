// The parent's junior mode switch. A real, focusable switch; wiring to POST /api/trips comes later.
export function JuniorModeToggle({ on, onChange, label }: { on: boolean; onChange?: (on: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label ? undefined : 'Junior mode'}
      onClick={() => onChange?.(!on)}
      className="flex flex-col items-center gap-1 text-small text-ink-soft"
    >
      <span className={`inline-flex h-8 w-14 items-center rounded-pill p-1 transition-colors duration-100 ${on ? 'bg-jade' : 'bg-line'}`}>
        <span className={`h-6 w-6 rounded-pill bg-paper transition-transform duration-100 ${on ? 'translate-x-6' : ''}`} />
      </span>
      {label}
    </button>
  )
}
