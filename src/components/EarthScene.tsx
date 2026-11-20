import { useEffect, useMemo, useRef } from 'react'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { makePopulation } from '../utils/screening/population'
import { drawEarth, drawStars, fitCanvas, KIND_COLORS, makeStars, projectOrbit, type View } from './canvas'

const COLORS = KIND_COLORS

interface EarthSceneProps {
  /** Number of objects to draw. */
  count?: number
  /** Where the Earth sits horizontally, as a share of the width. */
  centerX?: number
  className?: string
}

/**
 * The hero scene: the Earth and a synthetic catalogue of objects on their real-shaped orbits (the same generator the
 * research uses). Altitudes are stretched so the shells are visible. Still frame for reduced motion.
 */
export function EarthScene({ count = 600, centerX = 0.68, className = '' }: EarthSceneProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()
  const objects = useMemo(() => makePopulation(count, 7), [count])
  const stars = useMemo(() => makeStars(260), [])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let frame = 0
    const start = performance.now()

    function draw(now: number) {
      const fit = fitCanvas(canvas!)
      if (!fit) return
      const { ctx, w, h } = fit
      const t = ((now - start) / 1000) * 60 // one minute of orbit per second
      const narrow = w < 700
      const view: View = {
        cx: w * (narrow ? 0.5 : centerX),
        cy: h * (narrow ? 0.22 : 0.55),
        R: Math.min(w, h) * (narrow ? 0.24 : 0.22),
        spin: t * 0.00002 + 0.4,
        tilt: 0.38,
        altScale: 3.2,
      }
      ctx.clearRect(0, 0, w, h)
      drawStars(ctx, stars, w, h)

      // Objects behind the Earth first, then the Earth, then objects in front.
      const points = objects.map((o) => ({ o, p: projectOrbit(o, t, view) }))
      for (const { o, p } of points) {
        if (p.depth <= 0 || p.hidden) continue
        ctx.fillStyle = COLORS[o.kind]
        ctx.globalAlpha = 0.45
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2)
      }
      ctx.globalAlpha = 1
      drawEarth(ctx, view)
      for (const { o, p } of points) {
        if (p.depth > 0) continue
        ctx.fillStyle = COLORS[o.kind]
        ctx.globalAlpha = 0.95
        const s = o.kind === 'debris' ? 2.4 : 2
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
      }
      ctx.globalAlpha = 1
      if (!reduced) frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    const onResize = () => {
      if (reduced) requestAnimationFrame(draw)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [objects, stars, reduced, centerX])

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden="true" />
}
