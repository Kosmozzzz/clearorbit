import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Section, SectionHead } from '../components/controls'
import { EarthScene } from '../components/EarthScene'
import { Pill } from '../components/Pill'
import { Reveal } from '../components/Reveal'
import { StatTile } from '../components/StatTile'
import { ROUTES, TOOL_ROUTES } from '../constants/site'
import { useInView } from '../hooks/useInView'
import { useLanguage } from '../i18n/LanguageContext'
import { formatNumber } from '../utils/format'
import { scrollToY } from '../utils/scroll'

function Hero() {
  const { t } = useLanguage()
  const h = t.home.hero
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden px-5 pb-16 pt-[calc(var(--header-h)+2rem)] sm:items-center sm:px-10 sm:pb-24">
      <div className="absolute inset-0">
        <EarthScene />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      <div className="relative mx-auto w-full max-w-[1200px]">
        <p className="eyebrow rise-in">{h.eyebrow}</p>
        <h1 className="display rise-in mt-6 text-[clamp(3.2rem,10vw,8.5rem)]" style={{ animationDelay: '0.1s' }}>
          <span className="block">{h.title1}</span>
          <span className="text-gradient block">{h.title2}</span>
        </h1>
        <p className="rise-in mt-7 max-w-xl text-lg leading-relaxed text-ice/80 sm:text-xl" style={{ animationDelay: '0.2s' }}>
          {h.sub}
        </p>
        <div className="rise-in mt-9 flex flex-wrap gap-3" style={{ animationDelay: '0.3s' }}>
          <Pill onClick={() => scrollToY(window.innerHeight * 0.92)}>{h.cta}</Pill>
          <Pill to={ROUTES.problem} plain>
            {t.home.ctaSecondary}
          </Pill>
        </div>
      </div>
    </section>
  )
}

