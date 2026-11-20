import benchmark from '../../research/results/benchmark.json'
import { Section, SectionHead } from '../components/controls'
import { PageHeader } from '../components/PageHeader'
import { useLanguage } from '../i18n/LanguageContext'
import { bruteChecks, screeningCost } from '../utils/economics'
import { formatNumber, formatPercent } from '../utils/format'
import type { MethodId } from '../utils/screening/screen'

const METHOD_IDS: MethodId[] = ['brute', 'apogee', 'grid']
const COLORS: Record<MethodId, string> = { brute: '#ff4d6d', apogee: '#ffb36b', grid: '#67e3ff' }

type Summary = (typeof benchmark.summary)[number]
const summary = benchmark.summary as Summary[]
const byN = (n: number) => summary.find((s) => s.n === n)!

/** The four pre-registered hypotheses, judged from the stored results (not typed in by hand). */
function verdicts(): boolean[] {
  const big = summary.filter((s) => s.n >= 1000)
  const h1 = big.every((s) => s.methods.grid.checkReduction.mean >= 0.99)
  const h2 = byN(2000).methods.grid.speedup.low > 4
  const h3 = summary.every((s) => (['apogee', 'grid'] as const).every((m) => s.methods[m].minRecall === 1 && s.methods[m].minPrecision === 1))
  const h4 = summary.every((s) => s.methods.apogee.checkReduction.mean < 0.9)
  return [h1, h2, h3, h4]
}

/** Measured cost of one brute-force pair check, ns, from the largest catalogue. */
function nsPerBruteCheck(): number {
  const s = byN(2000)
  return (s.methods.brute.msMedian * 1e6) / s.methods.brute.pairChecksMean
}

