/**
 * A "particle in a box" model of the debris population, in the spirit of Kessler & Cour-Palais (1978).
 * One number per year: tracked objects N (in thousands) in low Earth orbit.
 *
 *   collisions(year) = c · N²                       (every pair meets with a small, fixed probability)
 *   N(next) = N + L·(1 − disposal) − decay·N − removal + F · collisions
 *   L grows by `growth` a year
 *
 * The constants are illustrative: chosen so the "business as usual" curve starts near today's population and runs
 * away within a century, as the long-term projections published by ESA and NASA warn. The page labels the chart as a
 * model, not a forecast.
 */

export interface CascadeParams {
  /** Tracked objects at the start, thousands (ESA: about 40,000 in 2025). */
  start: number
  /** Objects launched per year at the start, thousands (UN: about 2,470 satellites in 2022). */
  launches: number
  /** Yearly growth of launches. */
  growth: number
  /** Share of objects that fall back by themselves each year. */
  decay: number
  /** Share of launched objects disposed of properly at end of life (0–1). */
  disposal: number
  /** Objects actively removed per year, thousands. */
  removal: number
  /** Collisions per year per (thousand objects)². */
  c: number
  /** Trackable fragments per collision, thousands. */
  fragments: number
}

export const BASE_PARAMS: CascadeParams = {
  start: 40,
  launches: 2.5,
  growth: 0.02,
  decay: 0.035,
  disposal: 0.6,
  removal: 0,
  c: 0.0001,
  fragments: 1.0,
}

export const SCENARIOS = {
  businessAsUsual: { disposal: 0.6, removal: 0 },
  betterDisposal: { disposal: 0.95, removal: 0 },
  disposalAndRemoval: { disposal: 0.95, removal: 0.3 },
} as const satisfies Record<string, Partial<CascadeParams>>
export type ScenarioId = keyof typeof SCENARIOS
export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[]

export interface CascadePoint {
  year: number
  /** Tracked objects, thousands. */
  objects: number
  /** Collisions so far. */
  collisions: number
}

/** Cap on the population, thousands, so a runaway curve stays drawable. */
export const CAP = 400

export function simulateCascade(years: number, p: CascadeParams = BASE_PARAMS, startYear = 2025): CascadePoint[] {
  const out: CascadePoint[] = []
  let n = p.start
  let launches = p.launches
  let cumulative = 0
  for (let y = 0; y <= years; y++) {
    out.push({ year: startYear + y, objects: n, collisions: cumulative })
    const collisions = p.c * n * n
    cumulative += collisions
    n = n + launches * (1 - p.disposal) - p.decay * n - p.removal + p.fragments * collisions
    n = Math.min(CAP, Math.max(0, n))
    launches *= 1 + p.growth
  }
  return out
}

export function runScenario(id: ScenarioId, years = 100): CascadePoint[] {
  return simulateCascade(years, { ...BASE_PARAMS, ...SCENARIOS[id] })
}
