"use client"

import { useMemo } from 'react'
import { Check, Loader2 } from 'lucide-react'

import {
  adminThemeOptions,
  getAdminTheme,
  type AdminThemeName,
} from '@/lib/design-tokens/admin-dashboard-tokens'

interface AdminThemeSwitcherProps {
  currentTheme: AdminThemeName
  availableThemes: AdminThemeName[]
  onSelect: (theme: AdminThemeName) => void
  loading?: boolean
}

export function AdminThemeSwitcher({ currentTheme, availableThemes, onSelect, loading }: AdminThemeSwitcherProps) {
  const options = useMemo(
    () =>
      adminThemeOptions
        .filter(option => availableThemes && Array.isArray(availableThemes) && availableThemes.includes(option.value))
        .map(option => {
          const tokens = getAdminTheme(option.value)
          return {
            ...option,
            tokens,
            palettePreview: [tokens.palette.primary, tokens.palette.accent, tokens.palette.secondary],
          }
        }),
    [availableThemes],
  )

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-[color:var(--admin-content-heading)]">Interface Theme</h2>
        <p className="text-xs text-[color:var(--admin-content-muted-text)]">
          Switch between curated palettes with locked typography and background contracts.
        </p>
      </div>

      <div className="space-y-2">
        {options.map(option => {
          const isActive = option.value === currentTheme
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              disabled={loading}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--admin-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--admin-card-background)] ${
                isActive
                  ? 'border-[color:var(--admin-navigation-active-indicator)] bg-[color:var(--admin-navigation-active-background)] text-[color:var(--admin-navigation-active-text)] shadow-sm'
                  : 'border-[color:var(--admin-navigation-border)] text-[color:var(--admin-navigation-text)] hover:bg-[color:var(--admin-navigation-hover-background)]'
              } ${loading ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <div className="flex flex-1 items-center gap-3">
                <div className="flex items-center gap-1">
                  {option.palettePreview.map(color => (
                    <span
                      key={color}
                      className="h-3 w-3 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ fontFamily: 'var(--admin-font-heading)' }}>
                    {option.label}
                  </div>
                  <div className="text-xs text-[color:var(--admin-content-muted-text)]" style={{ fontFamily: 'var(--admin-font-body)' }}>
                    {option.description}
                  </div>
                </div>
              </div>
              <div className="pl-3 text-[color:var(--admin-content-muted-text)]">
                {loading && isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : isActive ? <Check className="h-4 w-4" /> : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
