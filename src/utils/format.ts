import type { Lang } from '../i18n/translations'

const LOCALE: Record<Lang, string> = { en: 'en-GB', ro: 'ro-RO', ru: 'ru-RU' }

export function formatNumber(value: number, lang: Lang, decimals = 0): string {
  return new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

/** Rounds to a sensible number of significant digits for display. */
export function formatSmart(value: number, lang: Lang): string {
  const abs = Math.abs(value)
  if (abs === 0) return '0'
  if (abs >= 100) return formatNumber(value, lang, 0)
  if (abs >= 10) return formatNumber(value, lang, 1)
  if (abs >= 1) return formatNumber(value, lang, 2)
  return new Intl.NumberFormat(LOCALE[lang], { maximumSignificantDigits: 2 }).format(value)
}

export function formatPercent(fraction: number, lang: Lang, decimals = 0): string {
  return `${formatNumber(fraction * 100, lang, decimals)} %`
}
