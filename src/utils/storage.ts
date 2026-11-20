import { clamp, DEORBIT_RANGES, PROPULSION, SOLAR, type PropulsionId, type RuleId, type SolarActivity } from './deorbit'
import { TARGETS } from './removal'

/** Everything the visitor sets on the site. It stays in their own browser (localStorage); there are no accounts. */
export interface OrbitState {
  deorbit: { alt: number; mass: number; area: number; solar: SolarActivity; rule: RuleId; propulsion: PropulsionId }
  removal: { order: string[] }
  quiz: { best: number; answered: number }
  pledge: string[]
}

export const STORAGE_KEY = 'clearorbit-state-v1'

export function defaultState(): OrbitState {
  return {
    deorbit: { alt: 750, mass: 250, area: 2, solar: 'mean', rule: 'fcc', propulsion: 'hydrazine' },
    removal: { order: ['T1', 'T4', 'T6', 'T8'] },
    quiz: { best: 0, answered: 0 },
    pledge: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

export const PLEDGE_IDS = ['share', 'learn', 'apps', 'school', 'vote'] as const
const TARGET_IDS = TARGETS.map((t) => t.id)

/** Rebuilds a state from whatever was saved; every field that does not check out falls back to its default. */
export function sanitizeState(raw: unknown): OrbitState {
  const state = defaultState()
  if (!isRecord(raw)) return state

  if (isRecord(raw.deorbit)) {
    const d = raw.deorbit
    if (typeof d.alt === 'number' && Number.isFinite(d.alt)) state.deorbit.alt = clamp(d.alt, DEORBIT_RANGES.alt.min, DEORBIT_RANGES.alt.max)
    if (typeof d.mass === 'number' && Number.isFinite(d.mass)) state.deorbit.mass = clamp(d.mass, DEORBIT_RANGES.mass.min, DEORBIT_RANGES.mass.max)
    if (typeof d.area === 'number' && Number.isFinite(d.area)) state.deorbit.area = clamp(d.area, DEORBIT_RANGES.area.min, DEORBIT_RANGES.area.max)
    state.deorbit.solar = oneOf(d.solar, SOLAR, state.deorbit.solar)
    state.deorbit.rule = oneOf(d.rule, ['iadc', 'fcc'] as const, state.deorbit.rule)
    state.deorbit.propulsion = oneOf(
      d.propulsion,
      PROPULSION.map((p) => p.id),
      state.deorbit.propulsion,
    )
  }

  if (isRecord(raw.removal) && Array.isArray(raw.removal.order)) {
    const seen = new Set<string>()
    const order = raw.removal.order.filter((id): id is string => typeof id === 'string' && TARGET_IDS.includes(id) && !seen.has(id) && Boolean(seen.add(id)))
    state.removal.order = order.slice(0, TARGET_IDS.length)
  }

  if (isRecord(raw.quiz)) {
    const q = raw.quiz
    if (typeof q.best === 'number' && Number.isFinite(q.best)) state.quiz.best = clamp(Math.round(q.best), 0, 100)
    if (typeof q.answered === 'number' && Number.isFinite(q.answered)) state.quiz.answered = clamp(Math.round(q.answered), 0, 1e6)
  }

  if (Array.isArray(raw.pledge)) {
    state.pledge = [...new Set(raw.pledge.filter((p): p is string => typeof p === 'string' && (PLEDGE_IDS as readonly string[]).includes(p)))]
  }

  return state
}

export function loadState(): OrbitState {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) return defaultState()
    return sanitizeState(JSON.parse(text))
  } catch {
    // localStorage unavailable or the saved text is not JSON: start fresh
    return defaultState()
  }
}

export function saveState(state: OrbitState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore: the settings only last for this visit
  }
}
