import { stateAt, R_EARTH, type CircularOrbit, type Vec3 } from '../utils/screening/orbit'
import type { PopulationClass } from '../utils/screening/population'

export const KIND_COLORS: Record<PopulationClass, string> = {
  constellation: '#67e3ff',
  sunSync: '#b9a8ff',
  debris: '#ff7a3d',
  other: '#dbe6ff',
}

/** Sizes a canvas to its CSS box at the device pixel ratio and returns the drawing context and CSS size. */
export function fitCanvas(canvas: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; w: number; h: number } | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.max(1, Math.round(rect.width))
  const h = Math.max(1, Math.round(rect.height))
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr
    canvas.height = h * dpr
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w, h }
}

export interface View {
  /** Centre of the Earth on screen, px. */
  cx: number
  cy: number
  /** Earth radius on screen, px. */
  R: number
  /** Spin of the scene around the polar axis, rad. */
  spin: number
  /** Tilt of the camera above the equator, rad. */
  tilt: number
  /** Altitudes are multiplied by this so thin shells are visible. */
  altScale: number
}

export interface Projected {
  x: number
  y: number
  /** Positive when the point is on the far side of the Earth's centre. */
  depth: number
  hidden: boolean
}

/** Orthographic projection of an inertial position (km) to the screen. */
export function project(p: Vec3, alt: number, v: View): Projected {
  const r = Math.hypot(p.x, p.y, p.z) || 1
  const scale = ((R_EARTH + alt * v.altScale) / r) * (v.R / R_EARTH)
  const cs = Math.cos(v.spin)
  const ss = Math.sin(v.spin)
  const x1 = (p.x * cs - p.y * ss) * scale
  const y1 = (p.x * ss + p.y * cs) * scale
  const z1 = p.z * scale
  const ct = Math.cos(v.tilt)
  const st = Math.sin(v.tilt)
  const sx = x1
  const sy = -(z1 * ct - y1 * st)
  const depth = y1 * ct + z1 * st
  const hidden = depth > 0 && sx * sx + sy * sy < v.R * v.R
  return { x: v.cx + sx, y: v.cy + sy, depth, hidden }
}

const tmp = { r: { x: 0, y: 0, z: 0 } as Vec3, v: { x: 0, y: 0, z: 0 } as Vec3 }

export function projectOrbit(o: CircularOrbit, t: number, v: View): Projected {
  stateAt(o, t, tmp)
  return project(tmp.r, o.alt, v)
}

/** Draws the Earth: a lit sphere with an atmosphere glow. */
export function drawEarth(ctx: CanvasRenderingContext2D, v: View): void {
  const glow = ctx.createRadialGradient(v.cx, v.cy, v.R * 0.9, v.cx, v.cy, v.R * 1.35)
  glow.addColorStop(0, 'rgba(103, 227, 255, 0.28)')
  glow.addColorStop(1, 'rgba(103, 227, 255, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(v.cx, v.cy, v.R * 1.35, 0, Math.PI * 2)
  ctx.fill()

  const body = ctx.createRadialGradient(v.cx - v.R * 0.4, v.cy - v.R * 0.45, v.R * 0.1, v.cx, v.cy, v.R)
  body.addColorStop(0, '#7fd6ff')
  body.addColorStop(0.35, '#2463d6')
  body.addColorStop(0.75, '#0d2a6b')
  body.addColorStop(1, '#050b22')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.arc(v.cx, v.cy, v.R, 0, Math.PI * 2)
  ctx.fill()

  // Faint latitude lines give the sphere some structure.
  ctx.save()
  ctx.beginPath()
  ctx.arc(v.cx, v.cy, v.R, 0, Math.PI * 2)
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth = 1
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = v.cy - Math.sin((lat * Math.PI) / 180) * v.R * Math.cos(v.tilt)
    const rx = Math.cos((lat * Math.PI) / 180) * v.R
    ctx.beginPath()
    ctx.ellipse(v.cx, y, rx, rx * Math.sin(v.tilt) + 0.01, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

/** Seeded star field, drawn once per frame from fixed positions. */
export function makeStars(count: number, seed = 42): { x: number; y: number; r: number; a: number }[] {
  let s = seed
  const rand = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  return Array.from({ length: count }, () => ({ x: rand(), y: rand(), r: rand() * 1.2 + 0.2, a: rand() * 0.6 + 0.2 }))
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: ReturnType<typeof makeStars>, w: number, h: number): void {
  for (const st of stars) {
    ctx.fillStyle = `rgba(255,255,255,${st.a})`
    ctx.fillRect(st.x * w, st.y * h, st.r, st.r)
  }
}
