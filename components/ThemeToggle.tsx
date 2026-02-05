'use client'

import { useTheme } from '../hooks/useTheme'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { key: 'light' as const, icon: SunIcon, label: 'Light' },
    { key: 'dark' as const, icon: MoonIcon, label: 'Dark' },
    { key: 'system' as const, icon: ComputerDesktopIcon, label: 'System' }
  ]

  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {themes.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={`
            flex items-center justify-center p-2 rounded-md transition-all duration-200
            ${theme === key 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }
          `}
          title={`Switch to ${label} mode`}
          aria-label={`Switch to ${label} mode`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}