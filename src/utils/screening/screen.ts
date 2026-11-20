import { circularSpeed, radiusOf, stateAt, type CircularOrbit, type Vec3 } from './orbit.ts'

/**
 * Conjunction screening: which pairs of objects come closer than a threshold during a time window?
 *
 * All three methods share the same definition of an event, so their results can be compared exactly:
 *   1. Time is sampled every `step` seconds.
 *   2. A pair is a candidate at a sample if its distance is within threshold + vRelMax·step (it could close that gap
 *      before the next sample).
 *   3. For a candidate, the closest approach inside the step is found with straight-line relative motion.
 *   4. A pair is reported once, at its closest approach over the whole window.
 * The methods differ only in how many pairs they look at — which is what the research measures.
 */

export type MethodId = 'brute' | 'apogee' | 'grid'
export const METHODS: readonly MethodId[] = ['brute', 'apogee', 'grid']

export interface ScreenOptions {
  /** Miss-distance threshold, km. */
  threshold: number
  /** Length of the screening window, s. */
  window: number
  /** Sampling step, s. */
  step: number
}

export const DEFAULT_OPTIONS: ScreenOptions = { threshold: 10, window: 5400, step: 20 }

export interface Conjunction {
  a: number
  b: number
  /** Time of closest approach, s from the start of the window. */
  tca: number
  /** Miss distance, km. */
  miss: number
}

export interface ScreenResult {
  method: MethodId
  events: Conjunction[]
  /** Pair distance computations made inside the time loop. */
  pairChecks: number
  /** One-off pair comparisons made before the time loop (the apogee–perigee filter). */
  prefilterChecks: number
}

/** An upper bound on how fast any two objects in the catalogue can approach each other (head-on at the lowest altitude). */
export function maxRelativeSpeed(objects: readonly CircularOrbit[]): number {
  let minAlt = Infinity
  for (const o of objects) minAlt = Math.min(minAlt, o.alt)
  return objects.length ? 2 * circularSpeed(minAlt) : 0
}

interface States {
  px: Float64Array
  py: Float64Array
  pz: Float64Array
  vx: Float64Array
  vy: Float64Array
  vz: Float64Array
}

function allocate(n: number): States {
  return { px: new Float64Array(n), py: new Float64Array(n), pz: new Float64Array(n), vx: new Float64Array(n), vy: new Float64Array(n), vz: new Float64Array(n) }
}

function propagateAll(objects: readonly CircularOrbit[], t: number, s: States): void {
  const tmp = { r: { x: 0, y: 0, z: 0 } as Vec3, v: { x: 0, y: 0, z: 0 } as Vec3 }
  for (let i = 0; i < objects.length; i++) {
    stateAt(objects[i], t, tmp)
    s.px[i] = tmp.r.x
    s.py[i] = tmp.r.y
    s.pz[i] = tmp.r.z
    s.vx[i] = tmp.v.x
    s.vy[i] = tmp.v.y
    s.vz[i] = tmp.v.z
  }
}

/** Keeps the closest approach found so far for each pair. */
class EventBook {
  private best = new Map<number, Conjunction>()
  private readonly n: number
  constructor(n: number) {
    this.n = n
  }
  offer(a: number, b: number, tca: number, miss: number): void {
    const key = a * this.n + b
    const prev = this.best.get(key)
    if (!prev || miss < prev.miss) this.best.set(key, { a, b, tca, miss })
  }
  list(): Conjunction[] {
    return [...this.best.values()].sort((x, y) => x.a - y.a || x.b - y.b)
  }
}

/**
 * Tests pair (i, j) at the sample starting at time t. Returns nothing; records an event if the closest approach
 * inside [t, t + step] is within the threshold.
 */
function checkPair(i: number, j: number, s: States, t: number, step: number, threshold: number, gate2: number, book: EventBook): void {
  const rx = s.px[j] - s.px[i]
  const ry = s.py[j] - s.py[i]
  const rz = s.pz[j] - s.pz[i]
  const d2 = rx * rx + ry * ry + rz * rz
  if (d2 > gate2) return
  const vx = s.vx[j] - s.vx[i]
  const vy = s.vy[j] - s.vy[i]
  const vz = s.vz[j] - s.vz[i]
  const v2 = vx * vx + vy * vy + vz * vz
  let tau = v2 > 0 ? -(rx * vx + ry * vy + rz * vz) / v2 : 0
  if (tau < 0) tau = 0
  else if (tau > step) tau = step
  const mx = rx + vx * tau
  const my = ry + vy * tau
  const mz = rz + vz * tau
  const miss = Math.sqrt(mx * mx + my * my + mz * mz)
  if (miss <= threshold) book.offer(i < j ? i : j, i < j ? j : i, t + tau, miss)
}

function sampleTimes(opts: ScreenOptions): number[] {
  const times: number[] = []
  for (let t = 0; t < opts.window; t += opts.step) times.push(t)
  return times
}

/** Method A — every pair at every sample. The reference: nothing can be missed that the shared definition would catch. */
export function screenBrute(objects: readonly CircularOrbit[], opts: ScreenOptions = DEFAULT_OPTIONS): ScreenResult {
  const n = objects.length
  const s = allocate(n)
  const book = new EventBook(n)
  const gate = opts.threshold + maxRelativeSpeed(objects) * opts.step
  const gate2 = gate * gate
  let pairChecks = 0
  for (const t of sampleTimes(opts)) {
    propagateAll(objects, t, s)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        pairChecks++
        checkPair(i, j, s, t, opts.step, opts.threshold, gate2, book)
      }
    }
  }
  return { method: 'brute', events: book.list(), pairChecks, prefilterChecks: 0 }
}

