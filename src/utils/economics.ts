/**
 * Screening cost at catalogue sizes beyond what was measured, from the benchmark's own numbers.
 * Every assumption is a named constant so the research page can show it.
 */

/** Screening windows of 90 minutes per day, for continuous screening. */
export const WINDOWS_PER_DAY = 16
/** Cloud price used for the comparison, USD per CPU-hour (typical on-demand price for one vCPU). */
export const USD_PER_CPU_HOUR = 0.05
export const STEPS_PER_WINDOW = 270

export interface ScalingPoint {
  n: number
  grid: { ms: number }
}

/** Brute-force pair checks in one window. */
export function bruteChecks(n: number): number {
  return ((n * (n - 1)) / 2) * STEPS_PER_WINDOW
}

/** Growth exponent of the grid's time, fitted between the two largest measured catalogues. */
export function gridExponent(scaling: readonly ScalingPoint[]): number {
  const [a, b] = scaling.slice(-2)
  return Math.log(b.grid.ms / a.grid.ms) / Math.log(b.n / a.n)
}

/** Grid time for one window at size n, ms, extrapolated with the fitted exponent from the largest measured size. */
export function gridMs(n: number, scaling: readonly ScalingPoint[]): number {
  const last = scaling[scaling.length - 1]
  return last.grid.ms * (n / last.n) ** gridExponent(scaling)
}

export interface CostRow {
  n: number
  bruteHoursPerDay: number
  gridHoursPerDay: number
  bruteUsdPerYear: number
  gridUsdPerYear: number
}

/** CPU-hours per day and cloud cost per year for brute force and the grid at catalogue size n. */
export function screeningCost(n: number, nsPerBruteCheck: number, scaling: readonly ScalingPoint[]): CostRow {
  const bruteHoursPerDay = (bruteChecks(n) * nsPerBruteCheck * 1e-9 * WINDOWS_PER_DAY) / 3600
  const gridHoursPerDay = (gridMs(n, scaling) * 1e-3 * WINDOWS_PER_DAY) / 3600
  return {
    n,
    bruteHoursPerDay,
    gridHoursPerDay,
    bruteUsdPerYear: bruteHoursPerDay * 365 * USD_PER_CPU_HOUR,
    gridUsdPerYear: gridHoursPerDay * 365 * USD_PER_CPU_HOUR,
  }
}
