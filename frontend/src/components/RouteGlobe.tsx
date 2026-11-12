import { Scene3D } from '../three/Scene3D'
import { useElementSize } from '../useElementSize'
import { RouteGlobeStatic, type RouteGlobeProps } from './RouteGlobeStatic'

const load = () => import('../three/RouteGlobe3D')

// Fills its parent. Interactive 3D globe when allowed, the same picture as static SVG otherwise.
export function RouteGlobe(props: Omit<RouteGlobeProps, 'width' | 'height'>) {
  const [ref, size] = useElementSize<HTMLDivElement>()
  const full = { ...props, ...size }
  return (
    <div ref={ref} className="absolute inset-0">
      {size.width > 0 && <Scene3D load={load} props={full} fallback={<RouteGlobeStatic {...full} />} />}
    </div>
  )
}
