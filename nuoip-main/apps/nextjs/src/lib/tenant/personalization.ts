import type { ThemeName } from '@/lib/design-tokens'
import { themes } from '@/lib/design-tokens'
import type { AdminThemeName } from '@/lib/design-tokens/admin-dashboard-tokens'
import { adminThemes } from '@/lib/design-tokens/admin-dashboard-tokens'

export type TenantLanguageStyle = 'professional' | 'friendly' | 'technical'
export type TenantToneStyle = 'formal' | 'neutral' | 'casual'

export interface TenantThemePreferences {
  chat: ThemeName
  admin: AdminThemeName
}

export interface TenantMemoryPreferences {
  enabled: boolean
  retentionDays: number
  summaryThreshold?: number
  [key: string]: unknown
}

export interface TenantPersonalization {
  greeting: string
  language: string
  style: TenantLanguageStyle
  tone: TenantToneStyle
  summaryFormat?: string
  memory: TenantMemoryPreferences
  themePreferences: TenantThemePreferences
  [key: string]: unknown
}

export const DEFAULT_TENANT_PERSONALIZATION: TenantPersonalization = {
  greeting: "Hello! I'm here to help you with anything you need.",
  language: 'en',
  style: 'professional',
  tone: 'neutral',
  summaryFormat: 'bullet_points',
  memory: {
    enabled: true,
    retentionDays: 30,
    summaryThreshold: 10,
  },
  themePreferences: {
    chat: 'dark',
    admin: 'adminMidnight',
  },
}

export function mergeTenantPersonalization(
  personalization?: Partial<TenantPersonalization> | null,
): TenantPersonalization {
  if (!personalization) {
    return { ...DEFAULT_TENANT_PERSONALIZATION }
  }

  const memory: TenantMemoryPreferences = {
    enabled: personalization.memory?.enabled ?? DEFAULT_TENANT_PERSONALIZATION.memory.enabled,
    retentionDays: Math.max(
      1,
      personalization.memory?.retentionDays ?? DEFAULT_TENANT_PERSONALIZATION.memory.retentionDays,
    ),
    summaryThreshold:
      personalization.memory?.summaryThreshold ?? DEFAULT_TENANT_PERSONALIZATION.memory.summaryThreshold,
    ...personalization.memory,
  }

  const availableChatThemes = themes as Record<string, unknown>
  const availableAdminThemes = adminThemes as Record<string, unknown>

  const chatThemeCandidate = personalization.themePreferences?.chat
  const adminThemeCandidate = personalization.themePreferences?.admin

  const themePreferences: TenantThemePreferences = {
    chat:
      typeof chatThemeCandidate === 'string' && chatThemeCandidate in availableChatThemes
        ? (chatThemeCandidate as ThemeName)
        : DEFAULT_TENANT_PERSONALIZATION.themePreferences.chat,
    admin:
      typeof adminThemeCandidate === 'string' && adminThemeCandidate in availableAdminThemes
        ? (adminThemeCandidate as AdminThemeName)
        : DEFAULT_TENANT_PERSONALIZATION.themePreferences.admin,
  }

  return {
    ...DEFAULT_TENANT_PERSONALIZATION,
    ...personalization,
    greeting: personalization.greeting?.trim() || DEFAULT_TENANT_PERSONALIZATION.greeting,
    memory,
    themePreferences,
  }
}

export function updateTenantSettingsWithPersonalization(
  settings: Record<string, any> | null | undefined,
  personalization: TenantPersonalization,
): Record<string, any> {
  const currentSettings = settings ? { ...settings } : {}
  currentSettings.personalization = personalization
  return currentSettings
}
