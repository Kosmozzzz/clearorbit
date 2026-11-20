import { DEG, hohmannDv, planeChangeDv } from './screening/orbit.ts'

/**
 * Clean-up mission planner. A servicing spacecraft visits several large derelict objects in turn; the order decides
 * how much Δv (and so propellant) the trip needs. Three ways to choose the order are compared: the visitor's own
 * order, nearest-neighbour (greedy), and the best order found by trying every permutation.
 *
 * Simplification stated on the page: the right ascension of the node is assumed to be matched for free by waiting for
 * Earth's oblateness (J2) to drift the planes together, as real multi-target studies do, so a hop costs a Hohmann
 * altitude change plus an inclination change.
 */

export interface Target {
  id: string
  /** Kind of object, used for the label and icon. */
  kind: 'rocketBody' | 'deadSat' | 'adapter'
  alt: number
  /** Inclination, degrees. */
  inc: number
  /** Mass, kg — what a capture must handle. */
  mass: number
}

/**
 * Ten illustrative targets. Altitudes, inclinations and masses follow the clusters of large derelicts described in
 * the ESA Space Environment Report (spent upper stages near 800–850 km at 71–74° and near 98° sun-synchronous);
 * they are not real catalogue entries.
 */
export const TARGETS: readonly Target[] = [
  { id: 'T1', kind: 'rocketBody', alt: 840, inc: 71.0, mass: 8900 },
  { id: 'T2', kind: 'rocketBody', alt: 850, inc: 71.0, mass: 8900 },
  { id: 'T3', kind: 'rocketBody', alt: 760, inc: 74.0, mass: 1400 },
  { id: 'T4', kind: 'deadSat', alt: 780, inc: 98.5, mass: 2200 },
  { id: 'T5', kind: 'deadSat', alt: 800, inc: 98.6, mass: 1100 },
  { id: 'T6', kind: 'rocketBody', alt: 640, inc: 98.0, mass: 2000 },
  { id: 'T7', kind: 'adapter', alt: 720, inc: 98.2, mass: 110 },
  { id: 'T8', kind: 'deadSat', alt: 960, inc: 82.9, mass: 850 },
  { id: 'T9', kind: 'rocketBody', alt: 990, inc: 82.9, mass: 1400 },
  { id: 'T10', kind: 'deadSat', alt: 550, inc: 53.0, mass: 260 },
]

/** Where the servicer starts: a typical rideshare drop-off orbit. */
export const START = { alt: 550, inc: 97.5 }

/** Δv of one hop, m/s: plane change done at the higher (slower) orbit, plus the Hohmann transfer. */
export function hopDv(from: { alt: number; inc: number }, to: { alt: number; inc: number }): number {
  const angle = Math.abs(from.inc - to.inc) * DEG
  const high = Math.max(from.alt, to.alt)
  return (hohmannDv(from.alt, to.alt) + planeChangeDv(high, angle)) * 1000
}

export function routeDv(order: readonly Target[], start = START): number {
  let total = 0
  let at: { alt: number; inc: number } = start
  for (const t of order) {
    total += hopDv(at, t)
    at = t
  }
  return total
}

/** Nearest-neighbour: always go to the cheapest unvisited target next. */
export function greedyRoute(targets: readonly Target[], start = START): Target[] {
  const left = [...targets]
  const route: Target[] = []
  let at: { alt: number; inc: number } = start
  while (left.length) {
    let best = 0
    for (let k = 1; k < left.length; k++) if (hopDv(at, left[k]) < hopDv(at, left[best])) best = k
    const [next] = left.splice(best, 1)
    route.push(next)
    at = next
  }
  return route
}

/** Largest selection for which every order is tried (8! = 40,320 orders). */
export const EXHAUSTIVE_LIMIT = 8

/** The cheapest order, by trying every permutation (Heap's algorithm). Only for small selections. */
export function optimalRoute(targets: readonly Target[], start = START): Target[] {
  if (targets.length > EXHAUSTIVE_LIMIT) throw new Error(`optimalRoute is limited to ${EXHAUSTIVE_LIMIT} targets`)
  const a = [...targets]
  let best = [...a]
  let bestDv = routeDv(a, start)
  const c = new Array(a.length).fill(0)
  let i = 0
  while (i < a.length) {
    if (c[i] < i) {
      const j = i % 2 === 0 ? 0 : c[i]
      ;[a[j], a[i]] = [a[i], a[j]]
      const dv = routeDv(a, start)
      if (dv < bestDv) {
        bestDv = dv
        best = [...a]
      }
      c[i]++
      i = 0
    } else {
      c[i] = 0
      i++
    }
  }
  return best
}

/**
 * Servicer used for the propellant figure: 800 kg dry, chemical engine with Isp 300 s (bipropellant).
 * The propellant also has to push each captured object down to re-entry; that is excluded here and stated on the page.
 */
export const SERVICER = { dry: 800, isp: 300 }

/** Propellant (kg) for a route of `dv` m/s, by the rocket equation solved for the wet mass from the dry mass. */
export function routePropellant(dvMs: number): number {
  return SERVICER.dry * (Math.exp(dvMs / (SERVICER.isp * 9.80665)) - 1)
}
