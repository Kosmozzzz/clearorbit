import { describe, expect, it } from 'vitest'
import { compliantAltitude, density, lifetimeYears, MAX_YEARS, planDisposal } from './deorbit'

const cubeSat = { mass: 4, area: 0.03 }
const smallSat = { mass: 250, area: 2 }

describe('atmosphere', () => {
  it('matches the reference table and falls with altitude', () => {
    expect(density(400)).toBeCloseTo(3.725e-12, 14)
    expect(density(500)).toBeLessThan(density(400))
    expect(density(400, 'high')).toBeGreaterThan(density(400, 'low'))
  })
})

describe('orbital lifetime', () => {
  it('is short low down and long high up', () => {
    const low = lifetimeYears(300, cubeSat)
    const mid = lifetimeYears(550, cubeSat)
    expect(low).toBeLessThan(1)
    expect(mid).toBeGreaterThan(low)
    expect(lifetimeYears(1000, smallSat)).toBe(MAX_YEARS)
  })

  it('gets shorter when the Sun is active', () => {
    expect(lifetimeYears(600, smallSat, 'high')).toBeLessThan(lifetimeYears(600, smallSat, 'low'))
  })

  it('finds an altitude that really meets the rule', () => {
    const alt = compliantAltitude(5, smallSat)
    expect(lifetimeYears(alt, smallSat)).toBeLessThanOrEqual(5)
    expect(lifetimeYears(alt + 2, smallSat)).toBeGreaterThan(5)
  })
})

describe('disposal plan', () => {
  it('needs no burn when already compliant', () => {
    const p = planDisposal(400, smallSat, 25, 220)
    expect(p.compliantNow).toBe(true)
    expect(p.lowerDv).toBe(0)
  })

  it('needs more Δv for a stricter rule, and a controlled re-entry costs the most', () => {
    const iadc = planDisposal(800, smallSat, 25, 220)
    const fcc = planDisposal(800, smallSat, 5, 220)
    expect(fcc.lowerDv).toBeGreaterThan(iadc.lowerDv)
    expect(fcc.reentryDv).toBeGreaterThan(fcc.lowerDv)
    expect(fcc.lowerPropellant).toBeGreaterThan(0)
    expect(fcc.lowerPropellant).toBeLessThan(smallSat.mass)
  })
})
