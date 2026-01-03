'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

export function ThemeSwitcher({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Get initial theme from localStorage or system preference
    const stored = localStorage.getItem('theme') as Theme | null
    const initialTheme = stored || 'system'
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    let actualTheme: 'light' | 'dark' = 'dark'

    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      actualTheme = systemPrefersDark ? 'dark' : 'light'
    } else {
      actualTheme = newTheme
    }

    if (actualTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    setResolvedTheme(actualTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  const themes = [
    {
      value: 'light' as const,
      label: 'Claro',
      icon: Sun,
      description: 'Tema claro',
    },
    {
      value: 'dark' as const,
      label: 'Oscuro',
      icon: Moon,
      description: 'Tema oscuro',
    },
    {
      value: 'system' as const,
      label: 'Sistema',
      icon: Monitor,
      description: 'Usar preferencia del sistema',
    },
  ]

  const currentTheme = themes.find((t) => t.value === theme) || themes[2]
  const CurrentIcon = currentTheme.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative hover:bg-slate-100 dark:hover:bg-slate-800', className)}
        >
          <CurrentIcon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <DropdownMenuLabel className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
          Seleccionar Tema
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isActive = theme === themeOption.value

          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => handleThemeChange(themeOption.value)}
              className={cn(
                'cursor-pointer flex items-center gap-3 py-2.5',
                'text-slate-700 dark:text-slate-300',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                'focus:bg-slate-100 dark:focus:bg-slate-700',
                isActive && 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 focus:bg-blue-100 dark:focus:bg-blue-950'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
              )} />
              <div className="flex-1">
                <div className="text-sm font-medium">{themeOption.label}</div>
                <div className={cn(
                  'text-xs',
                  isActive ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'
                )}>
                  {themeOption.description}
                </div>
              </div>
              {isActive && (
                <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
        <div className="px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
          Actual: {resolvedTheme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
