// Pip: Jade 3px outline, Paper body, Miles cheeks at 40%. Same body on every screen; only the pose changes.
//   wave  (home): one wing raised
//   fly   (story): leaning forward, both wings out, dotted trail behind
//   stamp (mission complete): both wings pressing a stamp down, eyes closed and smiling
//   peek  (welcome): looking over the top edge of the passport page, wing tips gripping it
//   extraTime (home, delayed): one wing holding up a little clock
//   proud (graduation): mortarboard on, wings on hips, eyes closed and smiling
export type PipPose = 'wave' | 'fly' | 'stamp' | 'peek' | 'extraTime' | 'proud'

const LABEL: Record<PipPose, string> = {
  wave: 'Pip waving',
  fly: 'Pip flying',
  stamp: 'Pip pressing a stamp',
  peek: 'Pip peeking over the page',
  extraTime: 'Pip holding up a clock',
  proud: 'Pip in a graduation cap',
}

const VIEWBOX: Record<PipPose, [string, number, number]> = {
  wave: ['0 0 64 64', 1, 1],
  fly: ['-28 0 96 64', 1.5, 1],
  stamp: ['0 0 64 84', 1, 1.3125],
  peek: ['0 0 64 48', 1, 0.75],
  extraTime: ['0 0 64 64', 1, 1],
  proud: ['0 0 64 64', 1, 1],
}

function Body({ crest = true }: { crest?: boolean }) {
  return (
    <>
      <path d="M14 38c0-13 8-24 19-24s17 10 17 22c0 11-8 19-18 19S14 49 14 38z" className="fill-paper stroke-jade" />
      {crest && <path d="M31 14c-1-4 1-7 4-8M35 14c1-3 3-5 6-5" className="stroke-jade" />}
      <path d="M31 34l2 3 2-3z" className="fill-jade stroke-jade" strokeWidth="2" />
      <circle cx="22" cy="35" r="3.5" className="fill-miles" opacity="0.4" />
      <circle cx="44" cy="35" r="3.5" className="fill-miles" opacity="0.4" />
    </>
  )
}

export function Pip({ pose = 'wave', size = 56 }: { pose?: PipPose; size?: number }) {
  const [viewBox, w, h] = VIEWBOX[pose]
  return (
    <svg
      viewBox={viewBox}
      width={size * w}
      height={size * h}
      fill="none"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={LABEL[pose]}
      data-pose={pose}
    >
      {pose === 'wave' && (
        <>
          <path d="M45 30c4-3 7-9 6-15 5 3 6 11 2 17" className="fill-paper stroke-jade" />
          <Body />
          <path d="M17 39c-4 1-7 4-7 8 4 0 8-2 10-5" className="fill-paper stroke-jade" />
          <circle cx="27" cy="29" r="2" className="fill-ink" />
          <circle cx="39" cy="29" r="2" className="fill-ink" />
          <path d="M27 54v4M37 54v4" className="stroke-jade" />
        </>
      )}

      {pose === 'fly' && (
        <>
          {/* dotted trail */}
          <path d="M-26 50c8-2 14-8 22-8s10 4 16 2" className="stroke-jade" strokeWidth="2.5" strokeDasharray="0.5 7" />
          <g transform="rotate(-12 32 36)">
            <path d="M18 34c-6-8-14-10-20-8 4 6 10 11 18 12" className="fill-paper stroke-jade" />
            <Body />
            <path d="M46 32c6-9 14-12 20-10-3 7-10 12-19 13" className="fill-paper stroke-jade" />
            <circle cx="28" cy="29" r="2" className="fill-ink" />
            <circle cx="40" cy="29" r="2" className="fill-ink" />
            <path d="M24 54l-3 4M34 55l-2 4" className="stroke-jade" />
          </g>
        </>
      )}

      {pose === 'stamp' && (
        <>
          <Body />
          {/* closed, smiling eyes */}
          <path d="M24 29c1.5-2 4.5-2 6 0M36 29c1.5-2 4.5-2 6 0" className="stroke-ink" strokeWidth="2.25" />
          {/* both wings down on the stamp handle */}
          <path d="M17 40c-2 6 0 12 6 15" className="stroke-jade" />
          <path d="M49 40c2 6 0 12-6 15" className="stroke-jade" />
          {/* the stamp: knob, handle, block */}
          <circle cx="33" cy="58" r="4" className="fill-paper stroke-jade" />
          <path d="M30 62h6v6h-6z" className="fill-paper stroke-jade" />
          <path d="M20 68h26v8H20z" className="fill-paper stroke-jade" />
          <path d="M22 79h22" className="stroke-stamp" strokeWidth="2.5" />
        </>
      )}

      {pose === 'peek' && (
        <>
          <clipPath id="pip-peek-edge">
            <rect x="0" y="0" width="64" height="44" />
          </clipPath>
          <g clipPath="url(#pip-peek-edge)">
            <Body />
            <circle cx="27" cy="30" r="2.25" className="fill-ink" />
            <circle cx="39" cy="30" r="2.25" className="fill-ink" />
          </g>
          {/* wing tips folded over the page edge */}
          <path d="M10 44c0-4 3-7 7-7 2 3 2 6 1 9" className="fill-paper stroke-jade" />
          <path d="M54 44c0-4-3-7-7-7-2 3-2 6-1 9" className="fill-paper stroke-jade" />
        </>
      )}

      {pose === 'extraTime' && (
        <>
          <path d="M45 31c4-3 6-8 5-13" className="stroke-jade" />
          <Body />
          <path d="M17 39c-4 1-7 4-7 8 4 0 8-2 10-5" className="fill-paper stroke-jade" />
          <circle cx="27" cy="29" r="2" className="fill-ink" />
          <circle cx="39" cy="29" r="2" className="fill-ink" />
          <path d="M27 54v4M37 54v4" className="stroke-jade" />
          {/* the little clock, held up high */}
          <circle cx="52" cy="11" r="7" className="fill-paper stroke-jade" strokeWidth="2.5" />
          <path d="M52 11V7.5M52 11h3" className="stroke-ink" strokeWidth="2" />
        </>
      )}

      {pose === 'proud' && (
        <>
          <Body crest={false} />
          {/* closed, smiling eyes */}
          <path d="M24 29c1.5-2 4.5-2 6 0M36 29c1.5-2 4.5-2 6 0" className="stroke-ink" strokeWidth="2.25" />
          {/* mortarboard */}
          <path d="M23 15v4c4 3 16 3 20 0v-4" className="fill-paper stroke-jade" />
          <path d="M17 13l16-7 16 7-16 7z" className="fill-jade stroke-jade" strokeWidth="2.5" />
          <path d="M45 15v9" className="stroke-jade" strokeWidth="2" />
          {/* wings on hips */}
          <path d="M16 38c-5 2-6 9-2 11 3 0 5-3 5-6" className="fill-paper stroke-jade" />
          <path d="M50 38c5 2 6 9 2 11-3 0-5-3-5-6" className="fill-paper stroke-jade" />
          <path d="M27 54v4M37 54v4" className="stroke-jade" />
        </>
      )}
    </svg>
  )
}
