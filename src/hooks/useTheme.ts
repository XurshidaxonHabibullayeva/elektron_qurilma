import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from '@/contexts/theme-context'

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme faqat ThemeProvider ichida ishlatilishi kerak')
  }
  return ctx
}
