import { mulberry32 } from './screening/random.ts'

/**
 * The 2D "domino effect" toy behind the Kessler illustration on the Problem page. Pure functions, so the chain
 * reaction can be tested without a screen. Distances are in units of the scene's half-size.
 */

export interface Body {
  /** Orbit radius as a share of the scene's half-size. */
  r: number
  angle: number
  /** Angular speed, rad/s; the sign is the direction. */
  w: number
  frag: boolean
  /** Seconds since it was created; fresh fragments cannot collide with their siblings straight away. */
  age: number
}

export const START_BODIES = 70
export const MAX_BODIES = 1400
/** Collision distance as a share of the half-size (greatly exaggerated so the chain is visible). */
export const HIT = 0.02
const SIBLING_GRACE = 0.6
/** Chance that a close pass is a real hit, for crossing and for same-direction passes. */
export const HIT_CHANCE = 0.07
export const HIT_CHANCE_SAME = 0.02
/** Share of fragments thrown onto a crossing path (most keep moving the way their parent did). */
export const FLIP = 0.15

/** Kepler's third law in scene units: ω ∝ r^(−3/2). */
export function speedFor(r: number): number {
  return 0.55 * Math.pow(r / 0.6, -1.5)
}

export function makeBodies(seed: number, count = START_BODIES): Body[] {
  const rand = mulberry32(seed)
  return Array.from({ length: count }, () => {
    const r = 0.42 + rand() * 0.5
    return { r, angle: rand() * Math.PI * 2, w: speedFor(r) * (rand() < 0.3 ? -1 : 1), frag: false, age: 99 }
  })
}

/** Splits a body into fragments scattered around its orbit; appends them to `out`. */
export function shatter(b: Body, rand: () => number, out: Body[]): void {
  const n = 5 + Math.floor(rand() * 6)
  for (let k = 0; k < n; k++) {
    const r = Math.min(0.96, Math.max(0.36, b.r + (rand() - 0.5) * 0.2))
    out.push({ r, angle: b.angle + (rand() - 0.5) * 0.5, w: speedFor(r) * Math.sign(b.w) * (rand() < FLIP ? -1 : 1), frag: true, age: 0 })
  }
}

/**
 * Advances the scene by dt seconds and resolves collisions. Bodies are bucketed in a 2D grid so only neighbours are
 * compared — the same idea as the spatial hash grid in the research. Returns the new list and how many collisions
 * happened.
 */
export function step(list: Body[], dt: number, rand: () => number): { bodies: Body[]; collisions: number } {
  for (const b of list) {
    b.angle += b.w * dt
    b.age += dt
  }
  const pos = list.map((b) => ({ x: Math.cos(b.angle) * b.r, y: Math.sin(b.angle) * b.r }))
  const buckets = new Map<number, number[]>()
  pos.forEach((p, i) => {
    const key = Math.floor((p.x + 1) / HIT) * 4096 + Math.floor((p.y + 1) / HIT)
    const arr = buckets.get(key)
    if (arr) arr.push(i)
    else buckets.set(key, [i])
  })

  const dead = new Set<number>()
  const born: Body[] = []
  let collisions = 0
  for (const [key, members] of buckets) {
    // This cell and the half of its neighbours "ahead" of it, so each pair of cells is visited once.
    for (const nk of [key, key + 1, key + 4096, key + 4097, key + 4095]) {
      const other = nk === key ? members : buckets.get(nk)
      if (!other) continue
      for (const i of members) {
        for (const j of other) {
          if (nk === key && j <= i) continue
          if (dead.has(i) || dead.has(j)) continue
          // Only a fragment striking an intact object makes new debris: intact objects never start the chain, and
          // tiny fragments hitting each other produce nothing large enough to matter.
          if (list[i].frag === list[j].frag) continue
          const target = list[i].frag ? j : i
          const a = list[i]
          const b = list[j]
          if (a.age < SIBLING_GRACE && b.age < SIBLING_GRACE) continue
          const dx = pos[i].x - pos[j].x
          const dy = pos[i].y - pos[j].y
          if (dx * dx + dy * dy > HIT * HIT) continue
          // Passing close is not always a hit; same-direction passes are slow and rarely destructive.
          if (rand() > (a.w * b.w > 0 ? HIT_CHANCE_SAME : HIT_CHANCE)) continue
          dead.add(target)
          collisions++
          if (list.length + born.length < MAX_BODIES) shatter(list[target], rand, born)
        }
      }
    }
  }
  if (!dead.size && !born.length) return { bodies: list, collisions: 0 }
  return { bodies: list.filter((_, i) => !dead.has(i)).concat(born), collisions }
}
