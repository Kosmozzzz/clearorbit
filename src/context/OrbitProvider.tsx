import { useEffect, useState, type ReactNode } from 'react'
import { loadState, saveState, type OrbitState } from '../utils/storage'
import { OrbitContext } from './orbit'

/** Holds what the visitor sets across the site and saves it to localStorage on every change. */
export function OrbitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrbitState>(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  function update<K extends keyof OrbitState>(key: K, value: OrbitState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  return <OrbitContext.Provider value={{ state, update }}>{children}</OrbitContext.Provider>
}
