import { Component, Suspense, lazy, useMemo, type ComponentType, type ReactNode } from 'react'
import { use3D } from './support'

// Lazy 3D slot: three.js only downloads when this renders and 3D is allowed.
// Until it loads, or if it fails, or under reduced motion / no WebGL, the static fallback shows.

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function Scene3D<P extends object>({
  load,
  props,
  fallback,
}: {
  load: () => Promise<{ default: ComponentType<P> }>
  props: P
  fallback: ReactNode
}) {
  // `load` is a stable module-level function at every call site.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Lazy = useMemo(() => lazy(load), [])
  if (!use3D()) return <>{fallback}</>
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Lazy {...props} />
      </Suspense>
    </Boundary>
  )
}
