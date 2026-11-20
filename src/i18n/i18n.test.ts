import { describe, expect, it } from 'vitest'
import { fill } from '../utils/text'
import { en } from './en'
import { translations, LANGS } from './translations'

/** Lists every path to a string in a translation, with array lengths, so the three languages can be compared. */
function shape(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return [path]
  if (Array.isArray(value)) return [`${path}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))]
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k))
  return [`${path}:${typeof value}`]
}

/** Placeholders like {n} used in a string. */
function placeholders(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return (value.match(/\{\w+\}/g) ?? []).map((p) => `${path}${p}`)
  if (Array.isArray(value)) return value.flatMap((v, i) => placeholders(v, `${path}[${i}]`))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => placeholders(v, path ? `${path}.${k}` : k))
  return []
}

describe('translations', () => {
  for (const lang of LANGS) {
    it(`${lang} has exactly the same keys and list lengths as English`, () => {
      expect(shape(translations[lang])).toEqual(shape(en))
    })

    it(`${lang} keeps every placeholder`, () => {
      expect(placeholders(translations[lang])).toEqual(placeholders(en))
    })

    it(`${lang} has no empty strings`, () => {
      const empty: string[] = []
      const walk = (v: unknown, p: string) => {
        if (typeof v === 'string') {
          if (!v.trim() && !p.endsWith('.suffix')) empty.push(p)
        } else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${p}.${k}`))
      }
      walk(translations[lang], lang)
      expect(empty).toEqual([])
    })
  }

  it('quiz answers point at an existing option in every language', () => {
    for (const lang of LANGS) {
      for (const item of translations[lang].law.quiz.items) expect(item.answer).toBeLessThan(item.options.length)
    }
  })
})

describe('fill', () => {
  it('replaces known placeholders and keeps unknown ones', () => {
    expect(fill('{n} of {total}', { n: 3 })).toBe('3 of {total}')
    expect(fill('no placeholders', {})).toBe('no placeholders')
  })
})
