import { describe, expect, it } from 'vitest'
import { makeBodies, MAX_BODIES, shatter, START_BODIES, step, type Body } from './cascadeSim'
import { mulberry32 } from './screening/random'

function run(seconds: number, breakUp: boolean, seed = 1) {
  const rand = mulberry32(100 + seed)
  let bodies = makeBodies(seed)
  let collisions = 0
  if (breakUp) {
    const born: Body[] = []
    shatter(bodies[0], rand, born)
    bodies = bodies.slice(1).concat(born)
  }
  for (let f = 0; f < seconds * 60; f++) {
    const r = step(bodies, 1 / 60, rand)
    bodies = r.bodies
    collisions += r.collisions
  }
  return { bodies, collisions, intact: bodies.filter((b) => !b.frag).length }
}

describe('cascade illustration', () => {
  it('stays quiet when nothing breaks up', () => {
    const r = run(30, false)
    expect(r.collisions).toBe(0)
    expect(r.bodies).toHaveLength(START_BODIES)
  })

  it('one break-up spreads to most satellites within a minute, but not instantly', () => {
    for (const seed of [1, 2, 3]) {
      const early = run(3, true, seed)
      const late = run(60, true, seed)
      expect(early.intact).toBeGreaterThan(START_BODIES * 0.6)
      expect(late.intact).toBeLessThan(START_BODIES * 0.2)
      expect(late.bodies.length).toBeLessThanOrEqual(MAX_BODIES)
    }
  })
})
