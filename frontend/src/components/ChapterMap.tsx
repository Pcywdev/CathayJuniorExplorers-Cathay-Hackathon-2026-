import { motion } from 'framer-motion'

interface Tab {
  number: number
  title: string
  locked: boolean
  unlocksWhen: string
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

// The story's four pages as numbered tabs, joined by a dotted flight path.
// Open pages are Jade-outlined; sealed pages wait behind a dashed outline and a lock until their trip moment.
export function ChapterMap({ tabs, page, onPick }: { tabs: Tab[]; page: number; onPick: (i: number) => void }) {
  return (
    <div className="relative flex items-center justify-between" role="tablist" aria-label="Chapters">
      <span className="absolute inset-x-5 top-1/2 border-t-2 border-dotted border-line" aria-hidden="true" />
      {tabs.map((t, i) => {
        const on = i === page
        return (
          <motion.button
            key={t.number}
            type="button"
            role="tab"
            aria-selected={on}
            aria-label={`Chapter ${t.number}: ${t.locked ? t.unlocksWhen : t.title}`}
            onClick={() => onPick(i)}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            className={`relative flex h-11 w-11 items-center justify-center rounded-pill font-display text-heading ${
              on
                ? t.locked
                  ? 'border-2 border-ink-soft bg-paper text-ink-soft'
                  : 'bg-jade text-paper'
                : t.locked
                  ? 'border-2 border-dashed border-line bg-sky text-ink-soft'
                  : 'border-2 border-jade bg-paper text-jade'
            }`}
          >
            {t.locked ? <LockIcon /> : t.number}
          </motion.button>
        )
      })}
    </div>
  )
}
