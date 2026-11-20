import { Link } from 'react-router-dom'
import { BRAND, EXTERNAL, ROUTES } from '../constants/site'
import { useLanguage } from '../i18n/LanguageContext'
import { OrbitMark } from './Logo'

export function Footer() {
  const { t } = useLanguage()

  const tools = [
    { to: ROUTES.deorbit, label: t.nav.deorbit },
    { to: ROUTES.cleanup, label: t.nav.cleanup },
    { to: ROUTES.traffic, label: t.nav.traffic },
    { to: ROUTES.law, label: t.nav.law },
  ]
  const learn = [
    { to: ROUTES.problem, label: t.nav.problem },
    { to: ROUTES.solution, label: t.nav.solution },
    { to: ROUTES.research, label: t.nav.research },
    { to: ROUTES.about, label: t.nav.about },
  ]
  const sources = [
    { href: EXTERNAL.raceToSaveSpace, label: 'UN · The Race to Save Space' },
    { href: EXTERNAL.unOuterSpace, label: 'UN · Outer space' },
    { href: EXTERNAL.unoosa, label: 'UNOOSA' },
    { href: EXTERNAL.esaDebris, label: 'ESA Space Debris Office' },
    { href: EXTERNAL.nasaOdpo, label: 'NASA Orbital Debris Program' },
  ]
  const linkClass = 'block py-1 text-[0.95rem] text-ice/70 transition-colors hover:text-ember'

  return (
    <footer className="relative overflow-hidden border-t border-line bg-navy">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 pb-12 pt-16 sm:grid-cols-[1.3fr_1fr_1fr_1.2fr] sm:px-10">
        <div>
          <OrbitMark className="h-11 w-11" />
          <p className="mt-5 max-w-[16rem] text-[0.98rem] leading-snug text-ice/75">{t.footer.line}</p>
        </div>
        {[
          { title: t.footer.tools, links: tools },
          { title: t.footer.learn, links: learn },
        ].map((group) => (
          <div key={group.title}>
            <p className="eyebrow">{group.title}</p>
            <ul className="mt-3">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="eyebrow">{t.footer.sources}</p>
          <ul className="mt-3">
            {sources.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer noopener" className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-6 pb-4 text-xs uppercase tracking-[0.16em] text-ice/45 sm:px-10">
        <span>© 2026 {BRAND}</span>
        <span>
          {t.footer.licence} · {t.footer.open}
        </span>
      </div>

      <p
        aria-hidden="true"
        className="display pointer-events-none select-none whitespace-nowrap bg-gradient-to-b from-flare/25 to-transparent bg-clip-text text-center text-[length:calc(100vw/5.6)] !normal-case leading-[0.8] text-transparent lg:text-[length:calc((100vw-var(--sidebar-offset))/5.6)]"
        style={{ marginBottom: '-0.12em' }}
      >
        {BRAND}
      </p>
    </footer>
  )
}
