import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { RouteGlobeProps } from '../components/RouteGlobeStatic'
import { AIRPORTS, COASTS, arc, globeLayout, graticule, toVec, type Vec3 } from './geo'

const PAPER = 0xfbfcfa
const JADE_PRESSED = 0x0a4a3d
const RAD = Math.PI / 180

const v3 = ([x, y, z]: Vec3, s = 1) => new THREE.Vector3(x * s, y * s, z * s)

// Interactive route globe. Drag to turn it; it eases to a stop. Renders only while moving (no idle loop).
export default function RouteGlobe3D({ from, to, progress, width, height, layout }: RouteGlobeProps) {
  const host = useRef<HTMLDivElement>(null)
  const labelFrom = useRef<HTMLSpanElement>(null)
  const labelTo = useRef<HTMLSpanElement>(null)
  const [dragged, setDragged] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el || width === 0) return
    const a = AIRPORTS[from]
    const b = AIRPORTS[to]
    const { r, cx, cy, view } = (layout ?? globeLayout)(width, height, a, b)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'pan-y'
    el.prepend(renderer.domElement)

    // Orthographic camera in CSS pixels, so the layout matches the SVG fallback exactly.
    const camera = new THREE.OrthographicCamera(0, width, 0, -height, -2000, 2000)
    camera.position.z = 1000
    const scene = new THREE.Scene()

    const globe = new THREE.Group()
    globe.position.set(cx, -cy, 0)
    scene.add(globe)

    // Rim stays facing the viewer; it does not turn with the globe.
    const rimPts = Array.from({ length: 129 }, (_, i) => {
      const t = (i / 128) * Math.PI * 2
      return new THREE.Vector3(cx + Math.cos(t) * (r + 6), -cy + Math.sin(t) * (r + 6), 0)
    })
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rimPts), new THREE.LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0.18 })))

    const earth = new THREE.Group()
    globe.add(earth)
    earth.add(new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), new THREE.MeshBasicMaterial({ color: JADE_PRESSED })))

    const gratMat = new THREE.LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0.2 })
    for (const line of graticule()) {
      earth.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(line.map((p) => v3(p, r * 1.001))), gratMat))
    }

    const coastMat = new THREE.LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0.6 })
    for (const line of COASTS) {
      earth.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(line.map((p) => v3(p, r * 1.002))), coastMat))
    }

    const route = arc(a, b)
    const split = Math.max(1, Math.round(progress * (route.length - 1)))
    // WebGL lines are always 1px, so the route is a thin tube (flown) and a row of dots (still to fly).
    const paperMat = new THREE.MeshBasicMaterial({ color: PAPER })
    const flownPts = route.slice(0, split + 1).map((p) => v3(p, r))
    if (flownPts.length > 1) {
      earth.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(flownPts), 48, 1.3, 6), paperMat))
    }
    const dotGeo = new THREE.SphereGeometry(1.3, 8, 6)
    route.slice(split).forEach((p, i) => {
      if (i % 2) return
      const dot = new THREE.Mesh(dotGeo, paperMat)
      dot.position.copy(v3(p, r))
      earth.add(dot)
    })

    // Airport pins: a ring and a dot lying on the surface.
    const pin = (v: Vec3) => {
      const g = new THREE.Group()
      const normal = v3(v)
      g.position.copy(normal.clone().multiplyScalar(r * 1.002))
      g.lookAt(normal.clone().multiplyScalar(r * 2))
      g.add(new THREE.Mesh(new THREE.RingGeometry(5.5, 7, 32), new THREE.MeshBasicMaterial({ color: PAPER, side: THREE.DoubleSide })))
      g.add(new THREE.Mesh(new THREE.CircleGeometry(3, 24), new THREE.MeshBasicMaterial({ color: PAPER, side: THREE.DoubleSide })))
      earth.add(g)
      return normal
    }
    const nFrom = pin(toVec(a))
    const nTo = pin(toVec(b))

    // Plane: a flat arrowhead on the arc, pointing along the route.
    const shape = new THREE.Shape([new THREE.Vector2(9, 0), new THREE.Vector2(-6, -6), new THREE.Vector2(-3, 0), new THREE.Vector2(-6, 6)])
    const plane = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: PAPER, side: THREE.DoubleSide }))
    const i = Math.min(route.length - 2, Math.max(1, split))
    const here = v3(route[i], r)
    const next = v3(route[i + 1], r)
    plane.position.copy(here)
    const up = here.clone().normalize()
    const fwd = next.clone().sub(here).normalize()
    const side = new THREE.Vector3().crossVectors(up, fwd)
    plane.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(fwd, side, up))
    earth.add(plane)

    // View state: base orientation from the shared layout, plus the user's drag.
    let lat = view.lat
    let lon = view.lon
    let vLat = 0
    let vLon = 0
    let raf = 0

    const place = (label: HTMLSpanElement | null, n: THREE.Vector3, dx: number, dy: number) => {
      if (!label) return
      const w = n.clone().applyQuaternion(earth.getWorldQuaternion(new THREE.Quaternion()))
      const x = cx + w.x * r
      const y = cy - w.y * r
      label.style.transform = `translate(${x + dx}px, ${y + dy}px) translate(-50%, -50%)`
      label.style.opacity = w.z > 0.15 ? '1' : '0'
    }

    const draw = () => {
      earth.rotation.set(lat * RAD, -lon * RAD, 0, 'XYZ')
      renderer.render(scene, camera)
      place(labelFrom.current, nFrom, -30, -2)
      place(labelTo.current, nTo, 6, -22)
    }

    const coast = () => {
      lat += vLat
      lon += vLon
      lat = Math.max(view.lat - 30, Math.min(view.lat + 30, lat))
      vLat *= 0.92
      vLon *= 0.92
      draw()
      if (Math.abs(vLat) + Math.abs(vLon) > 0.05) raf = requestAnimationFrame(coast)
      else settleBack()
    }

    // After a spin, ease back so the route is always where the child left it.
    const settleBack = () => {
      const fromLat = lat
      const fromLon = lon
      const dLon = ((((view.lon - lon) % 360) + 540) % 360) - 180
      const t0 = performance.now()
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 900)
        const e = 1 - Math.pow(1 - k, 3)
        lat = fromLat + (view.lat - fromLat) * e
        lon = fromLon + dLon * e
        draw()
        raf = k < 1 ? requestAnimationFrame(step) : 0
      }
      raf = requestAnimationFrame(step)
    }

    let dragging: { x: number; y: number } | null = null
    const canvas = renderer.domElement
    const onDown = (e: PointerEvent) => {
      setDragged(true)
      dragging = { x: e.clientX, y: e.clientY }
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - dragging.x
      const dy = e.clientY - dragging.y
      dragging = { x: e.clientX, y: e.clientY }
      // Horizontal drags turn the globe; vertical ones tilt it a little (page scroll stays with pan-y).
      vLon = -dx * 0.18
      vLat = -dy * 0.12
      lon += vLon
      lat = Math.max(view.lat - 30, Math.min(view.lat + 30, lat + vLat))
      draw()
    }
    const onUp = () => {
      if (!dragging) return
      dragging = null
      if (!raf) raf = requestAnimationFrame(coast)
    }
    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    draw()

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.Material | undefined
        mat?.dispose()
      })
      renderer.dispose()
      canvas.remove()
    }
  }, [from, to, progress, width, height, layout])

  const label = 'pointer-events-none absolute top-0 left-0 font-mono text-[13px] leading-none font-semibold tracking-[0.04em] text-paper'
  return (
    <div ref={host} className="relative cursor-grab active:cursor-grabbing" style={{ width, height }}>
      <span ref={labelFrom} className={label}>
        {from}
      </span>
      <span ref={labelTo} className={label}>
        {to}
      </span>
      <p
        className="pointer-events-none absolute top-[170px] right-5 max-w-[150px] text-right text-small text-paper/80 transition-opacity duration-300"
        style={{ opacity: dragged ? 0 : 1 }}
      >
        Drag to spin your route
      </p>
    </div>
  )
}
