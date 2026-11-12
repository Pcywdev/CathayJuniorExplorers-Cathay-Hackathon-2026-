import type { ChapterArt } from '../mocks/story'

// Single-weight line illustrations for story pages, drawn in Jade on Paper (Line when the page is still locked).
// 320 x 240 art board; the page scales it to fill the illustration area.
export function StoryArt({ art, locked = false }: { art: ChapterArt; locked?: boolean }) {
  const stroke = locked ? 'stroke-line' : 'stroke-jade'
  return (
    <svg viewBox="0 0 320 240" className="h-full w-full" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g className={stroke}>
        {art === 'harbour' && (
          <>
            {/* Hong Kong island skyline with the peak behind */}
            <path d="M0 120c30-18 60-46 96-46s56 26 84 22 50-30 80-30 46 16 60 24" />
            <path d="M18 168v-34h14v34M38 168v-52h16v52M60 168v-40l9-12 9 12v40M86 168v-72l10-10 10 10v72M112 168v-46h14v46M134 168v-90h18v90M158 168v-58l8-8 8 8v58M182 168v-40h16v40M204 168v-64h12v64M222 168v-34h18v34M246 168v-50h14v50M266 168v-28h20v28" />
            <path d="M139 78l4-12 4 12" />
            {/* water and a harbour ferry */}
            <path d="M0 176h320" />
            <path d="M10 194c10-4 20 4 30 0s20 4 30 0M120 206c10-4 20 4 30 0s20 4 30 0M232 192c10-4 20 4 30 0s20 4 30 0" />
            <path d="M186 186h56l-8 12h-40z M198 186v-10h28v10 M206 176v-6h12v6" />
          </>
        )}
        {art === 'gate' && (
          <>
            {/* big window with the plane outside */}
            <path d="M24 28h272v150H24zM24 103h272M115 28v150M206 28v150" />
            <path d="M48 140h190c18 0 26-10 26-14s-8-12-26-12H96L70 94H58l14 20H48z" />
            <path d="M126 126l-16 26h14l28-26" />
            <path d="M84 140v10M222 140v10" />
            {/* gate number sign */}
            <path d="M232 196h64v32h-64z" />
            <path d="M24 214h176" />
          </>
        )}
        {art === 'clouds' && (
          <>
            <path d="M20 150c0-16 22-24 34-14 6-20 40-22 48-2 14-8 32 2 30 16H20z" />
            <path d="M170 120c0-14 18-22 30-12 6-18 36-18 42-2 12-6 28 2 26 14H170z" />
            <path d="M120 206c0-12 16-18 26-10 6-14 30-14 34 0 10-4 22 2 22 10H120z" />
            <path d="M40 60c40 30 120 40 170 20s70-20 90-10" strokeDasharray="1 8" />
            <circle cx="268" cy="44" r="16" />
          </>
        )}
        {art === 'arrival' && (
          <>
            {/* mountain far away, city lights near */}
            <path d="M40 132l70-74 22 20 18-14 76 68" />
            <path d="M92 76l18 16 12-8 12 10" />
            <path d="M0 180h320" />
            <path d="M210 180V92l6-6 6 6v88M206 112h20M204 140h24" />
            <path d="M20 180v-30h18v30M46 180v-42h16v42M70 180v-24h20v24M246 180v-48h16v48M270 180v-34h22v34M300 180v-22h14v22" />
            <path d="M24 204h6M60 210h6M110 202h6M150 214h6M190 204h6M240 210h6M280 202h6" />
          </>
        )}
      </g>
    </svg>
  )
}
