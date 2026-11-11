// Visual only for now; wiring to POST /api/trips comes later.
export function JuniorModeToggle({ on }: { on: boolean }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      aria-label="Junior mode"
      className={`inline-flex h-8 w-14 items-center rounded-pill p-1 ${on ? 'bg-jade' : 'bg-line'}`}
    >
      <span className={`h-6 w-6 rounded-pill bg-paper ${on ? 'ml-auto' : ''}`} />
    </span>
  )
}
