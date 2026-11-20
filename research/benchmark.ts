/**
 * Pre-registered benchmark: three conjunction-screening methods on 100 synthetic catalogues.
 * Run with `npm run benchmark` (Node 24 runs TypeScript directly). Writes research/results/benchmark.json.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { cpus, platform, release } from 'node:os'
import { makePopulation } from '../src/utils/screening/population.ts'
import { compareEvents, METHODS, screen, type MethodId } from '../src/utils/screening/screen.ts'
import { OPTIONS, SCALING_SEED, SCALING_SIZES, SEEDS, SIZES } from './config.ts'
import { ci95, geomeanCi95, mean, median } from './stats.ts'

interface Run {
  n: number
  seed: number
  method: MethodId
  ms: number
  pairChecks: number
  prefilterChecks: number
  events: number
  recall: number
  precision: number
}

function timed<T>(fn: () => T): { value: T; ms: number } {
  const t0 = performance.now()
  const value = fn()
  return { value, ms: performance.now() - t0 }
}

// Warm-up so the first timed run does not pay for JIT compilation.
for (const m of METHODS) screen(m, makePopulation(300, 1), OPTIONS)

const runs: Run[] = []
let done = 0
const total = SIZES.length * SEEDS.length
for (const n of SIZES) {
  for (const seed of SEEDS) {
    const pop = makePopulation(n, seed)
    // Run order rotates with the seed so no method always runs first (cache and GC effects).
    const order = METHODS.map((_, k) => METHODS[(k + seed) % METHODS.length])
    const results = new Map<MethodId, { r: ReturnType<typeof screen>; ms: number }>()
    for (const m of order) {
      const { value, ms } = timed(() => screen(m, pop, OPTIONS))
      results.set(m, { r: value, ms })
    }
    const reference = results.get('brute')!.r.events
    for (const m of METHODS) {
      const { r, ms } = results.get(m)!
      const cmp = compareEvents(reference, r.events)
      runs.push({ n, seed, method: m, ms, pairChecks: r.pairChecks, prefilterChecks: r.prefilterChecks, events: r.events.length, recall: cmp.recall, precision: cmp.precision })
    }
    done++
    process.stdout.write(`\r${done}/${total} scenarios`)
  }
}
process.stdout.write('\n')

function pick(n: number, m: MethodId): Run[] {
  return runs.filter((r) => r.n === n && r.method === m)
}

const summary = SIZES.map((n) => {
  const brute = pick(n, 'brute')
  const perMethod = Object.fromEntries(
    METHODS.map((m) => {
      const rs = pick(n, m)
      const checkReduction = rs.map((r, k) => 1 - (r.pairChecks + r.prefilterChecks) / brute[k].pairChecks)
      const speedup = rs.map((r, k) => brute[k].ms / r.ms)
      return [
        m,
        {
          msMean: ci95(rs.map((r) => r.ms)),
          msMedian: median(rs.map((r) => r.ms)),
          pairChecksMean: mean(rs.map((r) => r.pairChecks + r.prefilterChecks)),
          checkReduction: ci95(checkReduction),
          speedup: geomeanCi95(speedup),
          minRecall: Math.min(...rs.map((r) => r.recall)),
          minPrecision: Math.min(...rs.map((r) => r.precision)),
        },
      ]
    }),
  )
  return { n, events: ci95(brute.map((r) => r.events)), methods: perMethod }
})

// Scaling sweep: how the two fast methods grow with catalogue size.
const scaling = SCALING_SIZES.map((n) => {
  const pop = makePopulation(n, SCALING_SEED)
  const apogee = timed(() => screen('apogee', pop, OPTIONS))
  const grid = timed(() => screen('grid', pop, OPTIONS))
  const same = compareEvents(apogee.value.events, grid.value.events)
  process.stdout.write(`scaling n=${n}: apogee ${apogee.ms.toFixed(0)} ms, grid ${grid.ms.toFixed(0)} ms\n`)
  return {
    n,
    bruteChecks: ((n * (n - 1)) / 2) * Math.ceil(OPTIONS.window / OPTIONS.step),
    apogee: { ms: apogee.ms, checks: apogee.value.pairChecks + apogee.value.prefilterChecks },
    grid: { ms: grid.ms, checks: grid.value.pairChecks },
    events: grid.value.events.length,
    agree: same.recall === 1 && same.precision === 1,
  }
})

const out = {
  createdAt: new Date().toISOString(),
  machine: { platform: platform(), release: release(), cpu: cpus()[0]?.model ?? 'unknown', node: process.version },
  preregistrationSha256: createHash('sha256').update(readFileSync(new URL('./PREREGISTRATION.md', import.meta.url))).digest('hex'),
  design: { sizes: SIZES, seeds: SEEDS, options: OPTIONS, scenarios: total },
  summary,
  scaling,
  runs,
}
mkdirSync(new URL('./results/', import.meta.url), { recursive: true })
writeFileSync(new URL('./results/benchmark.json', import.meta.url), JSON.stringify(out, null, 2))

for (const s of summary) {
  const g = s.methods.grid
  const a = s.methods.apogee
  console.log(
    `n=${s.n}: grid −${(g.checkReduction.mean * 100).toFixed(2)} % checks, ${g.speedup.mean.toFixed(2)}× [${g.speedup.low.toFixed(2)}, ${g.speedup.high.toFixed(2)}]; ` +
      `apogee −${(a.checkReduction.mean * 100).toFixed(2)} % checks, ${a.speedup.mean.toFixed(2)}×; recall grid ${g.minRecall}, apogee ${a.minRecall}`,
  )
}
