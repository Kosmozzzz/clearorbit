import { describe, expect, it } from 'vitest'
import { carsEquivalent, kineticEnergy, tntGrams } from './impact'
import { runScenario } from './kessler'
import { defaultState, sanitizeState } from './storage'

describe('impact energy', () => {
  it('follows ½mv²', () => {
    expect(kineticEnergy(1000, 1)).toBe(500000)
    expect(tntGrams(4184)).toBe(1)
    expect(carsEquivalent(kineticEnergy(30, 10))).toBeGreaterThan(2)
  })
})

describe('cascade model', () => {
  it('runs away without action and stays lower with better disposal and removal', () => {
    const bau = runScenario('businessAsUsual')
    const fix = runScenario('disposalAndRemoval')
    expect(bau.at(-1)!.objects).toBeGreaterThan(bau[0].objects * 2)
    expect(fix.at(-1)!.objects).toBeLessThan(bau[0].objects)
    expect(bau.at(-1)!.collisions).toBeGreaterThan(fix.at(-1)!.collisions)
  })
})

describe('saved state', () => {
  it('falls back to defaults for junk', () => {
    expect(sanitizeState(null)).toEqual(defaultState())
    expect(sanitizeState('x')).toEqual(defaultState())
  })

  it('clamps numbers, drops unknown ids and duplicates', () => {
    const s = sanitizeState({
      deorbit: { alt: 99999, mass: -5, area: 'big', solar: 'extreme', rule: 'iadc', propulsion: 'warp' },
      removal: { order: ['T2', 'T2', 'X9', 4, 'T7'] },
      quiz: { best: 140, answered: 3.4 },
      pledge: ['share', 'share', 'hack'],
    })
    expect(s.deorbit.alt).toBe(1200)
    expect(s.deorbit.mass).toBe(1)
    expect(s.deorbit.area).toBe(defaultState().deorbit.area)
    expect(s.deorbit.solar).toBe('mean')
    expect(s.deorbit.rule).toBe('iadc')
    expect(s.deorbit.propulsion).toBe('hydrazine')
    expect(s.removal.order).toEqual(['T2', 'T7'])
    expect(s.quiz).toEqual({ best: 100, answered: 3 })
    expect(s.pledge).toEqual(['share'])
  })
})
