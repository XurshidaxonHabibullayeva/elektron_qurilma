import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  ThemeContext,
  type ThemePreference,
} from '@/contexts/theme-context'

const STORAGE_KEY = 'flipedu-theme'

function readStored(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      return raw
    }
  } catch {
    /* ignore */
  }
  return 'system'
}

function systemIsDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStored)
  const [osDark, setOsDark] = useState(() =>
    typeof window !== 'undefined' ? systemIsDark() : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setOsDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: 'light' | 'dark' =
    preference === 'system' ? (osDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  const setPreference = useCallback((t: ThemePreference) => {
    setPreferenceState(t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* ignore */
    }
  }, [])

  const cyclePreference = useCallback(() => {
    setPreferenceState((prev) => {
      const next: ThemePreference =
        prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference,
      cyclePreference,
    }),
    [preference, resolved, setPreference, cyclePreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
