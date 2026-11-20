import { Section } from '../components/controls'
import { PageHeader } from '../components/PageHeader'
import { Pill } from '../components/Pill'
import { Reveal } from '../components/Reveal'
import { TOOL_ROUTES } from '../constants/site'
import { useLanguage } from '../i18n/LanguageContext'

export function SolutionPage() {
  const { t } = useLanguage()
  const s = t.solution
  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} sub={s.sub} />
      {s.items.map((it, i) => (
        <Section key={it.n} className={i ? 'border-t border-line' : ''}>
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="display text-[clamp(4rem,10vw,7rem)] text-white/10">{it.n}</p>
                <p className="eyebrow mt-2">{it.tag}</p>
                <h2 className="display mt-4 text-[clamp(2rem,4.5vw,3.4rem)]">{it.title}</h2>
                <div className="mt-8">
                  <Pill to={TOOL_ROUTES[i]}>{it.cta}</Pill>
                </div>
              </div>
              <div className="space-y-5">
                <p className="text-xl leading-relaxed text-ice/85">{it.body}</p>
                <div className="card p-6">
                  <p className="eyebrow !text-orbit">{s.exampleLabel}</p>
                  <p className="mt-3 leading-relaxed text-ice/80">{it.example}</p>
                </div>
                <div className="card border-danger/30 p-6">
                  <p className="eyebrow !text-danger">{s.catchLabel}</p>
                  <p className="mt-3 leading-relaxed text-ice/80">{it.catchText}</p>
                </div>
              </div>
            </div>
          </Reveal>
        </Section>
      ))}
    </>
  )
}
