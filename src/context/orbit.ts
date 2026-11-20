import { createContext, useContext } from 'react'
import type { OrbitState } from '../utils/storage'

export interface OrbitContextValue {
  state: OrbitState
  update: <K extends keyof OrbitState>(key: K, value: OrbitState[K]) => void
}

export const OrbitContext = createContext<OrbitContextValue | null>(null)

export function useOrbit(): OrbitContextValue {
  const ctx = useContext(OrbitContext)
  if (!ctx) throw new Error('useOrbit must be used within an OrbitProvider')
  return ctx
}
