import { createContext } from 'react'

type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark' // The actual theme being applied
}

export const ThemeContext = createContext<ThemeContextType | null>(null)
