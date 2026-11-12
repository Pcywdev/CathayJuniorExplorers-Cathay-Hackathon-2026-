import { AIRPORTS, COASTS, arc, globeLayout, graticule, rotate, toVec, type GlobeLayout, type Vec3 } from '../three/geo'

export interface RouteGlobeProps {
  from: string
  to: string
  progress: number // 0 at the gate, 1 landed
  width: number
  height: number
  layout?: (w: number, h: number) => GlobeLayout
  labels?: boolean
}

// Static SVG version of the route globe: the fallback for reduced motion / no WebGL, and the parent thumbnail.
export function RouteGlobeStatic({ from, to, progress, width, height, layout, labels = true }: RouteGlobeProps) {
  const a = AIRPORTS[from]
  const b = AIRPORTS[to]
  const { r, cx, cy, view } = (layout ?? globeLayout)(width, height, a, b)
  const project = (v: Vec3) => {
    const [x, y, z] = rotate(v, view)
    return { x: cx + x * r, y: cy - y * r, z }
  }
  const path = (pts: Vec3[]) => {
    let d = ''
    let pen = false
    for (const p of pts) {
      const q = project(p)
      if (q.z <= 0) {
        pen = false
        continue
      }
      d += `${pen ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`
      pen = true
    }
    return d
  }
  const route = arc(a, b)
  const split = Math.max(1, Math.round(progress * (route.length - 1)))
  const pa = project(toVec(a))
  const pb = project(toVec(b))
  const planeAt = project(route[Math.min(route.length - 2, Math.max(1, split))])
  const planeNext = project(route[Math.min(route.length - 1, Math.max(2, split + 1))])
  const k = Math.min(1, r / 60) // shrink pins and plane on small thumbnails
  const heading = (Math.atan2(planeNext.y - planeAt.y, planeNext.x - planeAt.x) * 180) / Math.PI

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block">
      <circle cx={cx} cy={cy} r={r} className="fill-jade-pressed" />
      <circle cx={cx} cy={cy} r={r + 6} fill="none" className="stroke-paper" strokeOpacity="0.18" strokeWidth="1" />
      <path d={graticule().map(path).join('')} fill="none" className="stroke-paper" strokeOpacity="0.2" strokeWidth="1" />
      <path d={COASTS.map(path).join('')} fill="none" className="stroke-paper" strokeOpacity="0.6" strokeWidth="1" strokeLinejoin="round" />
      <path d={path(route.slice(split))} fill="none" className="stroke-paper" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      <path d={path(route.slice(0, split + 1))} fill="none" className="stroke-paper" strokeWidth="2.5" strokeLinecap="round" />
      {[pa, pb].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={7 * k} fill="none" className="stroke-paper" strokeWidth={1.5 * k} />
          <circle cx={p.x} cy={p.y} r={3 * k} className="fill-paper" />
        </g>
      ))}
      <g transform={`translate(${planeAt.x} ${planeAt.y}) rotate(${heading}) scale(${k})`}>
        <path d="M9 0L-6 -6L-3 0L-6 6z" className="fill-paper" />
      </g>
      {labels && (
        <>
      <text x={pa.x - 30} y={pa.y + 3} textAnchor="middle" className="fill-paper font-mono" fontSize="13" fontWeight="600" letterSpacing="0.04em">
        {from}
      </text>
      <text x={pb.x + 6} y={pb.y - 17} textAnchor="middle" className="fill-paper font-mono" fontSize="13" fontWeight="600" letterSpacing="0.04em">
        {to}
      </text>
        </>
      )}
    </svg>
  )
}
