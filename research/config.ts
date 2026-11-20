import { DEFAULT_OPTIONS, type ScreenOptions } from '../src/utils/screening/screen.ts'

/**
 * The benchmark design, fixed in PREREGISTRATION.md before the run.
 * Seeds 1001–1025 were never used during development; seed 1 was the only pilot.
 */
export const SIZES = [250, 500, 1000, 2000] as const
export const SEEDS = Array.from({ length: 25 }, (_, k) => 1001 + k)
export const OPTIONS: ScreenOptions = DEFAULT_OPTIONS

/** Scaling sweep: one seed, larger catalogues, without brute force (too slow to be useful past a few thousand). */
export const SCALING_SIZES = [1000, 2000, 4000, 8000, 16000] as const
export const SCALING_SEED = 2001
