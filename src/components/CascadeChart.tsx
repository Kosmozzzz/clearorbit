import { useMemo } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { runScenario, SCENARIO_IDS, type ScenarioId } from '../utils/kessler'
import { formatNumber } from '../utils/format'

const COLORS: Record<ScenarioId, string> = {
  businessAsUsual: '#ff4d6d',
  betterDisposal: '#ffb36b',
  disposalAndRemoval: '#4ade9b',
}

/** Three futures of the debris population from the particle-in-a-box model, as an SVG line chart. */
export function CascadeChart() {
  const { t, lang } = useLanguage()
  const series = useMemo(() => SCENARIO_IDS.map((id) => ({ id, points: runScenario(id, 100) })), [])
  const W = 640
  const H = 320
  const pad = { l: 44, r: 16, t: 16, b: 32 }
  const maxY = Math.ceil(Math.max(...series.flatMap((s) => s.points.map((p) => p.objects))) / 50) * 50
  const x = (i: number) => pad.l + (i / 100) * (W - pad.l - pad.r)
  const y = (v: number) => H - pad.b - (v / maxY) * (H - pad.t - pad.b)
  const ticks = [0, maxY / 4, maxY / 2, (3 * maxY) / 4, maxY]

  return (
    <div className="card p-5 sm:p-8">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.problem.model.title}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="rgba(190,205,255,0.1)" />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="rgba(219,230,255,0.5)">
              {formatNumber(v, lang)}
            </text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map((i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="rgba(219,230,255,0.5)">
            {2025 + i}
          </text>
        ))}
        {series.map((s) => (
          <polyline key={s.id} fill="none" stroke={COLORS[s.id]} strokeWidth="2.5" strokeLinejoin="round" points={s.points.map((p, i) => `${x(i)},${y(p.objects)}`).join(' ')} />
        ))}
      </svg>
      <p className="mt-2 text-xs text-ice/45">{t.problem.model.axis}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {series.map((s) => {
          const last = s.points[s.points.length - 1]
          return (
            <li key={s.id} className="flex gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[s.id] }} />
              <span className="text-sm text-ice/80">
                {t.problem.model.scenarios[s.id]}
                <span className="mt-1 block text-xs text-ice/50">
                  {formatNumber(last.objects * 1000, lang)} · {formatNumber(last.collisions, lang)} {t.problem.model.collisions}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
