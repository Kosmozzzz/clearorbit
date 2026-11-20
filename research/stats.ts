/** Small, dependency-free statistics for the benchmark. */

export function mean(xs: readonly number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
}

export function sd(xs: readonly number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1))
}

export function median(xs: readonly number[]): number {
  if (!xs.length) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Two-sided 97.5 % quantiles of Student's t for 1–30 degrees of freedom; larger samples use 1.96. */
const T975 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042]

export function tCritical(df: number): number {
  if (df < 1) return NaN
  return df <= 30 ? T975[df - 1] : 1.96
}

/** Mean with a 95 % confidence interval (t distribution). */
export function ci95(xs: readonly number[]): { mean: number; low: number; high: number } {
  const m = mean(xs)
  const half = xs.length > 1 ? (tCritical(xs.length - 1) * sd(xs)) / Math.sqrt(xs.length) : 0
  return { mean: m, low: m - half, high: m + half }
}

/** Geometric mean, the right average for speed-up ratios. */
export function geomean(xs: readonly number[]): number {
  return Math.exp(mean(xs.map(Math.log)))
}

/** 95 % confidence interval of a geometric mean (t interval on the logs, transformed back). */
export function geomeanCi95(xs: readonly number[]): { mean: number; low: number; high: number } {
  const c = ci95(xs.map(Math.log))
  return { mean: Math.exp(c.mean), low: Math.exp(c.low), high: Math.exp(c.high) }
}
