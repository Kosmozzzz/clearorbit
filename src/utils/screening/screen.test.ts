import { describe, expect, it } from 'vitest'
import { DEG, circularSpeed, hohmannDv, period, stateAt, type CircularOrbit } from './orbit'
import { makePopulation, splitCounts, DEFAULT_MIX } from './population'
import { cellKey, compareEvents, METHODS, screen, screenBrute } from './screen'

describe('orbit mechanics', () => {
  it('gives the textbook speed and period at 400 km', () => {
    expect(circularSpeed(400)).toBeCloseTo(7.67, 2)
    expect(period(400) / 60).toBeCloseTo(92.4, 0)
  })

  it('keeps the object on its circle and the velocity perpendicular to the radius', () => {
    const o: CircularOrbit = { id: 0, alt: 700, inc: 63 * DEG, raan: 1.1, u0: 0.4 }
    const s = { r: { x: 0, y: 0, z: 0 }, v: { x: 0, y: 0, z: 0 } }
    for (const t of [0, 600, 3000]) {
      stateAt(o, t, s)
      expect(Math.hypot(s.r.x, s.r.y, s.r.z)).toBeCloseTo(6378.137 + 700, 6)
      expect(Math.hypot(s.v.x, s.v.y, s.v.z)).toBeCloseTo(circularSpeed(700), 6)
      expect(s.r.x * s.v.x + s.r.y * s.v.y + s.r.z * s.v.z).toBeCloseTo(0, 6)
    }
  })

  it('costs nothing to transfer to the same altitude and about 3.9 km/s from LEO to GEO', () => {
    expect(hohmannDv(500, 500)).toBe(0)
    expect(hohmannDv(300, 35786)).toBeCloseTo(3.89, 1)
  })
})

describe('synthetic population', () => {
  it('is reproducible and has exactly n objects', () => {
    const a = makePopulation(333, 7)
    const b = makePopulation(333, 7)
    expect(a).toHaveLength(333)
    expect(a).toEqual(b)
    expect(makePopulation(333, 8)).not.toEqual(a)
  })

  it('splits counts to the exact total', () => {
    for (const n of [1, 7, 100, 999]) {
      const c = splitCounts(n, DEFAULT_MIX)
      expect(c.constellation + c.sunSync + c.debris + c.other).toBe(n)
    }
  })
})

describe('screening methods', () => {
  it('packs distinct cells into distinct keys', () => {
    const keys = new Set<number>()
    for (const x of [-30, -1, 0, 1, 30]) for (const y of [-30, -1, 0, 1, 30]) for (const z of [-30, -1, 0, 1, 30]) keys.add(cellKey(x, y, z))
    expect(keys.size).toBe(125)
  })

  it('finds a planted head-on encounter', () => {
    // Two objects on nearly the same circle, one prograde and one retrograde: they meet twice per orbit.
    const objects: CircularOrbit[] = [
      { id: 0, alt: 600, inc: 0, raan: 0, u0: 0 },
      { id: 1, alt: 602, inc: Math.PI, raan: 0, u0: 0.5 },
    ]
    const r = screenBrute(objects, { threshold: 5, window: 6000, step: 10 })
    expect(r.events).toHaveLength(1)
    expect(r.events[0].miss).toBeLessThan(5)
  })

  it('never reports objects that stay far apart', () => {
    const objects: CircularOrbit[] = [
      { id: 0, alt: 500, inc: 0, raan: 0, u0: 0 },
      { id: 1, alt: 900, inc: 0, raan: 0, u0: 0 },
    ]
    for (const m of METHODS) expect(screen(m, objects).events).toHaveLength(0)
  })

  it('all three methods agree exactly on random catalogues', () => {
    for (const seed of [3, 4, 5]) {
      const pop = makePopulation(300, seed)
      const opts = { threshold: 15, window: 2400, step: 20 }
      const ref = screen('brute', pop, opts)
      expect(ref.events.length).toBeGreaterThan(0)
      for (const m of ['apogee', 'grid'] as const) {
        const r = screen(m, pop, opts)
        expect(compareEvents(ref.events, r.events)).toEqual({ recall: 1, precision: 1, missed: 0, extra: 0 })
        expect(r.pairChecks).toBeLessThan(ref.pairChecks)
      }
    }
  })
})
