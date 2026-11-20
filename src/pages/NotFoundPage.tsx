import { Pill } from '../components/Pill'
import { ROUTES } from '../constants/site'
import { useLanguage } from '../i18n/LanguageContext'

export function NotFoundPage() {
  const { t } = useLanguage()
  return (
    <section className="glow stars grid min-h-[80vh] place-items-center px-6 pt-[var(--header-h)] text-center">
      <div>
        <p className="display text-gradient text-[clamp(5rem,18vw,12rem)]">404</p>
        <h1 className="display mt-2 text-3xl">{t.notFound.title}</h1>
        <p className="mt-4 text-ice/70">{t.notFound.body}</p>
        <div className="mt-8">
          <Pill to={ROUTES.home}>{t.common.backHome}</Pill>
        </div>
      </div>
    </section>
  )
}