function ChecksChart() {
  const { t, lang } = useLanguage()
  const W = 620
  const H = 280
  const pad = { l: 60, r: 16, t: 14, b: 34 }
  const logMin = 3
  const logMax = 9
  const y = (v: number) => H - pad.b - ((Math.log10(Math.max(v, 1)) - logMin) / (logMax - logMin)) * (H - pad.t - pad.b)
  const groupW = (W - pad.l - pad.r) / summary.length
  const barW = groupW / 4.2
  return (
    <div className="card p-5 sm:p-7">
      <p className="eyebrow !text-ice/55">{t.research.chartChecks}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={t.research.chartChecks}>
        {[3, 4, 5, 6, 7, 8, 9].map((e) => (
          <g key={e}>
            <line x1={pad.l} x2={W - pad.r} y1={y(10 ** e)} y2={y(10 ** e)} stroke="rgba(190,205,255,0.08)" />
            <text x={pad.l - 8} y={y(10 ** e) + 4} textAnchor="end" fontSize="11" fill="rgba(219,230,255,0.5)">
              10^{e}
            </text>
          </g>
        ))}
        {summary.map((s, gi) => (
          <g key={s.n}>
            {METHOD_IDS.map((m, mi) => {
              const v = s.methods[m].pairChecksMean
              const x = pad.l + gi * groupW + groupW * 0.15 + mi * barW
              return <rect key={m} x={x} y={y(v)} width={barW - 3} height={H - pad.b - y(v)} rx="3" fill={COLORS[m]} />
            })}
            <text x={pad.l + gi * groupW + groupW / 2} y={H - 12} textAnchor="middle" fontSize="11" fill="rgba(219,230,255,0.6)">
              N = {formatNumber(s.n, lang)}
            </text>
          </g>
        ))}
      </svg>
      <ul className="mt-4 flex flex-wrap gap-5 text-sm text-ice/75">
        {METHOD_IDS.map((m) => (
          <li key={m} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[m] }} />
            {t.traffic.methods[m]}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ScalingChart() {
  const { t, lang } = useLanguage()
  const sc = benchmark.scaling
  const W = 620
  const H = 260
  const pad = { l: 60, r: 16, t: 14, b: 34 }
  const xs = sc.map((s) => s.n)
  const lx = (n: number) => pad.l + ((Math.log2(n) - Math.log2(xs[0])) / (Math.log2(xs[xs.length - 1]) - Math.log2(xs[0]))) * (W - pad.l - pad.r)
  const ly = (v: number) => H - pad.b - ((Math.log10(v) - 5) / (11 - 5)) * (H - pad.t - pad.b)
  const series = [
    { id: 'brute', label: t.research.bruteEstimate, color: COLORS.brute, dash: '6 5', pts: sc.map((s) => [s.n, s.bruteChecks]) },
    { id: 'apogee', label: t.traffic.methods.apogee, color: COLORS.apogee, dash: undefined, pts: sc.map((s) => [s.n, s.apogee.checks]) },
    { id: 'grid', label: t.traffic.methods.grid, color: COLORS.grid, dash: undefined, pts: sc.map((s) => [s.n, s.grid.checks]) },
  ]
  return (
    <div className="card p-5 sm:p-7">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.research.scalingTitle}>
        {[5, 7, 9, 11].map((e) => (
          <g key={e}>
            <line x1={pad.l} x2={W - pad.r} y1={ly(10 ** e)} y2={ly(10 ** e)} stroke="rgba(190,205,255,0.08)" />
            <text x={pad.l - 8} y={ly(10 ** e) + 4} textAnchor="end" fontSize="11" fill="rgba(219,230,255,0.5)">
              10^{e}
            </text>
          </g>
        ))}
        {xs.map((n) => (
          <text key={n} x={lx(n)} y={H - 12} textAnchor="middle" fontSize="11" fill="rgba(219,230,255,0.6)">
            {formatNumber(n, lang)}
          </text>
        ))}
        {series.map((s) => (
          <g key={s.id}>
            <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dash} points={s.pts.map(([n, v]) => `${lx(n)},${ly(v)}`).join(' ')} />
            {s.pts.map(([n, v]) => (
              <circle key={n} cx={lx(n)} cy={ly(v)} r="3.5" fill={s.color} />
            ))}
          </g>
        ))}
      </svg>
      <ul className="mt-4 flex flex-wrap gap-5 text-sm text-ice/75">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ResearchPage() {
  const { t, lang } = useLanguage()
  const r = t.research
  const v = verdicts()
  const ns = nsPerBruteCheck()
  const costs = [40000, 1000000].map((n) => screeningCost(n, ns, benchmark.scaling))
  const usd = (x: number) => `USD ${formatNumber(x < 10 ? Math.round(x * 10) / 10 : Math.round(x / (x > 1000 ? 100 : 1)) * (x > 1000 ? 100 : 1), lang, x < 10 ? 1 : 0)}`
  const hours = (x: number) => formatNumber(x, lang, x < 10 ? 2 : 0)

  return (
    <>
      <PageHeader eyebrow={r.eyebrow} title={r.title} sub={r.sub} />

      <Section>
        <div className="card border-flare/40 p-7 sm:p-10">
          <p className="eyebrow">{r.hypothesisTitle}</p>
          <p className="statement mt-4 text-[clamp(1.2rem,2.3vw,1.7rem)] text-white">{r.hypothesis}</p>
        </div>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {r.hypotheses.map((h, i) => (
            <li key={h.id} className="card flex items-start gap-4 p-5">
              <span className="mono text-sm text-ember">{h.id}</span>
              <span className="flex-1 text-ice/85">{h.text}</span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${v[i] ? 'bg-safe/15 text-safe' : 'bg-danger/15 text-danger'}`}>{v[i] ? r.supported : r.rejected}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="border-t border-line">
        <SectionHead title={r.designTitle} />
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {r.design.map((d) => (
            <li key={d} className="card p-5 leading-relaxed text-ice/80">
              {d}
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {METHOD_IDS.map((m) => (
            <div key={m} className="card p-5">
              <p className="font-semibold" style={{ color: COLORS[m] }}>
                {t.traffic.methods[m]}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ice/65">{t.traffic.methodBody[m]}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-line">
        <SectionHead title={r.resultsTitle} />
        <div className="card mt-8 overflow-x-auto p-5 sm:p-7">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-ice/50">
              <tr>
                <th className="py-2 pr-3 font-normal">{r.table.n}</th>
                <th className="py-2 pr-3 font-normal">{r.table.method}</th>
                <th className="py-2 pr-3 font-normal">{r.table.checks}</th>
                <th className="py-2 pr-3 font-normal">{r.table.reduction}</th>
                <th className="py-2 pr-3 font-normal">{r.table.speedup}</th>
                <th className="py-2 pr-3 font-normal">{r.table.time}</th>
                <th className="py-2 font-normal">{r.table.recall}</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) =>
                METHOD_IDS.map((m, mi) => {
                  const x = s.methods[m]
                  return (
                    <tr key={`${s.n}-${m}`} className={mi === 0 ? 'border-t border-line' : ''}>
                      <td className="mono py-2 pr-3 text-white">{mi === 0 ? formatNumber(s.n, lang) : ''}</td>
                      <td className="py-2 pr-3" style={{ color: COLORS[m] }}>
                        {t.traffic.methods[m]}
                      </td>
                      <td className="mono py-2 pr-3">{formatNumber(x.pairChecksMean, lang)}</td>
                      <td className="mono py-2 pr-3">{m === 'brute' ? '—' : formatPercent(x.checkReduction.mean, lang, 2)}</td>
                      <td className="mono py-2 pr-3">
                        {m === 'brute' ? '1×' : `${formatNumber(x.speedup.mean, lang, 2)}× [${formatNumber(x.speedup.low, lang, 2)}–${formatNumber(x.speedup.high, lang, 2)}]`}
                      </td>
                      <td className="mono py-2 pr-3">{formatNumber(x.msMedian, lang)} ms</td>
                      <td className="mono py-2">{formatNumber(x.minRecall * 100, lang)} %</td>
                    </tr>
                  )
                }),
              )}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-ice/45">
            {benchmark.design.scenarios} × 3 · {benchmark.machine.cpu} · Node {benchmark.machine.node}
          </p>
        </div>
        <div className="mt-6">
          <ChecksChart />
        </div>

        <div className="mt-16">
          <SectionHead title={r.scalingTitle} body={r.scalingBody} />
          <div className="mt-8">
            <ScalingChart />
          </div>
        </div>

        <div className="mt-16">
          <SectionHead title={r.findingsTitle} />
          <ol className="mt-8 space-y-3">
            {r.findings.map((f, i) => (
              <li key={f} className="card flex gap-5 p-5">
                <span className="mono text-ember">0{i + 1}</span>
                <span className="leading-relaxed text-ice/85">{f}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section className="glow border-t border-line">
        <SectionHead title={r.economicsTitle} body={r.economicsBody} />
        <div className="card mt-8 overflow-x-auto p-5 sm:p-7">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-ice/50">
              <tr>
                <th className="py-2 pr-3 font-normal">{r.economics.catalogue}</th>
                <th className="py-2 pr-3 font-normal">{r.economics.today}</th>
                <th className="py-2 font-normal">{r.economics.future}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line">
                <td className="py-3 pr-3 text-ice/80">{r.economics.bruteHours}</td>
                {costs.map((c) => (
                  <td key={c.n} className="mono py-3 pr-3 text-danger">
                    {hours(c.bruteHoursPerDay)}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-line">
                <td className="py-3 pr-3 text-ice/80">{r.economics.gridHours}</td>
                {costs.map((c) => (
                  <td key={c.n} className="mono py-3 pr-3 text-orbit">
                    {hours(c.gridHoursPerDay)}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-line">
                <td className="py-3 pr-3 text-ice/80">{r.economics.perCpu}</td>
                {costs.map((c) => (
                  <td key={c.n} className="mono py-3 pr-3">
                    {formatNumber(Math.ceil(c.bruteHoursPerDay / 24), lang)} → {formatNumber(Math.ceil(c.gridHoursPerDay / 24), lang)}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-line">
                <td className="py-3 pr-3 text-ice/80">
                  {r.economics.cost}
                </td>
                {costs.map((c) => (
                  <td key={c.n} className="mono py-3 pr-3 text-white">
                    {usd(c.bruteUsdPerYear)} → <span className="text-safe">{usd(c.gridUsdPerYear)}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-xs leading-relaxed text-ice/45">
            {r.economics.note} ({formatNumber(ns, lang, 2)} ns / check; {formatNumber(bruteChecks(40000), lang)} checks per window at N = 40,000)
          </p>
        </div>
      </Section>

      <Section className="border-t border-line">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHead title={r.limitsTitle} />
            <ul className="mt-6 space-y-3">
              {r.limits.map((l) => (
                <li key={l} className="flex gap-3 leading-relaxed text-ice/75">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-flare" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHead title={r.files} />
            <p className="mt-6 leading-relaxed text-ice/75">{r.filesBody}</p>
            <p className="mono mt-4 break-all text-xs text-ice/45">SHA-256 PREREGISTRATION.md: {benchmark.preregistrationSha256}</p>
          </div>
        </div>
      </Section>
    </>
  )
}
