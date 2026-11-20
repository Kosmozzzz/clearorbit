import { useMemo } from 'react'
import { BigStat, Chips, InfoBox, RangeField, Section } from '../components/controls'
import { fill } from '../utils/text'
import { PageHeader } from '../components/PageHeader'
import { useOrbit } from '../context/orbit'
import { useLanguage } from '../i18n/LanguageContext'
import { DEORBIT_RANGES, lifetimeYears, MAX_YEARS, planDisposal, PROPULSION, RULES, SOLAR } from '../utils/deorbit'
import { formatNumber, formatPercent, formatSmart } from '../utils/format'

const PRESETS = [
  { id: 'cubesat', mass: 4, area: 0.03, alt: 550 },
  { id: 'smallsat', mass: 250, area: 2, alt: 750 },
  { id: 'large', mass: 1500, area: 12, alt: 800 },
] as const

/** Lifetime against altitude for the current satellite, on a log scale, with the rule as a line. */
function LifetimeChart({ mass, area, solar, rule, alt }: { mass: number; area: number; solar: (typeof SOLAR)[number]; rule: number; alt: number }) {
  const { t, lang } = useLanguage()
  const points = useMemo(() => {
    const out: { alt: number; years: number }[] = []
    for (let a = 300; a <= 1200; a += 20) out.push({ alt: a, years: lifetimeYears(a, { mass, area }, solar) })
    return out
  }, [mass, area, solar])
  const W = 600
  const H = 260
  const pad = { l: 46, r: 12, t: 12, b: 30 }
  const x = (a: number) => pad.l + ((a - 300) / 900) * (W - pad.l - pad.r)
  const logMin = Math.log10(0.01)
  const logMax = Math.log10(MAX_YEARS)
  const y = (yrs: number) => {
    const v = Math.log10(Math.min(MAX_YEARS, Math.max(0.01, yrs)))
    return H - pad.b - ((v - logMin) / (logMax - logMin)) * (H - pad.t - pad.b)
  }
  return (
    <div className="card p-5 sm:p-6">
      <p className="eyebrow !text-ice/55">{t.deorbit.altitudeChart}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={t.deorbit.altitudeChart}>
        {[0.1, 1, 10, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="rgba(190,205,255,0.08)" />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="rgba(219,230,255,0.5)">
              {formatNumber(v, lang, v < 1 ? 1 : 0)}
            </text>
          </g>
        ))}
        {[300, 500, 700, 900, 1100].map((a) => (
          <text key={a} x={x(a)} y={H - 8} textAnchor="middle" fontSize="11" fill="rgba(219,230,255,0.5)">
            {a} km
          </text>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={y(rule)} y2={y(rule)} stroke="#4ade9b" strokeDasharray="5 4" />
        <polyline fill="none" stroke="#ff7a3d" strokeWidth="2.5" points={points.map((p) => `${x(p.alt)},${y(p.years)}`).join(' ')} />
        <line x1={x(alt)} x2={x(alt)} y1={pad.t} y2={H - pad.b} stroke="rgba(255,255,255,0.35)" />
        <circle cx={x(alt)} cy={y(lifetimeYears(alt, { mass, area }, solar))} r="5" fill="#fff" />
      </svg>
    </div>
  )
}

export function DeorbitPage() {
  const { t, lang } = useLanguage()
  const d = t.deorbit
  const u = t.common.units
  const { state, update } = useOrbit()
  const s = state.deorbit
  const set = (patch: Partial<typeof s>) => update('deorbit', { ...s, ...patch })

  const ruleYears = RULES.find((r) => r.id === s.rule)!.years
  const isp = PROPULSION.find((p) => p.id === s.propulsion)!.isp
  const plan = useMemo(() => planDisposal(s.alt, { mass: s.mass, area: s.area }, ruleYears, isp, s.solar), [s.alt, s.mass, s.area, s.solar, ruleYears, isp])

  const lifeText = plan.lifetime >= MAX_YEARS ? `${d.moreThan} ${MAX_YEARS}` : formatSmart(plan.lifetime, lang)

  return (
    <>
      <PageHeader eyebrow={d.eyebrow} title={d.title} sub={d.sub} />
      <Section>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="card min-w-0 space-y-8 p-6 sm:p-8">
            <div>
              <p className="mb-3 text-[0.95rem] text-ice/85">{d.presets.title}</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" className="pill pill-ghost !text-sm" onClick={() => set({ mass: p.mass, area: p.area, alt: p.alt })}>
                    {d.presets[p.id]}
                  </button>
                ))}
              </div>
            </div>
            <RangeField id="d-alt" label={d.alt} value={s.alt} {...DEORBIT_RANGES.alt} onChange={(alt) => set({ alt })} display={`${formatNumber(s.alt, lang)} ${u.km}`} />
            <RangeField id="d-mass" label={d.mass} value={s.mass} {...DEORBIT_RANGES.mass} onChange={(mass) => set({ mass })} display={`${formatNumber(s.mass, lang)} ${u.kg}`} />
            <RangeField id="d-area" label={d.area} value={s.area} {...DEORBIT_RANGES.area} onChange={(area) => set({ area })} display={`${formatNumber(s.area, lang, 2)} ${u.m2}`} />
            <Chips label={d.solar} value={s.solar} onChange={(solar) => set({ solar })} options={SOLAR.map((id) => ({ id, label: d.solarOptions[id] }))} />
            <Chips label={d.rule} value={s.rule} onChange={(rule) => set({ rule })} options={RULES.map((r) => ({ id: r.id, label: d.rules[r.id] }))} />
            <Chips label={d.propulsion} value={s.propulsion} onChange={(propulsion) => set({ propulsion })} options={PROPULSION.map((p) => ({ id: p.id, label: d.propulsionOptions[p.id] }))} />
          </div>

          <div className="min-w-0 space-y-6">
            <div className={`card p-6 sm:p-8 ${plan.compliantNow ? 'border-safe/40' : 'border-danger/40'}`}>
              <BigStat label={d.lifetime} value={`${lifeText} ${u.years}`} tone={plan.compliantNow ? 'safe' : 'danger'} />
              <p className={`mt-4 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${plan.compliantNow ? 'bg-safe/15 text-safe' : 'bg-danger/15 text-danger'}`} role="status">
                {plan.compliantNow ? d.compliant : d.notCompliant}
              </p>
            </div>
            {!plan.compliantNow && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card p-6">
                  <p className="font-semibold text-white">{d.planLower}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ice/65">{fill(d.planLowerBody, { alt: formatNumber(plan.targetAlt, lang) })}</p>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <BigStat label={d.dv} value={`${formatNumber(plan.lowerDv, lang)} ${u.ms}`} tone="orbit" />
                    <BigStat label={d.propellant} value={`${formatSmart(plan.lowerPropellant, lang)} ${u.kg}`} note={`${formatPercent(plan.lowerPropellant / s.mass, lang, 1)} ${d.share}`} tone="ember" />
                  </div>
                </div>
                <div className="card p-6">
                  <p className="font-semibold text-white">{d.planReentry}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ice/65">{d.planReentryBody}</p>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <BigStat label={d.dv} value={`${formatNumber(plan.reentryDv, lang)} ${u.ms}`} tone="orbit" />
                    <BigStat label={d.propellant} value={`${formatSmart(plan.reentryPropellant, lang)} ${u.kg}`} note={`${formatPercent(plan.reentryPropellant / s.mass, lang, 1)} ${d.share}`} tone="ember" />
                  </div>
                </div>
              </div>
            )}
            <LifetimeChart mass={s.mass} area={s.area} solar={s.solar} rule={ruleYears} alt={s.alt} />
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <InfoBox title={t.common.formula}>{d.formula}</InfoBox>
          <InfoBox title={t.common.limits}>{d.limits}</InfoBox>
        </div>
      </Section>
    </>
  )
}