function History() {
  const { t } = useLanguage()
  const items = t.home.history.items
  const [active, setActive] = useState(0)
  const item = items[active]
  return (
    <Section>
      <SectionHead eyebrow={t.home.history.eyebrow} title={t.home.history.title} body={t.home.history.body} />
      <Reveal className="mt-14">
        <div className="card overflow-hidden">
          <div className="flex overflow-x-auto border-b border-line" role="tablist" data-lenis-prevent>
            {items.map((it, i) => (
              <button
                key={it.year}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={`mono shrink-0 border-r border-line px-5 py-4 text-sm transition-colors ${i === active ? 'bg-flare/15 text-ember' : 'text-ice/55 hover:text-white'}`}
              >
                {it.year}
              </button>
            ))}
          </div>
          <div className="grid items-center gap-6 p-7 sm:grid-cols-[auto_1fr] sm:gap-12 sm:p-12" role="tabpanel">
            <p className="display text-gradient text-[clamp(4rem,12vw,9rem)]">{item.year}</p>
            <div>
              <p className="statement text-[clamp(1.3rem,2.4vw,2rem)] text-white">{item.text}</p>
              <div className="mt-8 flex gap-2">
                <button type="button" className="pill pill-ghost" disabled={active === 0} onClick={() => setActive((a) => a - 1)} aria-label="Previous">
                  ←
                </button>
                <button type="button" className="pill pill-ghost" disabled={active === items.length - 1} onClick={() => setActive((a) => a + 1)} aria-label="Next">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

function Launches() {
  const { t, lang } = useLanguage()
  const l = t.home.launches
  const { ref, seen } = useInView<HTMLDivElement>(0.3)
  const max = Math.max(...l.bars.map((b) => b.value))
  return (
    <Section className="border-t border-line">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-end">
        <div>
          <SectionHead eyebrow={l.eyebrow} title={l.title} body={l.body} />
          <div className="card mt-10 p-6">
            <p className="eyebrow">{l.didYouKnowTitle}</p>
            <p className="mt-3 text-lg leading-relaxed text-ice/85">{l.didYouKnow}</p>
          </div>
        </div>
        <div ref={ref}>
          <div className="flex h-[22rem] items-end gap-3 sm:gap-5">
            {l.bars.map((b, i) => (
              <div key={b.label} className="flex h-full flex-1 flex-col justify-end">
                <p className="display mb-2 text-center text-xl text-white sm:text-2xl">{formatNumber(b.value, lang)}</p>
                <div
                  className="rounded-t-xl bg-gradient-to-t from-flare/40 to-ember transition-[height] duration-[1400ms] ease-[var(--ease-out-expo)]"
                  style={{ height: seen ? `${Math.max(3, (b.value / max) * 100)}%` : '0%', transitionDelay: `${i * 120}ms` }}
                />
                <p className="mono mt-3 text-center text-xs text-ice/70">{b.label}</p>
                <p className="mt-1 text-center text-[0.7rem] leading-tight text-ice/40">{b.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 border-l-2 border-flare pl-4 text-lg text-ice/85">{l.future}</p>
          <p className="mt-3 text-xs text-ice/45">{l.source}</p>
        </div>
      </div>
    </Section>
  )
}

const SERVICE_ICONS = ['M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z', 'M4 14a5 5 0 0 1 9-3 4 4 0 1 1 3 7H6a3 3 0 0 1-2-4z', 'M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20', 'M12 3v18M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H7', 'M3 7h18v11H3zM8 21h8M12 3l3 4M12 3L9 7', 'M12 2l9 16H3z M12 9v4 M12 16v.5']

function Daily() {
  const { t } = useLanguage()
  const d = t.home.daily
  return (
    <Section className="border-t border-line">
      <SectionHead eyebrow={d.eyebrow} title={d.title} body={d.body} />
      <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {d.services.map((s, i) => (
          <Reveal key={s.title} delay={i * 60} className="bg-navy p-7">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-orbit" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={SERVICE_ICONS[i]} />
            </svg>
            <p className="mt-5 text-lg font-semibold text-white">{s.title}</p>
            <p className="mt-2 leading-relaxed text-ice/65">{s.body}</p>
          </Reveal>
        ))}
      </div>

      <div className="mt-24">
        <p className="eyebrow">{d.sdgEyebrow}</p>
        <h3 className="display mt-4 text-[clamp(1.6rem,3vw,2.4rem)]">{d.sdgTitle}</h3>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.sdgs.map((s, i) => (
            <Reveal key={s.goal} delay={i * 80} className="card p-6">
              <p className="mono text-sm text-ember">{s.goal}</p>
              <p className="mt-3 text-lg font-semibold text-white">{s.title}</p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ice/65">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}

function ProblemTeaser() {
  const { t } = useLanguage()
  const p = t.home.problemTeaser
  return (
    <Section className="glow border-t border-line">
      <SectionHead eyebrow={p.eyebrow} title={p.title} body={p.body} />
      <div className="mt-12 grid border-y border-line md:grid-cols-3">
        {p.stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>
      <div className="mt-10">
        <Pill to={ROUTES.problem}>{p.cta}</Pill>
      </div>
    </Section>
  )
}

function Solutions() {
  const { t } = useLanguage()
  const s = t.home.solutions
  return (
    <Section className="border-t border-line">
      <SectionHead eyebrow={s.eyebrow} title={s.title} />
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {s.cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 80}>
            <Link to={TOOL_ROUTES[i]} className="card group flex h-full flex-col p-7 transition-colors hover:border-flare/60 sm:p-9">
              <div className="flex items-center justify-between">
                <span className="mono text-sm text-ice/40">0{i + 1}</span>
                <span className="rounded-full border border-line px-3 py-1 text-xs text-ember">{c.tag}</span>
              </div>
              <p className="display mt-8 text-[clamp(1.5rem,2.6vw,2.1rem)]">{c.title}</p>
              <p className="mt-4 flex-1 leading-relaxed text-ice/70">{c.body}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-ember">
                {c.cta} <span aria-hidden="true">→</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

function Faq() {
  const { t } = useLanguage()
  const f = t.home.faq
  return (
    <Section className="border-t border-line">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHead eyebrow={f.eyebrow} title={f.title} />
        <div className="divide-y divide-line border-y border-line">
          {f.items.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg text-white [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="text-2xl text-ember transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-2xl leading-relaxed text-ice/70">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function HomePage() {
  const { t } = useLanguage()
  return (
    <>
      <Hero />
      <History />
      <Launches />
      <Daily />
      <ProblemTeaser />
      <Solutions />
      <Faq />
      <Section className="glow stars border-t border-line text-center">
        <h2 className="display mx-auto max-w-4xl text-[clamp(2.2rem,5.5vw,4.6rem)] text-balance">{t.home.ctaTitle}</h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Pill to={ROUTES.traffic}>{t.home.ctaPrimary}</Pill>
          <Pill to={ROUTES.problem} plain>
            {t.home.ctaSecondary}
          </Pill>
        </div>
      </Section>
    </>
  )
}
