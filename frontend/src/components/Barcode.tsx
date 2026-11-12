// Decorative ticket barcode, drawn from the serial so it never changes between renders. Not a real code.
export function Barcode({ value, width = 64, height = 28 }: { value: string; width?: number; height?: number }) {
  let seed = 0
  for (const ch of value) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const bars: { x: number; w: number }[] = []
  let x = 0
  while (x < width) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const w = 1 + (seed % 3)
    const gap = 1 + ((seed >> 8) % 2)
    if (x + w > width) break
    bars.push({ x, w })
    x += w + gap
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block text-ink">
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={0} width={b.w} height={height} fill="currentColor" />
      ))}
    </svg>
  )
}
