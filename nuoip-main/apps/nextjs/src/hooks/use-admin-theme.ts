'use client'

import { useCallback, useEffect, useState } from 'react'
import { getTenantPersonalization } from '@/features/admin/api/admin-api'
import { applyAdminThemeTokens, clearAdminThemeTokens } from '@/lib/styles/admin-theme-utils'
import { adminThemes, getAdminTheme, type AdminThemeName } from '@/lib/design-tokens/admin-dashboard-tokens'

interface UseAdminThemeOptions {
  fallbackTheme?: AdminThemeName
}

interface UseAdminThemeResult {
  theme: AdminThemeName
  loading: boolean
  error: string | null
  availableThemes: AdminThemeName[]
  selectTheme: (theme: AdminThemeName, options?: { persist?: boolean }) => void
  resetTheme: () => void
}

const DEFAULT_ADMIN_THEME: AdminThemeName = 'adminMidnight'
const STORAGE_KEY = 'admin-dashboard-theme'

export function useAdminTheme(tenantId?: string | null, options: UseAdminThemeOptions = {}): UseAdminThemeResult {
  const fallback = options.fallbackTheme ?? DEFAULT_ADMIN_THEME
  const [theme, setTheme] = useState<AdminThemeName>(fallback)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userOverride, setUserOverride] = useState<AdminThemeName | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return () => {}

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && stored in adminThemes) {
      const parsed = stored as AdminThemeName
      setTheme(parsed)
      setUserOverride(parsed)
    } else {
      setTheme(fallback)
    }

    applyAdminThemeTokens(getAdminTheme(stored && stored in adminThemes ? (stored as AdminThemeName) : fallback), {
      themeName: stored && stored in adminThemes ? (stored as AdminThemeName) : fallback,
    })

    return () => {
      clearAdminThemeTokens()
    }
  }, [fallback])

  useEffect(() => {
    if (!tenantId || userOverride) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const fetchTheme = async () => {
      try {
        const response = await getTenantPersonalization(tenantId)
        const candidate = response.personalization?.themePreferences?.admin
        const resolved: AdminThemeName =
          typeof candidate === 'string' && candidate in adminThemes
            ? (candidate as AdminThemeName)
            : fallback

        if (!cancelled) {
          setTheme(resolved)
        }
      } catch (err) {
        console.error('Failed to resolve admin theme', err)
        if (!cancelled) {
          setTheme(fallback)
          setError(err instanceof Error ? err.message : 'Unable to load admin theme preferences')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchTheme()

    return () => {
      cancelled = true
    }
  }, [tenantId, fallback, userOverride])

  useEffect(() => {
    applyAdminThemeTokens(getAdminTheme(theme), { themeName: theme })
  }, [theme])

  const selectTheme = useCallback(
    (nextTheme: AdminThemeName, options?: { persist?: boolean }) => {
      setTheme(nextTheme)
      setUserOverride(nextTheme)

      if (options?.persist !== false && typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, nextTheme)
      }
    },
    [],
  )

  const resetTheme = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    setUserOverride(null)
    setTheme(fallback)
  }, [fallback])

  return {
    theme,
    loading,
    error,
    availableThemes: Object.keys(adminThemes) as AdminThemeName[],
    selectTheme,
    resetTheme,
  }
}
