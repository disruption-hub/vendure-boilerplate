export type AdminThemeName = 'adminMidnight' | 'adminVerdant' | 'adminAurora' | 'adminSahara' | 'adminClean'

export interface AdminDesignTokens {
  palette: {
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    success: string
    warning: string
    danger: string
    info: string
    bodyBackground: string
    bodyForeground: string
    bodyMuted: string
    border: string
    borderMuted: string
    surface: string
    surfaceForeground: string
    surfaceMuted: string
    surfaceAlt: string
    surfaceAltForeground: string
  }

  typography: {
    body: string
    heading: string
  }

  header: {
    background: string
    border: string
    text: string
    mutedText: string
    badgeBackground: string
    badgeText: string
  }

  navigation: {
    background: string
    border: string
    text: string
    mutedText: string
    activeText: string
    activeIndicator: string
    activeBackground: string
    hoverBackground: string
  }

  content: {
    background: string
    text: string
    mutedText: string
    border: string
    sectionHeading: string
  }

  card: {
    background: string
    border: string
    shadow: string
    hoverShadow: string
    text: string
    mutedText: string
    headerText: string
  }

  footer: {
    background: string
    border: string
    text: string
    mutedText: string
    link: string
    linkHover: string
  }

  table: {
    headerBackground: string
    headerText: string
    rowBackground: string
    rowAltBackground: string
    rowText: string
    border: string
    hoverBackground: string
  }

  focus: {
    ring: string
    outline: string
  }
}

