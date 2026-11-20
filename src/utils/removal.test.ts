import { describe, expect, it } from 'vitest'
import { greedyRoute, hopDv, optimalRoute, routeDv, routePropellant, START, TARGETS } from './removal'

describe('clean-up routes', () => {
  it('costs nothing to stay put and is symmetric', () => {
    expect(hopDv(TARGETS[0], TARGETS[0])).toBe(0)
    expect(hopDv(TARGETS[0], TARGETS[3])).toBeCloseTo(hopDv(TARGETS[3], TARGETS[0]), 6)
  })

  it('makes plane changes far dearer than altitude changes', () => {
    const altOnly = hopDv({ alt: 700, inc: 98 }, { alt: 800, inc: 98 })
    const planeOnly = hopDv({ alt: 700, inc: 98 }, { alt: 700, inc: 88 })
    expect(planeOnly).toBeGreaterThan(10 * altOnly)
  })

  it('the exhaustive route is never worse than greedy or any given order', () => {
    const pick = [TARGETS[0], TARGETS[3], TARGETS[5], TARGETS[7], TARGETS[2]]
    const best = routeDv(optimalRoute(pick))
    expect(best).toBeLessThanOrEqual(routeDv(greedyRoute(pick)) + 1e-9)
    expect(best).toBeLessThanOrEqual(routeDv(pick) + 1e-9)
    expect(optimalRoute(pick)).toHaveLength(pick.length)
  })

  it('greedy visits every target once', () => {
    const r = greedyRoute(TARGETS)
    expect(new Set(r.map((t) => t.id)).size).toBe(TARGETS.length)
    expect(routeDv([], START)).toBe(0)
  })

  it('propellant grows faster than Δv', () => {
    expect(routePropellant(0)).toBe(0)
    expect(routePropellant(2000)).toBeGreaterThan(2 * routePropellant(1000))
  })
})
