import { useCountUp } from '../hooks/useCountUp'
import { useInView } from '../hooks/useInView'
import { useLanguage } from '../i18n/LanguageContext'
import { formatNumber } from '../utils/format'

interface StatTileProps {
  value: number
  suffix: string
  label: string
  source: string
}

/** A large counting number with its label and where it comes from. */
export function StatTile({ value, suffix, label, source }: StatTileProps) {
  const { lang } = useLanguage()
  const { ref, seen } = useInView<HTMLDivElement>(0.3)
  const shown = useCountUp(seen ? value : 0, 1600)
  const decimals = Number.isInteger(value) ? 0 : 1

  return (
    <div ref={ref} className="border-line px-2 py-10 sm:px-8 [&:not(:first-child)]:border-t md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-t-0">
      <p className="display text-gradient whitespace-nowrap text-[clamp(2.2rem,4vw,3.6rem)] !normal-case">
        {formatNumber(shown, lang, decimals)}
        <span className="text-[0.5em]">{suffix}</span>
      </p>
      <p className="mt-4 max-w-[17rem] text-[0.98rem] leading-snug text-ice/85">{label}</p>
      <p className="mt-3 text-xs text-ice/45">{source}</p>
    </div>
  )
}
