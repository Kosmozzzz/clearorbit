import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { useLanguage } from '../i18n/LanguageContext'
import { makeBodies, shatter, START_BODIES, step, type Body } from '../utils/cascadeSim'
import { mulberry32 } from '../utils/screening/random'
import { fitCanvas } from './canvas'

const HISTORY = 120

/**
 * The domino effect, illustrated: satellites circle a planet; click to break one apart, and its fragments start
 * hitting the others. The simulation itself lives in utils/cascadeSim (tested); this component draws it.
 */
export function KesslerSim() {
  const { t } = useLanguage()
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()
  const bodies = useRef<Body[]>(makeBodies(1))
  const randRef = useRef(mulberry32(99))
  const collisionsRef = useRef(0)
  const historyRef = useRef<number[]>([START_BODIES])
  const [counts, setCounts] = useState({ objects: START_BODIES, collisions: 0, hist: [START_BODIES] })
  const [seed, setSeed] = useState(1)

  function reset() {
    const next = seed + 1
    bodies.current = makeBodies(next)
    collisionsRef.current = 0
    historyRef.current = [START_BODIES]
    setCounts({ objects: START_BODIES, collisions: 0, hist: [START_BODIES] })
    setSeed(next)
  }

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let frame = 0
    let last = performance.now()
    let sinceSample = 0

    function draw(now: number) {
      const fit = fitCanvas(canvas!)
      if (!fit) return
      const { ctx, w, h } = fit
      const dt = reduced ? 0 : Math.min(0.05, (now - last) / 1000)
      last = now

      if (dt > 0) {
        const r = step(bodies.current, dt, randRef.current)
        bodies.current = r.bodies
        collisionsRef.current += r.collisions
      }

      const cx = w / 2
      const cy = h / 2
      const half = Math.min(w, h) / 2
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(190,205,255,0.08)'
      for (const rr of [0.45, 0.65, 0.85]) {
        ctx.beginPath()
        ctx.arc(cx, cy, rr * half, 0, Math.PI * 2)
        ctx.stroke()
      }
      const g = ctx.createRadialGradient(cx - half * 0.1, cy - half * 0.1, half * 0.02, cx, cy, half * 0.3)
      g.addColorStop(0, '#6fcfff')
      g.addColorStop(1, '#0b2160')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, half * 0.3, 0, Math.PI * 2)
      ctx.fill()

      for (const b of bodies.current) {
        const x = cx + Math.cos(b.angle) * b.r * half
        const y = cy + Math.sin(b.angle) * b.r * half
        if (b.frag) {
          ctx.fillStyle = b.age < 0.8 ? '#ffd2a8' : '#ff7a3d'
          ctx.fillRect(x - 1, y - 1, 2, 2)
        } else {
          ctx.fillStyle = '#67e3ff'
          ctx.fillRect(x - 2, y - 2, 4, 4)
        }
      }

      sinceSample += dt
      if (sinceSample >= 0.25) {
        sinceSample = 0
        const hist = [...historyRef.current, bodies.current.length].slice(-HISTORY)
        historyRef.current = hist
        setCounts({ objects: bodies.current.length, collisions: collisionsRef.current, hist })
      }
      if (!reduced) frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [reduced, seed])

  function onClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = ref.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const half = Math.min(rect.width, rect.height) / 2
    const x = (event.clientX - rect.left - rect.width / 2) / half
    const y = (event.clientY - rect.top - rect.height / 2) / half
    // Break the intact satellite closest to the click.
    let best = -1
    let bestD = Infinity
    bodies.current.forEach((b, i) => {
      if (b.frag) return
      const d = (Math.cos(b.angle) * b.r - x) ** 2 + (Math.sin(b.angle) * b.r - y) ** 2
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    if (best < 0) return
    const born: Body[] = []
    shatter(bodies.current[best], randRef.current, born)
    bodies.current = bodies.current.filter((_, i) => i !== best).concat(born)
    collisionsRef.current++
    setCounts((c) => ({ ...c, objects: bodies.current.length, collisions: collisionsRef.current }))
  }

  const hist = counts.hist
  const maxH = Math.max(...hist, START_BODIES * 2)

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-square max-h-[560px] w-full sm:aspect-[16/10]">
        <canvas ref={ref} onClick={onClick} className="absolute inset-0 h-full w-full cursor-crosshair" role="img" aria-label={t.problem.cascade.hint} />
        <p className="pointer-events-none absolute left-1/2 top-4 w-max max-w-[90%] -translate-x-1/2 rounded-full border border-line bg-ink/70 px-4 py-1.5 text-center text-xs text-ice/80 backdrop-blur">{t.problem.cascade.hint}</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-6 border-t border-line p-5 sm:px-8">
        <div className="flex gap-8">
          <div>
            <p className="eyebrow !text-[0.62rem] !text-ice/55">{t.problem.cascade.objects}</p>
            <p className="display mt-1 text-3xl text-orbit">{counts.objects}</p>
          </div>
          <div>
            <p className="eyebrow !text-[0.62rem] !text-ice/55">{t.problem.cascade.collisions}</p>
            <p className="display mt-1 text-3xl text-flare">{counts.collisions}</p>
          </div>
        </div>
        <svg viewBox="0 0 120 40" className="h-10 w-40" aria-hidden="true">
          <polyline fill="none" stroke="#ff7a3d" strokeWidth="1.5" points={hist.map((v, i) => `${(i / (HISTORY - 1)) * 120},${40 - (v / maxH) * 38}`).join(' ')} />
        </svg>
        <button type="button" className="pill pill-ghost" onClick={reset}>
          {t.problem.cascade.reset}
        </button>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-ice/45 sm:px-8">{t.problem.cascade.sim}</p>
    </div>
  )
}
