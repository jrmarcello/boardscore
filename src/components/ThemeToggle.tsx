import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../contexts'

const themeOrder = ['system', 'light', 'dark'] as const

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const themeLabels = {
  light: 'Tema claro',
  dark: 'Tema escuro',
  system: 'Tema do sistema',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }

  const Icon = themeIcons[theme]

  return (
    <button
      onClick={cycleTheme}
      className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      title={themeLabels[theme]}
      aria-label={themeLabels[theme]}
    >
      <Icon size={18} />
    </button>
  )
}
