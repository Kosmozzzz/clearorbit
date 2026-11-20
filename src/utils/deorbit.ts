import { deorbitBurnDv, hohmannDv, MU, propellantMass, R_EARTH } from './screening/orbit.ts'

/**
 * Deorbit planner: how long a satellite stays up on its own, whether that meets the disposal rules, and how much
 * propellant it takes to comply. A teaching model, not a mission-analysis tool (see LIMITS).
 */

/** Exponential atmosphere, reference values from Vallado, *Fundamentals of Astrodynamics and Applications* (Table 8-4). */
const ATMOSPHERE: readonly [number, number, number][] = [
  // [base altitude km, density kg/m³, scale height km]
  [0, 1.225, 7.249],
  [25, 3.899e-2, 6.349],
  [30, 1.774e-2, 6.682],
  [40, 3.972e-3, 7.554],
  [50, 1.057e-3, 8.382],
  [60, 3.206e-4, 7.714],
  [70, 8.77e-5, 6.549],
  [80, 1.905e-5, 5.799],
  [90, 3.396e-6, 5.382],
  [100, 5.297e-7, 5.877],
  [110, 9.661e-8, 7.263],
  [120, 2.438e-8, 9.473],
  [130, 8.484e-9, 12.636],
  [140, 3.845e-9, 16.149],
  [150, 2.07e-9, 22.523],
  [180, 5.464e-10, 29.74],
  [200, 2.789e-10, 37.105],
  [250, 7.248e-11, 45.546],
  [300, 2.418e-11, 53.628],
  [350, 9.518e-12, 53.298],
  [400, 3.725e-12, 58.515],
  [450, 1.585e-12, 60.828],
  [500, 6.967e-13, 63.822],
  [600, 1.454e-13, 71.835],
  [700, 3.614e-14, 88.667],
  [800, 1.17e-14, 124.64],
  [900, 5.245e-15, 181.05],
  [1000, 3.019e-15, 268],
]

export type SolarActivity = 'low' | 'mean' | 'high'
export const SOLAR: readonly SolarActivity[] = ['low', 'mean', 'high']

/**
 * The upper atmosphere swells when the Sun is active. These factors scale the mean-activity table; they are round
 * numbers chosen to match the spread of lifetimes in the ESA and NASA guidance, not a solar-flux model.
 */
export const SOLAR_FACTOR: Record<SolarActivity, number> = { low: 0.4, mean: 1, high: 2.5 }

/** Atmospheric density at an altitude, kg/m³. */
export function density(altKm: number, solar: SolarActivity = 'mean'): number {
  const h = Math.max(0, altKm)
  let row = ATMOSPHERE[0]
  for (const r of ATMOSPHERE) if (h >= r[0]) row = r
  return row[1] * Math.exp(-(h - row[0]) / row[2]) * SOLAR_FACTOR[solar]
}

/** Altitude below which an object is treated as re-entered, km. */
export const REENTRY_ALT = 120
/** Lifetimes beyond this are shown as "more than". */
export const MAX_YEARS = 500
const SECONDS_PER_YEAR = 365.25 * 86400

export interface Satellite {
  /** Mass, kg. */
  mass: number
  /** Average cross-section facing the flow, m². */
  area: number
  /** Drag coefficient (2.2 is the usual value for a satellite). */
  cd?: number
}

/** Ballistic coefficient Cd·A/m, m²/kg. */
export function ballistic(sat: Satellite): number {
  return ((sat.cd ?? 2.2) * sat.area) / sat.mass
}

/**
 * Years until a circular orbit decays from `altKm` to re-entry.
 * Uses the circular-orbit drag decay rate da/dt = −ρ · (Cd·A/m) · √(μ·a), integrated in steps that change the
 * altitude by at most 1 km. Returns MAX_YEARS when the object would still be up after that.
 */
export function lifetimeYears(altKm: number, sat: Satellite, solar: SolarActivity = 'mean'): number {
  if (altKm <= REENTRY_ALT) return 0
  const b = ballistic(sat)
  const muM = MU * 1e9 // m³/s²
  let a = (R_EARTH + altKm) * 1000 // m
  let t = 0
  const limit = MAX_YEARS * SECONDS_PER_YEAR
  while (a / 1000 - R_EARTH > REENTRY_ALT) {
    const rho = density(a / 1000 - R_EARTH, solar)
    const rate = rho * b * Math.sqrt(muM * a) // m/s of semi-major-axis loss
    const dt = Math.min(1000 / rate, 30 * 86400)
    a -= rate * dt
    t += dt
    if (t >= limit) return MAX_YEARS
  }
  return t / SECONDS_PER_YEAR
}

/** Highest altitude (km, to 1 km) from which the satellite re-enters on its own within `years`. */
export function compliantAltitude(years: number, sat: Satellite, solar: SolarActivity = 'mean'): number {
  let lo = REENTRY_ALT
  let hi = 1200
  if (lifetimeYears(hi, sat, solar) <= years) return hi
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2
    if (lifetimeYears(mid, sat, solar) <= years) lo = mid
    else hi = mid
  }
  return Math.floor(lo)
}

/** The two disposal rules compared: the 25-year guideline (IADC, UN COPUOS) and the US FCC 5-year rule (2022). */
export const RULES = [
  { id: 'iadc', years: 25 },
  { id: 'fcc', years: 5 },
] as const
export type RuleId = (typeof RULES)[number]['id']

export interface DisposalPlan {
  lifetime: number
  rule: number
  compliantNow: boolean
  /** Altitude the satellite must be lowered to, km. */
  targetAlt: number
  /** Δv to lower to that altitude with a Hohmann transfer, m/s. */
  lowerDv: number
  lowerPropellant: number
  /** Δv for a controlled re-entry burn (perigee at 50 km), m/s. */
  reentryDv: number
  reentryPropellant: number
}

export const CONTROLLED_PERIGEE = 50

export function planDisposal(altKm: number, sat: Satellite, ruleYears: number, isp: number, solar: SolarActivity = 'mean'): DisposalPlan {
  const lifetime = lifetimeYears(altKm, sat, solar)
  const compliantNow = lifetime <= ruleYears
  const targetAlt = compliantNow ? altKm : compliantAltitude(ruleYears, sat, solar)
  const lowerDv = compliantNow ? 0 : hohmannDv(altKm, targetAlt) * 1000
  const reentryDv = deorbitBurnDv(altKm, CONTROLLED_PERIGEE) * 1000
  return {
    lifetime,
    rule: ruleYears,
    compliantNow,
    targetAlt,
    lowerDv,
    lowerPropellant: propellantMass(sat.mass, lowerDv / 1000, isp),
    reentryDv,
    reentryPropellant: propellantMass(sat.mass, reentryDv / 1000, isp),
  }
}

export const PROPULSION = [
  { id: 'cold', isp: 70 },
  { id: 'hydrazine', isp: 220 },
  { id: 'electric', isp: 1500 },
] as const
export type PropulsionId = (typeof PROPULSION)[number]['id']

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export const DEORBIT_RANGES = {
  alt: { min: 300, max: 1200, step: 10 },
  mass: { min: 1, max: 2000, step: 1 },
  area: { min: 0.01, max: 30, step: 0.01 },
} as const
