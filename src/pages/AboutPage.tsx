import { Section } from '../components/controls'
import { PageHeader } from '../components/PageHeader'
import { AUTHOR, EXTERNAL } from '../constants/site'
import { useLanguage } from '../i18n/LanguageContext'

const SOURCES = [
  { label: 'UN DGC & UNOOSA — The Race to Save Space (2025)', href: EXTERNAL.raceToSaveSpace },
  { label: 'United Nations — Global issues: Outer space', href: EXTERNAL.unOuterSpace },
  { label: 'ESA Space Debris Office — Space debris by the numbers', href: EXTERNAL.esaDebris },
  { label: 'NASA Orbital Debris Program Office — Quarterly News', href: EXTERNAL.nasaOdpo },
  { label: 'UNOOSA — Guidelines for the Long-term Sustainability of Outer Space Activities (2019)', href: EXTERNAL.lts },
  { label: 'Kessler, D. J. & Cour-Palais, B. G. (1978). Collision frequency of artificial satellites. J. Geophys. Res. 83(A6)', href: 'https://doi.org/10.1029/JA083iA06p02637' },
  { label: 'Hoots, F. R., Crawford, L. L. & Roehrich, R. L. (1984). An analytic method to determine future close approaches between satellites. Celestial Mechanics 33', href: 'https://doi.org/10.1007/BF01230624' },
  { label: 'Vallado, D. A. (2013). Fundamentals of Astrodynamics and Applications, 4th ed. Microcosm Press', href: 'https://www.celestrak.com/software/vallado-sw.php' },
]

export function AboutPage() {
  const { t } = useLanguage()
  const a = t.about
  return (
    <>
      <PageHeader eyebrow={a.eyebrow} title={a.title} sub={a.sub} />
      <Section>
        <p className="eyebrow">{a.teamTitle}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="card p-7">
            <p className="eyebrow">{a.author}</p>
            <p className="mt-3 text-lg font-semibold text-white">{AUTHOR}</p>
            <p className="mt-3 leading-relaxed text-ice/70">{a.authorBody}</p>
          </div>
          <div className="card p-7">
            <p className="eyebrow">{a.school}</p>
            <p className="mt-3 text-lg font-semibold text-white">{a.schoolName}</p>
          </div>
          <div className="card p-7">
            <p className="eyebrow">{a.supervisor}</p>
            <p className="mt-3 text-lg font-semibold text-white">Azamat Jayush</p>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          <div className="card p-7">
            <p className="eyebrow">{a.privacyTitle}</p>
            <p className="mt-4 leading-relaxed text-ice/80">{a.privacy}</p>
          </div>
          <div className="card p-7">
            <p className="eyebrow">{a.aiTitle}</p>
            <p className="mt-4 leading-relaxed text-ice/80">{a.ai}</p>
          </div>
        </div>

        <div className="mt-16">
          <p className="eyebrow">{a.sourcesTitle}</p>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {SOURCES.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer noopener" className="flex items-center justify-between gap-6 py-4 text-ice/80 transition-colors hover:text-ember">
                  <span>{s.label}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-ice/55">{a.licence}</p>
        </div>
      </Section>
    </>
  )
}
