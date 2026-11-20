import { NavLink } from 'react-router-dom'
import { ROUTES } from '../constants/site'
import { useOrbit } from '../context/orbit'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../utils/text'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Pill } from './Pill'

interface NavItem {
  to: string
  label: string
  index?: string
  end?: boolean
}

function NavGroup({ title, items, onNavigate }: { title?: string; items: NavItem[]; onNavigate?: () => void }) {
  return (
    <div>
      {title ? <p className="eyebrow px-3 pb-2 pt-5 !text-ice/45">{title}</p> : <div className="h-4" />}
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2 text-[0.95rem] transition-colors ${isActive ? 'bg-white/[0.07] text-white' : 'text-ice/65 hover:bg-white/[0.04] hover:text-white'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${isActive ? 'bg-flare shadow-[0_0_10px_#ff7a3d]' : 'bg-ice/25 group-hover:bg-ice/60'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.index && <span className="mono text-[0.65rem] text-ice/35">{item.index}</span>}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The navigation shared by the fixed right-hand panel and the mobile drawer. */
export function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage()
  const { state } = useOrbit()

  const learn: NavItem[] = [
    { to: ROUTES.home, label: t.nav.home, end: true },
    { to: ROUTES.problem, label: t.nav.problem },
    { to: ROUTES.solution, label: t.nav.solution },
  ]
  const tools: NavItem[] = [
    { to: ROUTES.deorbit, label: t.nav.deorbit, index: '01' },
    { to: ROUTES.cleanup, label: t.nav.cleanup, index: '02' },
    { to: ROUTES.traffic, label: t.nav.traffic, index: '03' },
    { to: ROUTES.law, label: t.nav.law, index: '04' },
  ]
  const other: NavItem[] = [
    { to: ROUTES.research, label: t.nav.research },
    { to: ROUTES.about, label: t.nav.about },
  ]
  const pledged = state.pledge.length

  return (
    <div className="flex h-full flex-col">
      <p className="eyebrow px-3 pt-3">{t.nav.tagline}</p>

      <nav className="flex-1 overflow-y-auto pb-2" aria-label="Primary" data-lenis-prevent>
        <NavGroup title={t.nav.groupLearn} items={learn} onNavigate={onNavigate} />
        <NavGroup title={t.nav.groupTools} items={tools} onNavigate={onNavigate} />
        <NavGroup items={other} onNavigate={onNavigate} />
      </nav>

      <div className="space-y-3 pt-2">
        <NavLink to={`${ROUTES.law}#pledge`} onClick={onNavigate} className="block rounded-2xl border border-line bg-ink/40 px-4 py-3">
          <p className="eyebrow !text-[0.6rem] !text-ice/50">{t.nav.pledgeLabel}</p>
          {pledged > 0 ? (
            <div className="mt-2">
              <div className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((k) => (
                  <span key={k} className={`h-1.5 flex-1 rounded-full ${k < pledged ? 'bg-flare' : 'bg-white/10'}`} />
                ))}
              </div>
              <p className="mt-2 text-sm text-ember">{fill(t.nav.pledgeCount, { n: pledged })}</p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-ice/60">{t.nav.pledgeEmpty}</p>
          )}
        </NavLink>
        <LanguageSwitcher />
        <Pill to={ROUTES.traffic} onClick={onNavigate} className="w-full justify-between">
          {t.nav.cta}
        </Pill>
      </div>
    </div>
  )
}
