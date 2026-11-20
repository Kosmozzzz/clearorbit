/// <reference lib="webworker" />
import { makePopulation } from '../utils/screening/population'
import { METHODS, screen, type Conjunction, type MethodId } from '../utils/screening/screen'

/** Runs the three screening methods off the main thread so the page stays responsive. */

export interface ScreenRequest {
  n: number
  seed: number
  threshold: number
}

export interface MethodReport {
  method: MethodId
  ms: number
  pairChecks: number
  prefilterChecks: number
  events: Conjunction[]
}

export type ScreenMessage = { type: 'progress'; method: MethodId } | { type: 'result'; report: MethodReport } | { type: 'done' }

self.onmessage = (event: MessageEvent<ScreenRequest>) => {
  const { n, seed, threshold } = event.data
  const objects = makePopulation(n, seed)
  for (const method of METHODS) {
    self.postMessage({ type: 'progress', method } satisfies ScreenMessage)
    const t0 = performance.now()
    const r = screen(method, objects, { threshold, window: 5400, step: 20 })
    const ms = performance.now() - t0
    self.postMessage({ type: 'result', report: { method, ms, pairChecks: r.pairChecks, prefilterChecks: r.prefilterChecks, events: r.events } } satisfies ScreenMessage)
  }
  self.postMessage({ type: 'done' } satisfies ScreenMessage)
}
