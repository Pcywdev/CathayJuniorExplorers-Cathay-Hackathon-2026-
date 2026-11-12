// Inked passport stamp: Stamp blue, double outline, city in capitals, date in Mono, small line icon.
// The ink texture is an SVG noise mask, so opacity varies a little across the stamp.
export type StampShape = 'circle' | 'rect' | 'oval'

interface Props {
  city: string
  date: string
  shape: StampShape
  rotate: number
  opacity: number
  className?: string
}

const SIZE: Record<StampShape, { w: number; h: number }> = {
  circle: { w: 116, h: 116 },
  rect: { w: 136, h: 92 },
  oval: { w: 148, h: 96 },
}

function Outline({ shape, w, h, inset }: { shape: StampShape; w: number; h: number; inset: number }) {
  const x = inset
  const y = inset
  const width = w - inset * 2
  const height = h - inset * 2
  if (shape === 'rect') return <rect x={x} y={y} width={width} height={height} rx={14 - inset / 2} />
  return <ellipse cx={w / 2} cy={h / 2} rx={width / 2} ry={height / 2} />
}

export function Stamp({ city, date, shape, rotate, opacity, className = '' }: Props) {
  const { w, h } = SIZE[shape]
  const id = `ink-${city.toLowerCase().replace(/\W/g, '')}`
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={`${city} stamp, ${date}`}
      className={`text-stamp ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, opacity }}
    >
      <defs>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={city.length} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.25" />
          <feComposite in="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <g strokeWidth="2.5">
          <Outline shape={shape} w={w} h={h} inset={3} />
        </g>
        <g strokeWidth="1.25">
          <Outline shape={shape} w={w} h={h} inset={9} />
        </g>
        {/* small plane icon */}
        <path
          strokeWidth="1.75"
          transform={`translate(${w / 2 - 9} ${h / 2 - 26}) scale(0.75)`}
          d="M3 13.5h15.5a2.5 2.5 0 0 0 0-5H15L10 3H8l2.5 5.5H6L4.5 6.5H3l1 3.5zM10 13.5L8 19h2l4.5-5.5"
        />
        <text
          x={w / 2}
          y={h / 2 + 8}
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          className="font-display"
          fontSize={city.length > 12 ? 11 : city.length > 8 ? 13 : 15}
          fontWeight="800"
        >
          {city.toUpperCase()}
        </text>
        <text
          x={w / 2}
          y={h / 2 + 24}
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          className="font-mono"
          fontSize="10"
          fontWeight="500"
          letterSpacing="0.04em"
        >
          {date}
        </text>
      </g>
    </svg>
  )
}