/**
 * Method B — the classical apogee–perigee filter (Hoots, Crawford & Roehrich, 1984). For circular orbits the two
 * objects can never be closer than the difference of their radii, so pairs whose shells are further apart than the
 * threshold are dropped once, before the time loop. Exact: it cannot remove a pair that would produce an event.
 */
export function screenApogee(objects: readonly CircularOrbit[], opts: ScreenOptions = DEFAULT_OPTIONS): ScreenResult {
  const n = objects.length
  const s = allocate(n)
  const book = new EventBook(n)
  const gate = opts.threshold + maxRelativeSpeed(objects) * opts.step
  const gate2 = gate * gate

  // Sort by radius so the surviving pairs can be listed without testing all n² of them one by one.
  const order = objects.map((_, i) => i).sort((a, b) => objects[a].alt - objects[b].alt)
  const pairsA: number[] = []
  const pairsB: number[] = []
  let prefilterChecks = 0
  for (let x = 0; x < n; x++) {
    const i = order[x]
    const ri = radiusOf(objects[i].alt)
    for (let y = x + 1; y < n; y++) {
      const j = order[y]
      prefilterChecks++
      if (radiusOf(objects[j].alt) - ri > opts.threshold) break
      pairsA.push(i)
      pairsB.push(j)
    }
  }

  let pairChecks = 0
  for (const t of sampleTimes(opts)) {
    propagateAll(objects, t, s)
    for (let k = 0; k < pairsA.length; k++) {
      pairChecks++
      checkPair(pairsA[k], pairsB[k], s, t, opts.step, opts.threshold, gate2, book)
    }
  }
  return { method: 'apogee', events: book.list(), pairChecks, prefilterChecks }
}

/** The 13 neighbouring cells "ahead" of a cell; together with the cell itself they cover every adjacent pair exactly once. */
const HALF_NEIGHBOURS: readonly [number, number, number][] = (() => {
  const list: [number, number, number][] = []
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dz = -1; dz <= 1; dz++) {
        if (dx > 0 || (dx === 0 && dy > 0) || (dx === 0 && dy === 0 && dz > 0)) list.push([dx, dy, dz])
      }
  return list
})()

/**
 * Packs three cell indices into one exact integer key (below 2^48, well inside a double's 2^53).
 * Each index must stay within ±32,767, which holds for any cell wider than 0.25 km around low Earth orbit.
 */
export function cellKey(cx: number, cy: number, cz: number): number {
  return (cx + 32768) * 4294967296 + (cy + 32768) * 65536 + (cz + 32768)
}

/** Narrowest grid cell allowed, km, so cell indices stay inside the range `cellKey` can pack. */
const MIN_CELL = 1

/**
 * Method C — a uniform spatial hash grid. At each sample, objects are dropped into cubic cells as wide as the
 * candidate gate, so any two objects within the gate sit in the same or neighbouring cells. Only those pairs are
 * measured. Exact for the shared definition, and the work grows with the number of nearby pairs instead of n².
 */
export function screenGrid(objects: readonly CircularOrbit[], opts: ScreenOptions = DEFAULT_OPTIONS): ScreenResult {
  const n = objects.length
  const s = allocate(n)
  const book = new EventBook(n)
  const gate = opts.threshold + maxRelativeSpeed(objects) * opts.step
  const gate2 = gate * gate
  const cell = Math.max(gate, MIN_CELL)
  let pairChecks = 0

  const cx = new Int32Array(n)
  const cy = new Int32Array(n)
  const cz = new Int32Array(n)

  for (const t of sampleTimes(opts)) {
    propagateAll(objects, t, s)
    const cells = new Map<number, number[]>()
    for (let i = 0; i < n; i++) {
      cx[i] = Math.floor(s.px[i] / cell)
      cy[i] = Math.floor(s.py[i] / cell)
      cz[i] = Math.floor(s.pz[i] / cell)
      const key = cellKey(cx[i], cy[i], cz[i])
      const bucket = cells.get(key)
      if (bucket) bucket.push(i)
      else cells.set(key, [i])
    }
    for (const members of cells.values()) {
      // Pairs inside the cell.
      for (let a = 0; a < members.length; a++) {
        for (let b = a + 1; b < members.length; b++) {
          pairChecks++
          checkPair(members[a], members[b], s, t, opts.step, opts.threshold, gate2, book)
        }
      }
      // Pairs with the half of the neighbourhood ahead of this cell.
      const first = members[0]
      for (const [dx, dy, dz] of HALF_NEIGHBOURS) {
        const other = cells.get(cellKey(cx[first] + dx, cy[first] + dy, cz[first] + dz))
        if (!other) continue
        for (const i of members) {
          for (const j of other) {
            pairChecks++
            checkPair(i, j, s, t, opts.step, opts.threshold, gate2, book)
          }
        }
      }
    }
  }
  return { method: 'grid', events: book.list(), pairChecks, prefilterChecks: 0 }
}

export function screen(method: MethodId, objects: readonly CircularOrbit[], opts: ScreenOptions = DEFAULT_OPTIONS): ScreenResult {
  if (method === 'brute') return screenBrute(objects, opts)
  if (method === 'apogee') return screenApogee(objects, opts)
  return screenGrid(objects, opts)
}

/** Recall and precision of a method's events against the reference (brute force), matched by pair. */
export function compareEvents(reference: readonly Conjunction[], found: readonly Conjunction[]): { recall: number; precision: number; missed: number; extra: number } {
  const key = (c: Conjunction) => `${c.a}-${c.b}`
  const ref = new Set(reference.map(key))
  const got = new Set(found.map(key))
  let hit = 0
  for (const k of got) if (ref.has(k)) hit++
  return {
    recall: ref.size ? hit / ref.size : 1,
    precision: got.size ? hit / got.size : 1,
    missed: ref.size - hit,
    extra: got.size - hit,
  }
}
