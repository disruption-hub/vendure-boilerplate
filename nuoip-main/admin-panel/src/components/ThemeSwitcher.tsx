'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load theme from localStorage or default to light
    const savedTheme = localStorage.getItem('admin-theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Apply theme
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Save to localStorage
    localStorage.setItem('admin-theme', theme)
  }, [theme, mounted])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-8 w-8">
        <div className="h-4 w-4 rounded-full border-2 border-border animate-pulse" />
      </div>
    )
  }

  const themes: Array<{ id: Theme; label: string; icon: typeof Sun }> = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  const currentTheme = themes.find(t => t.id === theme) || themes[0]
  const CurrentIcon = currentTheme.icon

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center justify-center h-8 w-8 rounded-md text-icon-primary hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        onClick={() => {
          const currentIndex = themes.findIndex(t => t.id === theme)
          const nextIndex = (currentIndex + 1) % themes.length
          setTheme(themes[nextIndex].id)
        }}
        aria-label={`Switch theme. Current: ${currentTheme.label}`}
        title={`Current theme: ${currentTheme.label}. Click to switch.`}
      >
        <CurrentIcon className="h-5 w-5" />
      </button>
    </div>
  )
}

