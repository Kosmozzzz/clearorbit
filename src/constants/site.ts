export const BRAND = 'ClearOrbit'

export const AUTHOR = 'Cosmin Marandici'

export const ROUTES = {
  home: '/',
  problem: '/problem',
  solution: '/solution',
  deorbit: '/deorbit',
  cleanup: '/cleanup',
  traffic: '/traffic',
  law: '/space-law',
  research: '/research',
  about: '/about',
} as const

/** The four tools, in the order of the four solutions. */
export const TOOL_ROUTES = [ROUTES.deorbit, ROUTES.cleanup, ROUTES.traffic, ROUTES.law] as const

export const EXTERNAL = {
  unOuterSpace: 'https://www.un.org/en/global-issues/outer-space',
  raceToSaveSpace: 'https://www.un.org/en/content/feature/theracetosavespace/',
  unoosa: 'https://www.unoosa.org',
  esaDebris: 'https://www.esa.int/Space_Safety/Space_Debris/Space_debris_by_the_numbers',
  nasaOdpo: 'https://orbitaldebris.jsc.nasa.gov',
  lts: 'https://www.unoosa.org/oosa/en/ourwork/topics/long-term-sustainability-of-outer-space-activities.html',
  repo: 'https://github.com/Kosmozzzz/clearorbit',
} as const
