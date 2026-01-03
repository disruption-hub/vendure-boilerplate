import type { AdminDesignTokens, AdminThemeName } from '@/lib/design-tokens/admin-dashboard-tokens'

interface HslColor {
  h: number
  s: number
  l: number
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '')
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized

  const intValue = parseInt(expanded, 16)
  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  }
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }): HslColor {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta) % 6
        break
      case gNorm:
        h = (bNorm - rNorm) / delta + 2
        break
      default:
        h = (rNorm - gNorm) / delta + 4
        break
    }

    h *= 60
    if (h < 0) {
      h += 360
    }
  }

  return {
    h,
    s: s * 100,
    l: l * 100,
  }
}

function toHslString(hex: string): string {
  const { h, s, l } = rgbToHsl(hexToRgb(hex))
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`
}

function getReadableForeground(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 145 ? '#0f172a' : '#f8fafc'
}

function getReadableForegroundHsl(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  const fallbackHex = brightness > 145 ? '#0f172a' : '#f8fafc'
  return toHslString(fallbackHex)
}

export interface ApplyAdminThemeOptions {
  themeName?: AdminThemeName
}

export function applyAdminThemeTokens(tokens: AdminDesignTokens, options: ApplyAdminThemeOptions = {}): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  const setVar = (name: string, value: string) => {
    root.style.setProperty(name, value)
  }

  // Palette tokens
  setVar('--admin-color-primary', tokens.palette.primary)
  setVar('--admin-color-primary-foreground', tokens.palette.primaryForeground)
  setVar('--admin-color-secondary', tokens.palette.secondary)
  setVar('--admin-color-secondary-foreground', tokens.palette.secondaryForeground)
  setVar('--admin-color-accent', tokens.palette.accent)
  setVar('--admin-color-accent-foreground', tokens.palette.accentForeground)
  setVar('--admin-color-success', tokens.palette.success)
  setVar('--admin-color-warning', tokens.palette.warning)
  setVar('--admin-color-danger', tokens.palette.danger)
  setVar('--admin-color-info', tokens.palette.info)

  setVar('--admin-body-background', tokens.palette.bodyBackground)
  setVar('--admin-body-foreground', tokens.palette.bodyForeground)
  setVar('--admin-body-muted', tokens.palette.bodyMuted)
  setVar('--admin-border', tokens.palette.border)
  setVar('--admin-border-muted', tokens.palette.borderMuted)
  setVar('--admin-surface', tokens.palette.surface)
  setVar('--admin-surface-foreground', tokens.palette.surfaceForeground)
  setVar('--admin-surface-muted', tokens.palette.surfaceMuted)
  setVar('--admin-surface-alt', tokens.palette.surfaceAlt)
  setVar('--admin-surface-alt-foreground', tokens.palette.surfaceAltForeground)

  // Typography
  setVar('--admin-font-body', tokens.typography.body)
  setVar('--admin-font-heading', tokens.typography.heading)

  // Structural tokens
  setVar('--admin-header-background', tokens.header.background)
  setVar('--admin-header-border', tokens.header.border)
  setVar('--admin-header-text', tokens.header.text)
  setVar('--admin-header-muted-text', tokens.header.mutedText)
  setVar('--admin-header-badge-background', tokens.header.badgeBackground)
  setVar('--admin-header-badge-text', tokens.header.badgeText)

  setVar('--admin-navigation-background', tokens.navigation.background)
  setVar('--admin-navigation-border', tokens.navigation.border)
  setVar('--admin-navigation-text', tokens.navigation.text)
  setVar('--admin-navigation-muted-text', tokens.navigation.mutedText)
  setVar('--admin-navigation-active-text', tokens.navigation.activeText)
  setVar('--admin-navigation-active-indicator', tokens.navigation.activeIndicator)
  setVar('--admin-navigation-active-background', tokens.navigation.activeBackground)
  setVar('--admin-navigation-hover-background', tokens.navigation.hoverBackground)

  setVar('--admin-content-background', tokens.content.background)
  setVar('--admin-content-text', tokens.content.text)
  setVar('--admin-content-muted-text', tokens.content.mutedText)
  setVar('--admin-content-border', tokens.content.border)
  setVar('--admin-content-heading', tokens.content.sectionHeading)

  setVar('--admin-card-background', tokens.card.background)
  setVar('--admin-card-border', tokens.card.border)
  setVar('--admin-card-shadow', tokens.card.shadow)
  setVar('--admin-card-hover-shadow', tokens.card.hoverShadow)
  setVar('--admin-card-text', tokens.card.text)
  setVar('--admin-card-muted-text', tokens.card.mutedText)
  setVar('--admin-card-header-text', tokens.card.headerText)

  setVar('--admin-footer-background', tokens.footer.background)
  setVar('--admin-footer-border', tokens.footer.border)
  setVar('--admin-footer-text', tokens.footer.text)
  setVar('--admin-footer-muted-text', tokens.footer.mutedText)
  setVar('--admin-footer-link', tokens.footer.link)
  setVar('--admin-footer-link-hover', tokens.footer.linkHover)

  setVar('--admin-table-header-background', tokens.table.headerBackground)
  setVar('--admin-table-header-text', tokens.table.headerText)
  setVar('--admin-table-row-background', tokens.table.rowBackground)
  setVar('--admin-table-row-alt-background', tokens.table.rowAltBackground)
  setVar('--admin-table-row-text', tokens.table.rowText)
  setVar('--admin-table-border', tokens.table.border)
  setVar('--admin-table-hover-background', tokens.table.hoverBackground)

  setVar('--admin-focus-ring', tokens.focus.ring)
  setVar('--admin-focus-outline', tokens.focus.outline)

  // Derived HSL tokens for Tailwind-based utilities
  setVar('--admin-body-background-hsl', toHslString(tokens.palette.bodyBackground))
  setVar('--admin-body-foreground-hsl', toHslString(tokens.palette.bodyForeground))
  setVar('--admin-body-muted-hsl', toHslString(tokens.palette.bodyMuted))
  setVar('--admin-surface-hsl', toHslString(tokens.palette.surface))
  setVar('--admin-surface-alt-hsl', toHslString(tokens.palette.surfaceAlt))
  setVar('--admin-border-hsl', toHslString(tokens.palette.border))
  setVar('--admin-primary-hsl', toHslString(tokens.palette.primary))
  setVar('--admin-secondary-hsl', toHslString(tokens.palette.secondary))
  setVar('--admin-accent-hsl', toHslString(tokens.palette.accent))
  setVar('--admin-success-hsl', toHslString(tokens.palette.success))
  setVar('--admin-warning-hsl', toHslString(tokens.palette.warning))
  setVar('--admin-danger-hsl', toHslString(tokens.palette.danger))

  setVar('--admin-primary-foreground-hsl', getReadableForegroundHsl(tokens.palette.primary))
  setVar('--admin-secondary-foreground-hsl', getReadableForegroundHsl(tokens.palette.secondary))
  setVar('--admin-accent-foreground-hsl', getReadableForegroundHsl(tokens.palette.accent))
  setVar('--admin-surface-foreground-hsl', getReadableForegroundHsl(tokens.card.background))
  setVar('--admin-danger-foreground-hsl', getReadableForegroundHsl(tokens.palette.danger))

  // Bridge general theme variables when admin theme container is active
  setVar('--admin-color-on-primary', getReadableForeground(tokens.palette.primary))
  setVar('--admin-color-on-secondary', getReadableForeground(tokens.palette.secondary))
  setVar('--admin-color-on-accent', getReadableForeground(tokens.palette.accent))
  setVar('--admin-color-on-surface', getReadableForeground(tokens.card.background))

  if (options.themeName) {
    root.setAttribute('data-admin-theme-name', options.themeName)
  }

}

export function clearAdminThemeTokens(): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const adminVars = Array.from(root.style)
    .filter((name) => name.startsWith('--admin-'))

  adminVars.forEach((name) => {
    root.style.removeProperty(name)
  })

  root.removeAttribute('data-admin-theme-name')
}
