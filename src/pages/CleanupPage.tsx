import { useMemo } from 'react'
import { BigStat, InfoBox, Section } from '../components/controls'
import { fill } from '../utils/text'
import { PageHeader } from '../components/PageHeader'
import { useOrbit } from '../context/orbit'
import { useLanguage } from '../i18n/LanguageContext'
import { formatNumber } from '../utils/format'
import { EXHAUSTIVE_LIMIT, greedyRoute, optimalRoute, routeDv, routePropellant, START, TARGETS, type Target } from '../utils/removal'

/** Price used to put the propellant figure in money terms; a rounded rideshare list price, stated on the page. */
const USD_PER_KG = 6000

/** Altitude–inclination map of the targets and the chosen route. */
function RouteMap({ route, compare }: { route: Target[]; compare: Target[] | null }) {
  const W = 560
  const H = 300
  const pad = 36
  const x = (inc: number) => pad + ((inc - 50) / 52) * (W - 2 * pad)
  const y = (alt: number) => H - pad - ((alt - 500) / 520) * (H - 2 * pad)
  const line = (r: Target[]) => [START, ...r].map((p) => `${x(p.inc)},${y(p.alt)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
      {[600, 800, 1000].map((a) => (
        <g key={a}>
          <line x1={pad} x2={W - pad} y1={y(a)} y2={y(a)} stroke="rgba(190,205,255,0.08)" />
          <text x={pad - 4} y={y(a) + 4} textAnchor="end" fontSize="10" fill="rgba(219,230,255,0.45)">
            {a}
          </text>
        </g>
      ))}
      {[55, 70, 85, 100].map((i) => (
        <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="rgba(219,230,255,0.45)">
          {i}°
        </text>
      ))}
      {compare && compare.length > 0 && <polyline points={line(compare)} fill="none" stroke="#4ade9b" strokeWidth="2" strokeDasharray="6 5" />}
      {route.length > 0 && <polyline points={line(route)} fill="none" stroke="#ff7a3d" strokeWidth="2.5" />}
      <circle cx={x(START.inc)} cy={y(START.alt)} r="7" fill="#67e3ff" />
      {TARGETS.map((tg) => {
        const k = route.findIndex((r) => r.id === tg.id)
        return (
          <g key={tg.id}>
            <circle cx={x(tg.inc)} cy={y(tg.alt)} r={k >= 0 ? 10 : 6} fill={k >= 0 ? '#ff7a3d' : 'rgba(219,230,255,0.35)'} />
            {k >= 0 && (
              <text x={x(tg.inc)} y={y(tg.alt) + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#03040b">
                {k + 1}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function CleanupPage() {
  const { t, lang } = useLanguage()
  const c = t.cleanup
  const u = t.common.units
  const { state, update } = useOrbit()
  const route = useMemo(() => state.removal.order.map((id) => TARGETS.find((tg) => tg.id === id)!).filter(Boolean), [state.removal.order])

  function toggle(id: string) {
    const order = state.removal.order.includes(id) ? state.removal.order.filter((x) => x !== id) : [...state.removal.order, id]
    update('removal', { order })
  }

  const yourDv = routeDv(route)
  const greedy = useMemo(() => greedyRoute(route), [route])
  const optimal = useMemo(() => (route.length > 0 && route.length <= EXHAUSTIVE_LIMIT ? optimalRoute(route) : null), [route])
  const greedyDv = routeDv(greedy)
  const bestDv = optimal ? routeDv(optimal) : null
  const saving = bestDv !== null ? yourDv - bestDv : 0
  const savingKg = bestDv !== null ? routePropellant(yourDv) - routePropellant(bestDv) : 0

  const kms = (ms: number) => `${formatNumber(ms / 1000, lang, 2)} ${u.kms}`
  const kg = (k: number) => `${formatNumber(k, lang)} ${u.kg}`

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} title={c.title} sub={c.sub} />
      <Section>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow">{c.targets}</p>
              <button type="button" className="text-sm text-ice/60 underline-offset-4 hover:text-white hover:underline" onClick={() => update('removal', { order: [] })}>
                {c.clear}
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {TARGETS.map((tg) => {
                const k = state.removal.order.indexOf(tg.id)
                const on = k >= 0
                return (
                  <li key={tg.id}>
                    <button
                      type="button"
                      onClick={() => toggle(tg.id)}
                      aria-pressed={on}
                      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors ${on ? 'border-flare bg-flare/10' : 'border-line hover:border-ice/40'}`}
                    >
                      <span className={`mono grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ${on ? 'bg-flare font-bold text-ink' : 'border border-line text-ice/50'}`}>{on ? k + 1 : '·'}</span>
                      <span className="flex-1">
                        <span className="block text-[0.95rem] text-white">
                          {tg.id} · {c.kinds[tg.kind]}
                        </span>
                        <span className="mono block text-xs text-ice/55">
                          {tg.alt} {u.km} · {c.inc} {tg.inc}° · {formatNumber(tg.mass, lang)} {u.kg}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="card p-5 sm:p-6">
              <RouteMap route={route} compare={optimal} />
              <p className="mt-2 text-xs text-ice/45">
                <span className="text-flare">━</span> {c.yourOrder} &nbsp; <span className="text-safe">┅</span> {c.optimal} &nbsp; <span className="text-orbit">●</span> {START.alt} {u.km}, {START.inc}°
              </p>
            </div>
            {route.length === 0 ? (
              <p className="card p-6 text-ice/70">{c.empty}</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: c.yourOrder, dv: yourDv, tone: 'flare' as const },
                    { label: c.greedy, dv: greedyDv, tone: 'ember' as const },
                    { label: c.optimal, dv: bestDv, tone: 'safe' as const },
                  ].map((row) => (
                    <div key={row.label} className="card p-5">
                      <p className="text-sm text-ice/70">{row.label}</p>
                      {row.dv === null ? (
                        <p className="mt-3 text-sm text-ice/50">{fill(c.tooMany, { n: EXHAUSTIVE_LIMIT })}</p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <BigStat label={c.dv} value={kms(row.dv)} tone={row.tone} />
                          <p className="mono text-xs text-ice/55">
                            {c.propellant}: {kg(routePropellant(row.dv))}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {bestDv !== null && (
                  <div className="card border-safe/30 p-6" role="status">
                    <p className="text-lg text-white">{saving > 1 ? fill(c.saving, { dv: kms(saving), kg: kg(savingKg) }) : c.savingNone}</p>
                    {saving > 1 && <p className="mt-2 text-sm text-ice/60">{fill(c.launchCost, { usd: `USD ${formatNumber(savingKg * USD_PER_KG, lang)}` })}</p>}
                  </div>
                )}
              </>
            )}
            <div className="card p-6">
              <p className="font-semibold text-white">{c.why}</p>
              <p className="mt-2 leading-relaxed text-ice/70">{c.whyBody}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <InfoBox title={t.common.formula}>{c.formula}</InfoBox>
          <InfoBox title={t.common.limits}>{c.limits}</InfoBox>
        </div>
      </Section>
    </>
  )
}
