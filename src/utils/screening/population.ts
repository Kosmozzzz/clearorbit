import { DEG, type CircularOrbit } from './orbit.ts'
import { mulberry32, uniform } from './random.ts'

/**
 * The kinds of objects in a synthetic low-Earth-orbit catalogue. The mix is modelled on the shape of the real
 * population (a crowded mega-constellation shell near 550 km, sun-synchronous Earth observation near 500–600 km,
 * old debris and rocket bodies spread over 700–1,000 km), not on any real catalogue entry.
 */
export type PopulationClass = 'constellation' | 'sunSync' | 'debris' | 'other'

export interface PopulationMix {
  constellation: number
  sunSync: number
  debris: number
  other: number
}

/** Default shares of the four classes. They add up to 1. */
export const DEFAULT_MIX: PopulationMix = { constellation: 0.45, sunSync: 0.15, debris: 0.25, other: 0.15 }

export interface CatalogueObject extends CircularOrbit {
  kind: PopulationClass
}

/** Number of orbital planes in the synthetic constellation shell. */
const PLANES = 72

/**
 * Builds a reproducible catalogue of `n` objects on circular orbits.
 * The same (n, seed, mix) always gives the same catalogue.
 */
export function makePopulation(n: number, seed: number, mix: PopulationMix = DEFAULT_MIX): CatalogueObject[] {
  const rand = mulberry32(seed)
  const counts = splitCounts(n, mix)
  const out: CatalogueObject[] = []
  let id = 0

  // Constellation shell: 72 planes at 53°, satellites spread evenly in each plane, a few km of altitude scatter.
  const perPlane = Math.max(1, Math.ceil(counts.constellation / PLANES))
  for (let k = 0; k < counts.constellation; k++) {
    const plane = k % PLANES
    const slot = Math.floor(k / PLANES)
    out.push({
      id: id++,
      kind: 'constellation',
      alt: uniform(rand, 545, 555),
      inc: 53 * DEG,
      raan: (plane / PLANES) * 2 * Math.PI,
      u0: ((slot + uniform(rand, -0.15, 0.15)) / perPlane) * 2 * Math.PI + plane * 0.31,
    })
  }

  // Sun-synchronous imaging satellites.
  for (let k = 0; k < counts.sunSync; k++) {
    out.push({ id: id++, kind: 'sunSync', alt: uniform(rand, 480, 620), inc: uniform(rand, 97.2, 98.0) * DEG, raan: uniform(rand, 0, 2 * Math.PI), u0: uniform(rand, 0, 2 * Math.PI) })
  }

  // Debris and spent rocket bodies from past break-ups.
  for (let k = 0; k < counts.debris; k++) {
    out.push({ id: id++, kind: 'debris', alt: uniform(rand, 700, 1000), inc: uniform(rand, 65, 100) * DEG, raan: uniform(rand, 0, 2 * Math.PI), u0: uniform(rand, 0, 2 * Math.PI) })
  }

  // Everything else in low Earth orbit.
  for (let k = 0; k < counts.other; k++) {
    out.push({ id: id++, kind: 'other', alt: uniform(rand, 350, 1200), inc: uniform(rand, 0, 100) * DEG, raan: uniform(rand, 0, 2 * Math.PI), u0: uniform(rand, 0, 2 * Math.PI) })
  }

  return out
}

/** Splits n into whole counts per class; rounding leftovers go to the largest class so the total is exactly n. */
export function splitCounts(n: number, mix: PopulationMix): PopulationMix {
  const total = mix.constellation + mix.sunSync + mix.debris + mix.other
  const counts = {
    constellation: Math.floor((n * mix.constellation) / total),
    sunSync: Math.floor((n * mix.sunSync) / total),
    debris: Math.floor((n * mix.debris) / total),
    other: Math.floor((n * mix.other) / total),
  }
  const used = counts.constellation + counts.sunSync + counts.debris + counts.other
  const largest = (Object.keys(mix) as (keyof PopulationMix)[]).reduce((a, b) => (mix[b] > mix[a] ? b : a))
  counts[largest] += n - used
  return counts
}
