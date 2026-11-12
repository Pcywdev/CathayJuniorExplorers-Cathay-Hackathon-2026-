// Gates for the 3D moments. Each 3D element has a static SVG fallback that shows when either check fails.

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

let webgl: boolean | null = null
export function canUseWebGL(): boolean {
  if (webgl !== null) return webgl
  try {
    const canvas = document.createElement('canvas')
    webgl = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    webgl = false
  }
  return webgl
}

// ?static in the URL forces fallbacks (handy for screenshots and slow demo phones).
export function forceStatic(): boolean {
  return new URLSearchParams(window.location.search).has('static')
}

export function use3D(): boolean {
  return !forceStatic() && !prefersReducedMotion() && canUseWebGL()
}
