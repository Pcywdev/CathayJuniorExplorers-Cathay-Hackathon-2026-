import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { ConceptLabel } from '../components/ConceptLabel'
import { Pip } from '../components/Pip'
import { PrimaryButton } from '../components/PrimaryButton'
import { StoryArt } from '../components/StoryArt'
import { mockChapters, mockStoryTitle } from '../mocks/story'
import { mockTrip } from '../mocks/trip'
import { navigate } from '../nav'

// Where Pip flies on each unlocked page (percent of the illustration box).
const PIP_SPOT = [
  { left: '58%', top: '6%' },
  { left: '8%', top: '10%' },
  { left: '40%', top: '30%' },
  { left: '50%', top: '4%' },
]

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

// Story. Hero: the illustration. Swipe the page or use "Next page"; locked chapters wait with their unlock moment.
export function StoryScreen() {
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState(1)
  const chapters = mockChapters
  const chapter = chapters[page]
  const locked = chapter.number > mockTrip.chaptersUnlocked
  const last = page === chapters.length - 1

  const go = (to: number) => {
    if (to < 0 || to >= chapters.length) return
    setDir(to > page ? 1 : -1)
    setPage(to)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[393px] flex-col gap-4 px-5 pt-6 pb-6">
      <button type="button" onClick={() => navigate('/child')} className="-ml-1 flex h-11 items-center gap-1 self-start text-body font-medium text-jade">
        <BackIcon />
        Back to my trip
      </button>

      <div className="relative flex-1">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.article
            key={page}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * 340, rotate: d * 2 }),
              center: { x: 0, rotate: 0 },
              exit: (d: number) => ({ x: d * -340, rotate: d * -2 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) go(page + 1)
              else if (info.offset.x > 70) go(page - 1)
            }}
            className="flex h-full min-h-[600px] touch-pan-y flex-col overflow-hidden rounded-doc bg-paper shadow-doc"
            aria-label={`Chapter ${chapter.number}${locked ? ', locked' : ''}`}
          >
            <div className={`relative h-[400px] shrink-0 border-b border-line ${locked ? 'bg-sky/40' : 'guilloche'}`}>
              <div className={`absolute inset-x-4 top-8 ${locked ? 'bottom-20' : 'bottom-4'}`}>
                <StoryArt art={chapter.art} locked={locked} />
              </div>
              {!locked && (
                <div className="absolute" style={PIP_SPOT[page]}>
                  <Pip pose="fly" size={64} />
                </div>
              )}
              {locked && (
                <div className="absolute inset-x-0 bottom-5 flex justify-center">
                  <span className="flex items-center gap-2 rounded-pill border-2 border-line bg-paper px-4 py-2 text-ink-soft">
                    <LockIcon />
                    <span className="text-body font-medium">{chapter.unlocksWhen}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 p-5">
              {page === 0 && <h1 className="font-display text-title">{mockStoryTitle}</h1>}
              <h2 className={`font-display text-heading ${locked ? 'text-ink-soft' : ''}`}>Chapter {chapter.number}: {chapter.title}</h2>
              {locked ? (
                <p className="text-body text-ink-soft">This page is still sealed. Pip is saving it for later.</p>
              ) : (
                <p className="text-body">{chapter.text}</p>
              )}
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-1 gap-2" role="tablist" aria-label="Pages">
          {chapters.map((c, i) => (
            <button
              key={c.number}
              type="button"
              role="tab"
              aria-selected={i === page}
              aria-label={`Chapter ${c.number}`}
              onClick={() => go(i)}
              className="flex h-11 w-6 items-center justify-center"
            >
              <span className={`h-2.5 rounded-pill ${i === page ? 'w-6 bg-jade' : 'w-2.5 border-2 border-line'}`} />
            </button>
          ))}
        </div>
        <div className="w-[168px]">
          <PrimaryButton onClick={() => (last ? navigate('/child') : go(page + 1))}>{last ? 'Back to my trip' : 'Next page'}</PrimaryButton>
        </div>
      </div>

      <ConceptLabel />
    </main>
  )
}
