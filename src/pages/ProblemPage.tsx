import { useState } from 'react'
import { CascadeChart } from '../components/CascadeChart'
import { BigStat, Chips, InfoBox, RangeField, Section, SectionHead } from '../components/controls'
import { KesslerSim } from '../components/KesslerSim'
import { PageHeader } from '../components/PageHeader'
import { Pill } from '../components/Pill'
import { Reveal } from '../components/Reveal'
import { ROUTES } from '../constants/site'
import { useLanguage } from '../i18n/LanguageContext'
import { formatNumber, formatSmart } from '../utils/format'
import { carsEquivalent, kineticEnergy, PROJECTILES, SPEED_RANGE, tntGrams, type ProjectileId } from '../utils/impact'

function Sizes() {
  const { t } = useLanguage()
  const s = t.problem.sizes
  const dots = [3, 9, 18]
  return (
    <Section>
      <p className="eyebrow">{s.eyebrow}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {s.items.map((it, i) => (
          <Reveal key={it.label} delay={i * 100} className="card flex flex-col p-7">
            <div className="flex h-20 items-center">
              <span className="rounded-full bg-gradient-to-br from-ember to-flare" style={{ width: dots[i] * 2, height: dots[i] * 2 }} />
            </div>
            <p className="display text-gradient mt-4 text-[clamp(2.2rem,4vw,3.4rem)] !normal-case">{it.value}</p>
            <p className="mt-2 text-lg font-semibold text-white">{it.label}</p>
            <p className="mt-3 leading-relaxed text-ice/65">{it.note}</p>
          </Reveal>
        ))}
      </div>
      <p className="mt-5 text-xs text-ice/45">{s.source}</p>

      <Reveal className="mt-16">
        <div className="card grid items-center gap-8 p-8 sm:grid-cols-[auto_1fr] sm:p-12">
          <p className="display text-[clamp(3rem,9vw,6.5rem)] text-white">
            {t.problem.mass.value}
            <span className="ml-3 text-[0.35em] text-ember">{t.problem.mass.unit}</span>
          </p>
          <div>
            <p className="text-xl leading-relaxed text-ice/85">{t.problem.mass.body}</p>
            <p className="mt-3 text-xs text-ice/45">{t.problem.mass.source}</p>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

function Impact() {
  const { t, lang } = useLanguage()
  const im = t.problem.impact
  const [projectile, setProjectile] = useState<ProjectileId>('bolt')
  const [speed, setSpeed] = useState(10)
  const grams = PROJECTILES.find((p) => p.id === projectile)!.grams
  const joules = kineticEnergy(grams, speed)
  const energyText = joules >= 1e6 ? `${formatSmart(joules / 1e6, lang)} ${t.common.units.mj}` : joules >= 1e3 ? `${formatSmart(joules / 1e3, lang)} ${t.common.units.kj}` : `${formatSmart(joules, lang)} J`
  const tnt = tntGrams(joules)
  const tntText = tnt >= 1000 ? `${formatSmart(tnt / 1000, lang)} kg` : `${formatSmart(tnt, lang)} ${t.common.units.g}`

  return (
    <Section className="border-t border-line">
      <SectionHead eyebrow={im.eyebrow} title={im.title} body={im.body} />
      <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="card space-y-8 p-6 sm:p-8">
          <Chips label={im.object} value={projectile} onChange={setProjectile} options={PROJECTILES.map((p) => ({ id: p.id, label: im.projectiles[p.id] }))} />
          <RangeField id="impact-speed" label={im.speed} value={speed} min={SPEED_RANGE.min} max={SPEED_RANGE.max} step={SPEED_RANGE.step} onChange={setSpeed} display={`${formatNumber(speed, lang, 1)} ${t.common.units.kms}`} />
        </div>
        <div className="card grid content-center gap-8 p-6 sm:p-8">
          <BigStat label={im.energy} value={energyText} tone="flare" />
          <div className="grid grid-cols-2 gap-6">
            <BigStat label={im.tnt} value={tntText} tone="ember" />
            <BigStat label={im.cars} value={`× ${formatSmart(carsEquivalent(joules), lang)}`} note={im.carsNote} tone="white" />
          </div>
        </div>
      </div>
      <div className="mt-4">
        <InfoBox title={t.common.formula}>{im.formula}</InfoBox>
      </div>
    </Section>
  )
}

export function ProblemPage() {
  const { t } = useLanguage()
  const p = t.problem
  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} sub={p.sub} />
      <Sizes />
      <Impact />

      <Section className="border-t border-line">
        <SectionHead eyebrow={p.cascade.eyebrow} title={p.cascade.title} body={p.cascade.body} />
        <div className="mt-12">
          <KesslerSim />
        </div>
      </Section>

      <Section className="border-t border-line">
        <SectionHead eyebrow={p.events.eyebrow} title={p.events.title} />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {p.events.items.map((e, i) => (
            <Reveal key={e.year} delay={i * 100} className="card p-7">
              <p className="display text-4xl text-flare">{e.year}</p>
              <p className="mt-4 text-lg font-semibold text-white">{e.title}</p>
              <p className="mt-3 leading-relaxed text-ice/65">{e.body}</p>
            </Reveal>
          ))}
        </ol>
        <p className="mt-5 text-xs text-ice/45">{p.events.source}</p>
      </Section>

      <Section className="border-t border-line">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow={p.model.eyebrow} title={p.model.title} body={p.model.body} />
          <span className="rounded-full border border-ember/50 px-4 py-1.5 text-xs text-ember">{t.common.model}</span>
        </div>
        <div className="mt-12">
          <CascadeChart />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ice/50">{p.model.note}</p>
      </Section>

      <Section className="border-t border-line">
        <SectionHead eyebrow={p.threats.eyebrow} title={p.threats.title} body={p.threats.body} />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {p.threats.items.map((it, i) => (
            <Reveal key={it.title} delay={i * 80} className="card p-7">
              <p className="mono text-sm text-danger">0{i + 1}</p>
              <p className="mt-4 text-lg font-semibold text-white">{it.title}</p>
              <p className="mt-2 leading-relaxed text-ice/65">{it.body}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 max-w-3xl border-l-2 border-flare pl-4 text-lg text-ice/85">{p.threats.pact}</p>
      </Section>

      <Section className="glow border-t border-line">
        <SectionHead eyebrow={p.economy.eyebrow} title={p.economy.title} body={p.economy.body} />
        <div className="mt-12 grid max-w-3xl grid-cols-2 gap-6">
          <div className="card p-7">
            <p className="mono text-sm text-ice/55">{p.economy.y2022}</p>
            <p className="display mt-3 text-[clamp(1.6rem,3.5vw,2.8rem)] !normal-case text-white">{p.economy.v2022}</p>
          </div>
          <div className="card border-flare/40 p-7">
            <p className="mono text-sm text-ember">{p.economy.y2030}</p>
            <p className="display text-gradient mt-3 text-[clamp(1.6rem,3.5vw,2.8rem)] !normal-case">{p.economy.v2030}</p>
          </div>
        </div>
        <p className="mt-5 text-xs text-ice/45">{p.economy.source}</p>
        <div className="mt-12">
          <Pill to={ROUTES.solution}>{t.nav.solution}</Pill>
        </div>
      </Section>
    </>
  )
}
