import { useEffect, useMemo, useRef, useState } from 'react'
import { InfoBox, RangeField, Section } from '../components/controls'
import { fill } from '../utils/text'
import { KIND_COLORS } from '../components/canvas'
import { OrbitView } from '../components/OrbitView'
import { PageHeader } from '../components/PageHeader'
import { Pill } from '../components/Pill'
import { useLanguage } from '../i18n/LanguageContext'
import { formatNumber, formatPercent } from '../utils/format'
import { makePopulation, type PopulationClass } from '../utils/screening/population'
import { compareEvents, METHODS, type MethodId } from '../utils/screening/screen'
import type { MethodReport, ScreenMessage, ScreenRequest } from '../workers/screen.worker'

const N_RANGE = { min: 250, max: 3000, step: 250 }
const D_RANGE = { min: 2, max: 25, step: 1 }

export function TrafficPage() {
  const { t, lang } = useLanguage()
  const tr = t.traffic
  const [n, setN] = useState(1000)
  const [threshold, setThreshold] = useState(10)
  const [seed, setSeed] = useState(1001)
  const [running, setRunning] = useState<MethodId | null>(null)
  const [reports, setReports] = useState<Partial<Record<MethodId, MethodReport>>>({})
  const [ranFor, setRanFor] = useState<ScreenRequest | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const objects = useMemo(() => makePopulation(n, seed), [n, seed])
  const shownObjects = useMemo(() => (ranFor ? makePopulation(ranFor.n, ranFor.seed) : objects), [ranFor, objects])

  useEffect(() => () => workerRef.current?.terminate(), [])

  function run() {
    workerRef.current?.terminate()
    const worker = new Worker(new URL('../workers/screen.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    const request: ScreenRequest = { n, seed, threshold }
    setReports({})
    setRanFor(null)
    setRunning(METHODS[0])
    worker.onmessage = (event: MessageEvent<ScreenMessage>) => {
      const msg = event.data
      if (msg.type === 'progress') setRunning(msg.method)
      else if (msg.type === 'result') setReports((r) => ({ ...r, [msg.report.method]: msg.report }))
      else {
        setRunning(null)
        setRanFor(request)
        worker.terminate()
      }
    }
    worker.postMessage(request)
  }

  const brute = reports.brute
  const done = Boolean(ranFor && brute && reports.apogee && reports.grid)
  const agree = done && METHODS.every((m) => {
    const c = compareEvents(brute!.events, reports[m]!.events)
    return c.recall === 1 && c.precision === 1
  })
  const events = done ? brute!.events : []
  const closest = [...events].sort((a, b) => a.miss - b.miss).slice(0, 8)
  const counts = useMemo(() => {
    const c: Record<PopulationClass, number> = { constellation: 0, sunSync: 0, debris: 0, other: 0 }
    for (const o of objects) c[o.kind]++
    return c
  }, [objects])

  return (
    <>
      <PageHeader eyebrow={tr.eyebrow} title={tr.title} sub={tr.sub} />
      <Section>
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="card min-w-0 space-y-8 p-6 sm:p-8">
            <RangeField id="t-n" label={tr.objects} value={n} {...N_RANGE} onChange={setN} display={formatNumber(n, lang)} />
            <RangeField id="t-d" label={tr.threshold} value={threshold} {...D_RANGE} onChange={setThreshold} display={`${threshold} ${t.common.units.km}`} />
            <div className="flex items-center justify-between gap-4">
              <p className="text-[0.95rem] text-ice/85">
                {tr.seed} <span className="mono text-ember">#{seed}</span>
              </p>
              <button type="button" className="pill pill-ghost !text-sm" onClick={() => setSeed((s) => s + 1)} disabled={running !== null}>
                {tr.newSeed}
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {(Object.keys(counts) as PopulationClass[]).map((k) => (
                <li key={k} className="flex items-center gap-2 text-ice/70">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: KIND_COLORS[k] }} />
                  {tr.legend[k]} <span className="mono text-ice/45">{counts[k]}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line pt-6">
              <p className="text-[0.95rem] text-ice/85">{tr.method}</p>
              {METHODS.map((m) => (
                <div key={m} className={`rounded-2xl border px-4 py-3 ${running === m ? 'border-flare bg-flare/10' : 'border-line'}`}>
                  <p className="text-[0.95rem] font-semibold text-white">
                    {tr.methods[m]} {running === m && <span className="ml-2 text-xs text-ember">{tr.running}</span>}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ice/55">{tr.methodBody[m]}</p>
                </div>
              ))}
            </div>
            <Pill onClick={run} disabled={running !== null} className="w-full justify-between">
              {running ? tr.running : tr.run}
            </Pill>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="card relative aspect-square overflow-hidden sm:aspect-[4/3]">
              <OrbitView objects={shownObjects} events={events} />
            </div>

            <div className="card overflow-x-auto p-5 sm:p-6">
              <p className="eyebrow">{tr.results}</p>
              <table className="mt-4 w-full min-w-[30rem] text-left text-sm">
                <thead className="text-ice/50">
                  <tr>
                    <th className="py-2 font-normal" />
                    <th className="py-2 font-normal">{tr.checks}</th>
                    <th className="py-2 font-normal">{tr.time}</th>
                    <th className="py-2 font-normal">{tr.events}</th>
                  </tr>
                </thead>
                <tbody>
                  {METHODS.map((m) => {
                    const r = reports[m]
                    const checks = r ? r.pairChecks + r.prefilterChecks : 0
                    return (
                      <tr key={m} className="border-t border-line">
                        <td className="py-3 pr-3 text-white">{tr.methods[m]}</td>
                        <td className="mono py-3 pr-3">
                          {r ? formatNumber(checks, lang) : '—'}
                          {r && brute && m !== 'brute' && <span className="block text-xs text-safe">{fill(tr.reduction, { p: formatPercent(1 - checks / brute.pairChecks, lang, 2) })}</span>}
                        </td>
                        <td className="mono py-3 pr-3">{r ? `${formatNumber(r.ms, lang)} ms` : '—'}</td>
                        <td className="mono py-3">{r ? r.events.length : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {done && <p className={`mt-4 text-sm ${agree ? 'text-safe' : 'text-danger'}`} role="status">{agree ? tr.same : tr.differ}</p>}
            </div>

            {done && (
              <div className="card p-5 sm:p-6">
                <p className="eyebrow">{tr.closest}</p>
                {closest.length === 0 ? (
                  <p className="mt-3 text-ice/65">{tr.none}</p>
                ) : (
                  <table className="mt-4 w-full text-left text-sm">
                    <thead className="text-ice/50">
                      <tr>
                        <th className="py-2 font-normal">{tr.pair}</th>
                        <th className="py-2 font-normal">{tr.miss}</th>
                        <th className="py-2 font-normal">{tr.when}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closest.map((e) => (
                        <tr key={`${e.a}-${e.b}`} className="border-t border-line">
                          <td className="py-2.5">
                            <span style={{ color: KIND_COLORS[shownObjects[e.a].kind] }}>#{e.a}</span> × <span style={{ color: KIND_COLORS[shownObjects[e.b].kind] }}>#{e.b}</span>
                          </td>
                          <td className="mono py-2.5 text-flare">
                            {formatNumber(e.miss, lang, 2)} {t.common.units.km}
                          </td>
                          <td className="mono py-2.5">{formatNumber(e.tca / 60, lang, 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <InfoBox title={t.common.formula}>{tr.formula}</InfoBox>
          <InfoBox title={t.common.limits}>{tr.limits}</InfoBox>
        </div>
      </Section>
    </>
  )
}
