/** Kinetic energy of a debris impact, and everyday things it compares to. */

/** Energy released by one gram of TNT, joules (the standard definition). */
export const TNT_J_PER_G = 4184

/** A 1,500 kg car at 100 km/h, joules. */
export const CAR_J = 0.5 * 1500 * (100 / 3.6) ** 2

/** Typical relative speed of a collision in low Earth orbit, km/s (ESA). */
export const TYPICAL_SPEED = 10

export function kineticEnergy(massGrams: number, speedKms: number): number {
  return 0.5 * (massGrams / 1000) * (speedKms * 1000) ** 2
}

export function tntGrams(joules: number): number {
  return joules / TNT_J_PER_G
}

export function carsEquivalent(joules: number): number {
  return joules / CAR_J
}

/** Everyday objects for the impact calculator, with their mass in grams. */
export const PROJECTILES = [
  { id: 'paint', grams: 0.001 },
  { id: 'marble', grams: 5 },
  { id: 'bolt', grams: 30 },
  { id: 'phone', grams: 200 },
  { id: 'brick', grams: 2500 },
] as const
export type ProjectileId = (typeof PROJECTILES)[number]['id']

export const SPEED_RANGE = { min: 1, max: 15, step: 0.5 } as const
