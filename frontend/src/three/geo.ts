// Plain globe math shared by the three.js globe and its static SVG fallback, so both draw the same picture.
// Unit sphere, y up, lon 0 facing +z (towards the viewer). Orthographic view.

export type Vec3 = [number, number, number]
export interface LatLon {
  lat: number
  lon: number
}

const RAD = Math.PI / 180

export function toVec({ lat, lon }: LatLon): Vec3 {
  const p = lat * RAD
  const l = lon * RAD
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)]
}

// Same as three's Euler(viewLat, -viewLon, 0, 'XYZ'): yaw so viewLon faces us, then tilt so viewLat faces us.
export function rotate([x, y, z]: Vec3, view: LatLon): Vec3 {
  const b = -view.lon * RAD
  const x1 = x * Math.cos(b) + z * Math.sin(b)
  const z1 = -x * Math.sin(b) + z * Math.cos(b)
  const a = view.lat * RAD
  const y2 = y * Math.cos(a) - z1 * Math.sin(a)
  const z2 = y * Math.sin(a) + z1 * Math.cos(a)
  return [x1, y2, z2]
}

function normalize([x, y, z]: Vec3): Vec3 {
  const m = Math.hypot(x, y, z)
  return [x / m, y / m, z / m]
}

// Great-circle arc from a to b, lifted off the surface in the middle (like an in-flight map).
export function arc(a: LatLon, b: LatLon, steps = 64, lift = 0.08): Vec3[] {
  const va = toVec(a)
  const vb = toVec(b)
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]))
  const omega = Math.acos(dot)
  const pts: Vec3[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const s1 = Math.sin((1 - t) * omega) / Math.sin(omega)
    const s2 = Math.sin(t * omega) / Math.sin(omega)
    const v = normalize([va[0] * s1 + vb[0] * s2, va[1] * s1 + vb[1] * s2, va[2] * s1 + vb[2] * s2])
    const h = 1 + lift * Math.sin(Math.PI * t)
    pts.push([v[0] * h, v[1] * h, v[2] * h])
  }
  return pts
}

// Graticule: parallels and meridians every `step` degrees, each as a polyline.
export function graticule(step = 15, samples = 96): Vec3[][] {
  const lines: Vec3[][] = []
  for (let lat = -90 + step; lat < 90; lat += step) {
    const line: Vec3[] = []
    for (let i = 0; i <= samples; i++) line.push(toVec({ lat, lon: (i / samples) * 360 - 180 }))
    lines.push(line)
  }
  for (let lon = -180; lon < 180; lon += step) {
    const line: Vec3[] = []
    for (let i = 0; i <= samples; i++) line.push(toVec({ lat: (i / samples) * 180 - 90, lon }))
    lines.push(line)
  }
  return lines
}

// Airports on the demo route (synthetic display coordinates, rounded).
export const AIRPORTS: Record<string, LatLon> = {
  HKG: { lat: 22.31, lon: 113.92 },
  NRT: { lat: 35.77, lon: 140.39 },
}

// Shared layout so the 3D globe and the fallback line up exactly (CSS px inside the band).
export interface GlobeLayout {
  r: number
  cx: number
  cy: number
  view: LatLon
}

export function globeLayout(width: number, height: number, from: LatLon, to: LatLon): GlobeLayout {
  const r = Math.round(width * 0.68)
  const mid = { lat: (from.lat + to.lat) / 2, lon: (from.lon + to.lon) / 2 }
  // Tilt the view below the route so the arc rides high on the globe, above the boarding pass.
  return { r, cx: Math.round(width * 0.62), cy: Math.round(height + r * 0.15), view: { lat: mid.lat - 42, lon: mid.lon } }
}

// Simplified East Asia coastlines (hand-traced, rounded): enough for HKG and NRT to sit on land.
// [lat, lon] pairs; closed shapes repeat their first point.
const COAST_LATLON: [number, number][][] = [
  // Vietnam and the China coast up to Korea Bay
  [[10.4, 107.2], [12, 109.2], [14, 109.2], [16, 108.2], [17, 107], [19, 105.6], [20.7, 106.7], [21.5, 108], [21.8, 110], [22.2, 113.5], [22.5, 114.3], [23.5, 116.7], [24.5, 118.2], [26, 119.6], [28, 121.2], [30, 122], [31.2, 121.8], [32.5, 120.9], [34.5, 119.5], [35.6, 120], [36.9, 122.5], [37.4, 121.6], [38.9, 121.6], [40.1, 122.2], [39.8, 124.2],
   // Korea and the Russian coast
   [37.7, 126.2], [35, 126.3], [34.4, 126.7], [35, 129], [36, 129.5], [37.5, 129.2], [39, 127.6], [40, 128.6], [41.5, 129.8], [42.8, 131.5], [43.2, 133], [45.5, 138], [48, 140.3]],
  // Hainan
  [[20, 110.3], [19.6, 111], [18.3, 109.7], [18.6, 108.7], [19.8, 109.2], [20, 110.3]],
  // Taiwan
  [[25.3, 121.6], [24.5, 121.9], [23, 121.4], [22, 120.8], [22.6, 120.3], [24, 120.4], [25.1, 121.1], [25.3, 121.6]],
  // Luzon
  [[18.5, 120.6], [18.4, 122.2], [16, 121.7], [14.2, 121.6], [13.8, 120.6], [15.9, 119.8], [18.5, 120.6]],
  // Kyushu
  [[31, 130.6], [31.5, 131.4], [33, 131.9], [33.9, 131], [33.5, 129.8], [32.6, 129.7], [31.4, 130.2], [31, 130.6]],
  // Honshu
  [[33.9, 131], [34.4, 131.4], [35.5, 133.1], [35.6, 135.2], [36.8, 136.8], [37.5, 137.3], [37.1, 138.2], [38, 139.4], [39.5, 140], [41.2, 140.3], [41.5, 141.2], [40.5, 141.6], [39, 141.9], [38.3, 141.5], [37, 141], [35.7, 140.9], [35.1, 140.3], [34.9, 139.9], [35.3, 139.7], [34.6, 138.8], [34.7, 137.3], [34.3, 136.9], [33.5, 135.8], [34.5, 135.3], [34.3, 134.2], [34, 132.5], [33.9, 131]],
  // Shikoku
  [[34.3, 132.9], [34.2, 134.6], [33.3, 134.2], [32.8, 132.9], [33.6, 132.4], [34.3, 132.9]],
  // Hokkaido
  [[41.5, 140.1], [42.5, 140.5], [43.2, 141.3], [45.4, 141.9], [44, 144.5], [43.3, 145.6], [42.9, 143.4], [42, 143.1], [42.3, 141], [41.5, 140.1]],
]

// Densified so long segments follow the sphere instead of cutting through it.
export const COASTS: Vec3[][] = COAST_LATLON.map((line) => {
  const out: Vec3[] = []
  for (let i = 0; i < line.length - 1; i++) {
    const [la, lo] = line[i]
    const [lb, lob] = line[i + 1]
    for (let s = 0; s < 4; s++) {
      const t = s / 4
      out.push(toVec({ lat: la + (lb - la) * t, lon: lo + (lob - lo) * t }))
    }
  }
  const [lastLat, lastLon] = line[line.length - 1]
  out.push(toVec({ lat: lastLat, lon: lastLon }))
  return out
})