export const adminThemes: Record<AdminThemeName, AdminDesignTokens> = {
  adminMidnight: {
    palette: {
      primary: '#38bdf8',
      primaryForeground: '#04121f',
      secondary: '#0ea5e9',
      secondaryForeground: '#04121f',
      accent: '#f472b6',
      accentForeground: '#13020b',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#f87171',
      info: '#38bdf8',
      bodyBackground: '#0b1120',
      bodyForeground: '#e2e8f0',
      bodyMuted: '#94a3b8',
      border: '#1f2a3d',
      borderMuted: '#27354d',
      surface: '#111c2e',
      surfaceForeground: '#e2e8f0',
      surfaceMuted: '#9db4d5',
      surfaceAlt: '#152341',
      surfaceAltForeground: '#f1f5f9',
    },
    typography: {
      body: "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      heading: "'Space Grotesk', 'Inter', 'Segoe UI', system-ui, sans-serif",
    },
    header: {
      background: '#0f172a',
      border: '#1d2a3f',
      text: '#f1f5f9',
      mutedText: '#94a3b8',
      badgeBackground: '#1d4ed8',
      badgeText: '#e0e7ff',
    },
    navigation: {
      background: 'transparent',
      border: '#1f2a3d',
      text: '#cbd5f5',
      mutedText: '#94a3b8',
      activeText: '#38bdf8',
      activeIndicator: '#38bdf8',
      activeBackground: 'rgba(56, 189, 248, 0.12)',
      hoverBackground: 'rgba(148, 163, 184, 0.08)',
    },
    content: {
      background: '#0b1120',
      text: '#e2e8f0',
      mutedText: '#94a3b8',
      border: '#1f2a3d',
      sectionHeading: '#f8fbff',
    },
    card: {
      background: '#152341',
      border: '#1e2f4d',
      shadow: '0 20px 45px -30px rgba(8, 20, 46, 0.9)',
      hoverShadow: '0 24px 60px -28px rgba(8, 20, 46, 0.95)',
      text: '#e8f1ff',
      mutedText: '#9bb3d7',
      headerText: '#f8fbff',
    },
    footer: {
      background: '#0f172a',
      border: '#1f2a3d',
      text: '#e2e8f0',
      mutedText: '#94a3b8',
      link: '#38bdf8',
      linkHover: '#bae6fd',
    },
    table: {
      headerBackground: '#1a2b4a',
      headerText: '#f1f5f9',
      rowBackground: '#152341',
      rowAltBackground: '#13263f',
      rowText: '#e2e8f0',
      border: '#20324f',
      hoverBackground: '#1b3356',
    },
    focus: {
      ring: '#38bdf8',
      outline: '#1d4ed8',
    },
  },
  adminVerdant: {
    palette: {
      primary: '#2563eb',
      primaryForeground: '#ffffff',
      secondary: '#0ea5e9',
      secondaryForeground: '#062436',
      accent: '#7c3aed',
      accentForeground: '#f4f1ff',
      success: '#16a34a',
      warning: '#d97706',
      danger: '#dc2626',
      info: '#2563eb',
      bodyBackground: '#f8fafc',
      bodyForeground: '#0f172a',
      bodyMuted: '#475569',
      border: '#d4deef',
      borderMuted: '#e2e8f0',
      surface: '#ffffff',
      surfaceForeground: '#0f172a',
      surfaceMuted: '#64748b',
      surfaceAlt: '#f1f5f9',
      surfaceAltForeground: '#0f172a',
    },
    typography: {
      body: "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      heading: "'IBM Plex Sans', 'Inter', 'Segoe UI', system-ui, sans-serif",
    },
    header: {
      background: '#ffffff',
      border: '#d4deef',
      text: '#0f172a',
      mutedText: '#475569',
      badgeBackground: '#2563eb',
      badgeText: '#eff6ff',
    },
    navigation: {
      background: 'transparent',
      border: '#e2e8f0',
      text: '#475569',
      mutedText: '#64748b',
      activeText: '#1d4ed8',
      activeIndicator: '#2563eb',
      activeBackground: 'rgba(37, 99, 235, 0.15)',
      hoverBackground: 'rgba(226, 232, 240, 0.5)',
    },
    content: {
      background: '#f8fafc',
      text: '#0f172a',
      mutedText: '#475569',
      border: '#d4deef',
      sectionHeading: '#0f172a',
    },
    card: {
      background: '#ffffff',
      border: '#d4deef',
      shadow: '0 25px 35px -25px rgba(15, 23, 42, 0.25)',
      hoverShadow: '0 28px 45px -24px rgba(15, 23, 42, 0.25)',
      text: '#0f172a',
      mutedText: '#475569',
      headerText: '#0f172a',
    },
    footer: {
      background: '#f1f5f9',
      border: '#d4deef',
      text: '#0f172a',
      mutedText: '#475569',
      link: '#1d4ed8',
      linkHover: '#2563eb',
    },
    table: {
      headerBackground: '#e2e8f0',
      headerText: '#0f172a',
      rowBackground: '#ffffff',
      rowAltBackground: '#f8fafc',
      rowText: '#0f172a',
      border: '#d4deef',
      hoverBackground: '#eef2f7',
    },
    focus: {
      ring: '#2563eb',
      outline: '#1e3a8a',
    },
  },
  adminAurora: {
    palette: {
      primary: '#7dd3fc',
      primaryForeground: '#04141f',
      secondary: '#a855f7',
      secondaryForeground: '#190431',
      accent: '#f472b6',
      accentForeground: '#2d0519',
      success: '#22c55e',
      warning: '#facc15',
      danger: '#fb7185',
      info: '#60a5fa',
      bodyBackground: '#0f172a',
      bodyForeground: '#f8fafc',
      bodyMuted: '#cbd5f5',
      border: '#1e293b',
      borderMuted: '#334155',
      surface: '#111b36',
      surfaceForeground: '#f1f5f9',
      surfaceMuted: '#c4d1f2',
      surfaceAlt: '#172347',
      surfaceAltForeground: '#e2e8f0',
    },
    typography: {
      body: "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      heading: "'Clash Display', 'Space Grotesk', 'Inter', sans-serif",
    },
    header: {
      background: 'linear-gradient(135deg, rgba(91, 33, 182, 0.92), rgba(14, 165, 233, 0.85))',
      border: 'rgba(99, 102, 241, 0.4)',
      text: '#f8fafc',
      mutedText: '#dbeafe',
      badgeBackground: 'rgba(14, 165, 233, 0.82)',
      badgeText: '#0b1220',
    },
    navigation: {
      background: 'rgba(15, 23, 42, 0.72)',
      border: 'rgba(148, 163, 184, 0.25)',
      text: '#e0f2fe',
      mutedText: '#cbd5f5',
      activeText: '#f8fafc',
      activeIndicator: '#a855f7',
      activeBackground: 'rgba(168, 85, 247, 0.18)',
      hoverBackground: 'rgba(125, 211, 252, 0.18)',
    },
    content: {
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.92))',
      text: '#f8fafc',
      mutedText: '#e0f2fe',
      border: 'rgba(148, 163, 184, 0.25)',
      sectionHeading: '#f8fafc',
    },
    card: {
      background: '#121c33',
      border: '#25304f',
      shadow: '0 24px 55px -30px rgba(14, 165, 233, 0.45)',
      hoverShadow: '0 28px 65px -28px rgba(168, 85, 247, 0.45)',
      text: '#f8fafc',
      mutedText: '#cbd5f5',
      headerText: '#f8fafc',
    },
    footer: {
      background: '#101b32',
      border: '#25304f',
      text: '#e0f2fe',
      mutedText: '#cbd5f5',
      link: '#a855f7',
      linkHover: '#f8fafc',
    },
    table: {
      headerBackground: '#16223f',
      headerText: '#f8fafc',
      rowBackground: '#121c33',
      rowAltBackground: '#10192d',
      rowText: '#f8fafc',
      border: '#25304f',
      hoverBackground: 'rgba(125, 211, 252, 0.18)',
    },
    focus: {
      ring: '#a855f7',
      outline: '#7dd3fc',
    },
  },
  adminSahara: {
    palette: {
      primary: '#f97316',
      primaryForeground: '#2b1104',
      secondary: '#fbbf24',
      secondaryForeground: '#2c1a07',
      accent: '#10b981',
      accentForeground: '#06241a',
      success: '#22c55e',
      warning: '#f97316',
      danger: '#ef4444',
      info: '#0ea5e9',
      bodyBackground: '#fff7ed',
      bodyForeground: '#1f2937',
      bodyMuted: '#6b7280',
      border: '#fed7aa',
      borderMuted: '#fee2c3',
      surface: '#ffffff',
      surfaceForeground: '#1f2937',
      surfaceMuted: '#6b7280',
      surfaceAlt: '#fef3c7',
      surfaceAltForeground: '#1f2937',
    },
    typography: {
      body: "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      heading: "'Playfair Display', 'Georgia', serif",
    },
    header: {
      background: 'linear-gradient(135deg, #f59e0b, #f97316)',
      border: 'rgba(234, 88, 12, 0.35)',
      text: '#fff7ed',
      mutedText: '#fee2c3',
      badgeBackground: '#10b981',
      badgeText: '#032314',
    },
    navigation: {
      background: '#fff7ed',
      border: '#fed7aa',
      text: '#9a3412',
      mutedText: '#c2410c',
      activeText: '#7c2d12',
      activeIndicator: '#f97316',
      activeBackground: 'rgba(249, 115, 22, 0.12)',
      hoverBackground: 'rgba(254, 215, 170, 0.45)',
    },
    content: {
      background: '#fff7ed',
      text: '#1f2937',
      mutedText: '#6b7280',
      border: '#fed7aa',
      sectionHeading: '#9a3412',
    },
    card: {
      background: '#ffffff',
      border: '#fee2c3',
      shadow: '0 24px 40px -32px rgba(234, 88, 12, 0.35)',
      hoverShadow: '0 28px 48px -30px rgba(234, 88, 12, 0.4)',
      text: '#1f2937',
      mutedText: '#7c2d12',
      headerText: '#9a3412',
    },
    footer: {
      background: '#fef3c7',
      border: '#fed7aa',
      text: '#9a3412',
      mutedText: '#c2410c',
      link: '#f97316',
      linkHover: '#ea580c',
    },
    table: {
      headerBackground: '#fef3c7',
      headerText: '#7c2d12',
      rowBackground: '#ffffff',
      rowAltBackground: '#fff7ed',
      rowText: '#1f2937',
      border: '#fed7aa',
      hoverBackground: 'rgba(254, 196, 126, 0.45)',
    },
    focus: {
      ring: '#f97316',
      outline: '#ea580c',
    },
  },
  adminClean: {
    palette: {
      primary: '#16a34a',
      primaryForeground: '#ffffff',
      secondary: '#2563eb',
      secondaryForeground: '#ffffff',
      accent: '#16a34a',
      accentForeground: '#ffffff',
      success: '#16a34a',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#2563eb',
      bodyBackground: '#f9fafb',
      bodyForeground: '#000000',
      bodyMuted: '#6b7280',
      border: '#e5e7eb',
      borderMuted: '#d1d5db',
      surface: '#ffffff',
      surfaceForeground: '#000000',
      surfaceMuted: '#6b7280',
      surfaceAlt: '#f9fafb',
      surfaceAltForeground: '#000000',
    },
    typography: {
      body: "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      heading: "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    },
    header: {
      background: '#ffffff',
      border: '#e5e7eb',
      text: '#000000',
      mutedText: '#6b7280',
      badgeBackground: '#16a34a',
      badgeText: '#ffffff',
    },
    navigation: {
      background: 'transparent',
      border: '#e5e7eb',
      text: '#000000',
      mutedText: '#6b7280',
      activeText: '#16a34a',
      activeIndicator: '#16a34a',
      activeBackground: 'rgba(22, 163, 74, 0.1)',
      hoverBackground: 'rgba(0, 0, 0, 0.05)',
    },
    content: {
      background: '#f9fafb',
      text: '#000000',
      mutedText: '#6b7280',
      border: '#e5e7eb',
      sectionHeading: '#000000',
    },
    card: {
      background: '#ffffff',
      border: '#e5e7eb',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      hoverShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      text: '#000000',
      mutedText: '#6b7280',
      headerText: '#000000',
    },
    footer: {
      background: '#ffffff',
      border: '#e5e7eb',
      text: '#000000',
      mutedText: '#6b7280',
      link: '#2563eb',
      linkHover: '#1d4ed8',
    },
    table: {
      headerBackground: '#f9fafb',
      headerText: '#000000',
      rowBackground: '#ffffff',
      rowAltBackground: '#f9fafb',
      rowText: '#000000',
      border: '#e5e7eb',
      hoverBackground: '#f3f4f6',
    },
    focus: {
      ring: '#16a34a',
      outline: '#16a34a',
    },
  },
}

export const adminThemeOptions: Array<{ value: AdminThemeName; label: string; description: string }> = [
  {
    value: 'adminMidnight',
    label: 'Midnight Velocity',
    description: 'High-contrast dark theme designed for extended monitoring sessions',
  },
  {
    value: 'adminVerdant',
    label: 'Verdant Clarity',
    description: 'Lightweight theme optimized for daytime operations and reporting',
  },
  {
    value: 'adminAurora',
    label: 'Aurora Pulse',
    description: 'Vibrant gradient-driven theme for high-visibility control rooms',
  },
  {
    value: 'adminSahara',
    label: 'Sahara Dusk',
    description: 'Warm earth-toned theme crafted for financial and compliance reviews',
  },
  {
    value: 'adminClean',
    label: 'Clean Professional',
    description: 'Clean white theme with green accents, matching VAPID keys interface style',
  },
]

export const getAdminTheme = (theme: AdminThemeName): AdminDesignTokens => {
  return adminThemes[theme] ?? adminThemes.adminMidnight
}
