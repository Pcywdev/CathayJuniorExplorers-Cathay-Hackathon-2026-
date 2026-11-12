import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export interface StampPressProps {
  width: number
  height: number
  // Increment to slam the stamp from outside (keyboard button).
  pressSignal: number
  onStamp: () => void
}

const PAPER = 0xfbfcfa
const JADE = 0x0e5e4e
const JADE_PRESSED = 0x0a4a3d
const STAMP = 0x2e4c9e

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeIn = (t: number) => t * t * t

type Phase = 'idle' | 'charge' | 'slam' | 'squash' | 'rest' | 'lift' | 'gone'

// A rubber stamp hovering over the passport page. Press and hold to lift it, let go to slam it down.
// Impact calls onStamp (the page then shows the inked SVG stamp); the stamp lifts away and the canvas stops rendering.
export default function StampPress3D({ width, height, pressSignal, onStamp }: StampPressProps) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<{ press: () => void; release: () => void } | null>(null)
  const firstSignal = useRef(pressSignal)
  const stampCb = useRef(onStamp)
  stampCb.current = onStamp

  useEffect(() => {
    const el = host.current
    if (!el || width === 0) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.domElement.style.display = 'block'
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100)
    camera.position.set(0, 12, 10.5)
    camera.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.8)
    sun.position.set(-3, 8, 5)
    scene.add(sun)

    const toon = (color: number) => new THREE.MeshToonMaterial({ color })

    // Stamp: inked oval rubber pad, Jade lacquered oval block with a Paper label band, darker neck and knob.
    const stamp = new THREE.Group()
    // Oval, like the impression it leaves: unit cylinders squashed into ellipses.
    const padGeo = new THREE.CylinderGeometry(1, 1, 0.14, 64)
    const pad = new THREE.Mesh(padGeo, toon(STAMP))
    pad.scale.set(2.1, 1, 1.36)
    pad.position.y = 0.07
    const blockGeo = new THREE.CylinderGeometry(1, 1, 0.5, 64)
    const block = new THREE.Mesh(blockGeo, toon(JADE))
    block.scale.set(2.2, 1, 1.45)
    block.position.y = 0.39
    // a Paper label band around the block, where a real stamp names its mark
    const bandGeo = new THREE.CylinderGeometry(1.004, 1.004, 0.16, 64, 1, true)
    const band = new THREE.Mesh(bandGeo, toon(PAPER))
    block.add(band)
    const neckGeo = new THREE.CylinderGeometry(0.42, 0.6, 1.1, 24)
    const neck = new THREE.Mesh(neckGeo, toon(JADE_PRESSED))
    neck.position.y = 1.19
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 20), toon(JADE_PRESSED))
    knob.position.y = 2.2
    knob.scale.y = 0.85
    stamp.add(pad, block, neck, knob)
    stamp.rotation.y = -0.18
    scene.add(stamp)

    const HOVER = 1.5
    const HIGH = 2.3
    let phase: Phase = 'idle'
    let t0 = performance.now()
    let from = HOVER
    let raf = 0

    const set = (p: Phase) => {
      phase = p
      t0 = performance.now()
      from = stamp.position.y
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const tick = (now: number) => {
      raf = 0
      const t = now - t0
      if (phase === 'charge') {
        const k = easeOut(Math.min(1, t / 380))
        stamp.position.y = from + (HIGH - from) * k
        stamp.rotation.z = Math.sin(t / 40) * 0.015 * k
      } else if (phase === 'slam') {
        const k = easeIn(Math.min(1, t / 140))
        stamp.position.y = from * (1 - k)
        stamp.rotation.z = 0
        if (k >= 1) {
          stampCb.current()
          set('squash')
        }
      } else if (phase === 'squash') {
        const k = Math.min(1, t / 160)
        stamp.scale.y = 1 - 0.12 * Math.sin(Math.PI * k)
        stamp.scale.x = stamp.scale.z = 1 + 0.05 * Math.sin(Math.PI * k)
        if (k >= 1) set('rest')
      } else if (phase === 'rest') {
        if (t > 260) set('lift')
      } else if (phase === 'lift') {
        const k = easeOut(Math.min(1, t / 600))
        stamp.position.y = 7 * k
        stamp.position.x = 3.2 * k
        stamp.rotation.z = -0.5 * k
        // tip it as it leaves so the inked oval face shows
        stamp.rotation.x = 0.9 * k
        if (k >= 1) {
          phase = 'gone'
          stamp.visible = false
        }
      }
      renderer.render(scene, camera)
      if (phase === 'charge' && t < 380) raf = requestAnimationFrame(tick)
      else if (phase === 'slam' || phase === 'squash' || phase === 'rest' || phase === 'lift') raf = requestAnimationFrame(tick)
    }

    stamp.position.y = HOVER
    renderer.render(scene, camera)

    api.current = {
      press: () => {
        if (phase === 'idle') set('charge')
      },
      release: () => {
        if (phase === 'idle' || phase === 'charge') set('slam')
      },
    }

    return () => {
      cancelAnimationFrame(raf)
      api.current = null
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        ;(m.material as THREE.Material | undefined)?.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [width, height])

  useEffect(() => {
    if (pressSignal !== firstSignal.current) api.current?.release()
  }, [pressSignal])

  return (
    <div
      ref={host}
      className="absolute inset-0 cursor-pointer touch-none select-none"
      onPointerDown={() => api.current?.press()}
      onPointerUp={() => api.current?.release()}
      onPointerCancel={() => api.current?.release()}
      aria-hidden="true"
    />
  )
}
