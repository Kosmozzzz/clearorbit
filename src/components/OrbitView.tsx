import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { stateAt, type Vec3 } from '../utils/screening/orbit'
import type { CatalogueObject } from '../utils/screening/population'
import type { Conjunction } from '../utils/screening/screen'
import { drawEarth, drawStars, fitCanvas, KIND_COLORS, makeStars, project, projectOrbit, type View } from './canvas'

const stars = makeStars(160, 7)

/**
 * The catalogue at t = 0, slowly turning, with every close approach found by the screener marked where it happens
 * (midpoint of the two objects at the time of closest approach).
 */
export function OrbitView({ objects, events }: { objects: readonly CatalogueObject[]; events: readonly Conjunction[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    // Where each conjunction happens, in the inertial frame.
    const a = { r: { x: 0, y: 0, z: 0 } as Vec3, v: { x: 0, y: 0, z: 0 } as Vec3 }
    const b = { r: { x: 0, y: 0, z: 0 } as Vec3, v: { x: 0, y: 0, z: 0 } as Vec3 }
    const marks = events.map((e) => {
      stateAt(objects[e.a], e.tca, a)
      stateAt(objects[e.b], e.tca, b)
      return { p: { x: (a.r.x + b.r.x) / 2, y: (a.r.y + b.r.y) / 2, z: (a.r.z + b.r.z) / 2 }, alt: (objects[e.a].alt + objects[e.b].alt) / 2 }
    })

    let frame = 0
    const start = performance.now()
    function draw(now: number) {
      const fit = fitCanvas(canvas!)
      if (!fit) return
      const { ctx, w, h } = fit
      const spin = reduced ? 0.5 : 0.5 + (now - start) * 0.00006
      const view: View = { cx: w / 2, cy: h / 2, R: Math.min(w, h) * 0.26, spin, tilt: 0.42, altScale: 3 }
      ctx.clearRect(0, 0, w, h)
      drawStars(ctx, stars, w, h)
      const pts = objects.map((o) => ({ o, p: projectOrbit(o, 0, view) }))
      for (const { o, p } of pts) {
        if (p.depth <= 0 || p.hidden) continue
        ctx.fillStyle = KIND_COLORS[o.kind]
        ctx.globalAlpha = 0.35
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2)
      }
      ctx.globalAlpha = 1
      drawEarth(ctx, view)
      for (const { o, p } of pts) {
        if (p.depth > 0) continue
        ctx.fillStyle = KIND_COLORS[o.kind]
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2)
      }
      ctx.lineWidth = 1.5
      for (const m of marks) {
        const p = project(m.p, m.alt, view)
        if (p.hidden) continue
        ctx.strokeStyle = p.depth > 0 ? 'rgba(255,77,109,0.45)' : '#ff4d6d'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (!reduced) frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [objects, events, reduced])

  return <canvas ref={ref} className="block h-full w-full" aria-hidden="true" />
}
