import { createContext } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

export type ThemeContextValue = {
  preference: ThemePreference
  resolved: 'light' | 'dark'
  setPreference: (t: ThemePreference) => void
  cyclePreference: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
