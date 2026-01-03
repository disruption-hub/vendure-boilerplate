import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { randomUUID } from 'crypto'

export interface RootDomainSettings {
  rootDomain: string
}

export interface BrevoSettings {
  apiKey: string
  ccEmail?: string
}

export interface OpenRouterSettings {
  apiKey: string
  baseUrl?: string
}

export interface LabsMobileSettings {
  username: string
  token: string
  senderId?: string
  baseUrl?: string
}

export interface RealtimeSettings {
  appId: string
  key: string
  secret: string
  publicHost: string
  publicPort: number
  internalHost?: string
  internalPort?: number
  useTLS: boolean
  enabled: boolean
}

export interface VapidSettings {
  publicKey: string
  privateKey: string
  subject: string
}

export interface LyraCredentialSettings {
  apiUser: string
  apiPassword: string
  publicKey: string
  hmacKey: string
  apiBaseUrl?: string
  scriptBaseUrl?: string
}

export interface LyraModeSettings {
  enabled: boolean
  credentials: LyraCredentialSettings | null
}

export interface LyraSettings {
  testMode: LyraModeSettings
  productionMode: LyraModeSettings
  activeMode: 'test' | 'production'
  language?: string
  successRedirectUrl?: string
  failureRedirectUrl?: string
  paymentMethods?: string[]
  theme?: 'neon' | 'classic'
}

@Injectable()
export class AdminSystemSettingsService {
  constructor(private readonly prisma: PrismaService) { }

  // Root Domain Settings
  async getRootDomain(): Promise<RootDomainSettings> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'root_domain' },
    })

    if (!config || !config.value || typeof config.value !== 'object') {
      // Return default from environment or fallback
      const defaultDomain = process.env.ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'flowcast.chat'
      return { rootDomain: defaultDomain }
    }

    const value = config.value as { rootDomain?: string }
    return {
      rootDomain: value.rootDomain || process.env.ROOT_DOMAIN || 'flowcast.chat',
    }
  }

  async updateRootDomain(rootDomain: string): Promise<RootDomainSettings> {
    await this.prisma.systemConfig.upsert({
      where: { key: 'root_domain' },
      update: {
        value: { rootDomain: rootDomain.trim() },
        updated_at: new Date(),
      },
      create: {
        id: randomUUID(),
        key: 'root_domain',
        value: { rootDomain: rootDomain.trim() },
        updated_at: new Date(),
      },
    })

    return { rootDomain: rootDomain.trim() }
  }

  // Brevo Settings
  async getBrevoSettings(): Promise<BrevoSettings | null> {
    // Try new key first
    let config = await this.prisma.systemConfig.findUnique({
      where: { key: 'brevo_config' },
    })

    // If not found, try old key and migrate
    if (!config) {
      const oldConfig = await this.prisma.systemConfig.findUnique({
        where: { key: 'brevo_email' },
      })

      if (oldConfig && oldConfig.value && typeof oldConfig.value === 'object') {
        const oldValue = oldConfig.value as { apiKey?: string; ccEmail?: string }
        // Migrate to new key
        await this.prisma.systemConfig.upsert({
          where: { key: 'brevo_config' },
          update: {
            value: {
              apiKey: oldValue.apiKey || '',
              ccEmail: oldValue.ccEmail,
            },
            updated_at: new Date(),
          },
          create: {
            id: randomUUID(),
            key: 'brevo_config',
            value: {
              apiKey: oldValue.apiKey || '',
              ccEmail: oldValue.ccEmail,
            },
            updated_at: new Date(),
          },
        })
        config = await this.prisma.systemConfig.findUnique({
          where: { key: 'brevo_config' },
        })
      }
    }

    if (!config || !config.value || typeof config.value !== 'object') {
      return null
    }

    const value = config.value as { apiKey?: string; ccEmail?: string }
    return {
      apiKey: value.apiKey || '',
      ccEmail: value.ccEmail,
    }
  }

  async updateBrevoSettings(settings: BrevoSettings): Promise<BrevoSettings> {
    await this.prisma.systemConfig.upsert({
      where: { key: 'brevo_config' },
      update: {
        value: {
          apiKey: settings.apiKey.trim(),
          ...(settings.ccEmail ? { ccEmail: settings.ccEmail.trim() } : {}),
        },
        updated_at: new Date(),
      },
      create: {
        id: randomUUID(),
        key: 'brevo_config',
        value: {
          apiKey: settings.apiKey.trim(),
          ...(settings.ccEmail ? { ccEmail: settings.ccEmail.trim() } : {}),
        },
        updated_at: new Date(),
      },
    })

    return {
      apiKey: settings.apiKey.trim(),
      ccEmail: settings.ccEmail,
    }
  }

  // OpenRouter Settings
  async getOpenRouterSettings(): Promise<OpenRouterSettings | null> {
    // Simple database query - check all possible keys that might exist
    const possibleKeys = ['openrouter_config', 'openrouter_api_key', 'openrouter', 'OPENROUTER_API_KEY']

    for (const key of possibleKeys) {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key },
      })

      if (config && config.value && typeof config.value === 'object') {
        const value = config.value as { apiKey?: string; baseUrl?: string; key?: string }
        return {
          apiKey: value.apiKey || value.key || '',
          baseUrl: value.baseUrl,
        }
      }
    }

    return null
  }

  async updateOpenRouterSettings(settings: OpenRouterSettings): Promise<OpenRouterSettings> {
    await this.prisma.systemConfig.upsert({
      where: { key: 'openrouter_config' },
      update: {
        value: {
          apiKey: settings.apiKey.trim(),
          ...(settings.baseUrl ? { baseUrl: settings.baseUrl.trim() } : {}),
        },
        updated_at: new Date(),
      },
      create: {
        id: randomUUID(),
        key: 'openrouter_config',
        value: {
          apiKey: settings.apiKey.trim(),
          ...(settings.baseUrl ? { baseUrl: settings.baseUrl.trim() } : {}),
        },
        updated_at: new Date(),
      },
    })

    return {
      apiKey: settings.apiKey.trim(),
      baseUrl: settings.baseUrl,
    }
  }

  // LabsMobile Settings
  async getLabsMobileSettings(): Promise<LabsMobileSettings | null> {
    // Simple database query - check all possible keys that might exist
    const possibleKeys = ['labsmobile_config', 'labs_mobile_api_key', 'labsmobile_api_key', 'labs_mobile', 'LABSMOBILE_API_KEY']

    for (const key of possibleKeys) {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key },
      })

      if (config && config.value && typeof config.value === 'object') {
        const value = config.value as {
          username?: string;
          token?: string;
          apiKey?: string;
          senderId?: string;
          baseUrl?: string;
        }
        return {
          username: value.username || '',
          token: value.token || value.apiKey || '',
          senderId: value.senderId,
          baseUrl: value.baseUrl,
        }
      }
    }

    return null
  }

  async updateLabsMobileSettings(settings: LabsMobileSettings): Promise<LabsMobileSettings> {
    await this.prisma.systemConfig.upsert({
      where: { key: 'labsmobile_config' },
      update: {
        value: {
          username: settings.username.trim(),
          token: settings.token.trim(),
          ...(settings.senderId ? { senderId: settings.senderId.trim() } : {}),
          ...(settings.baseUrl ? { baseUrl: settings.baseUrl.trim() } : {}),
        },
        updated_at: new Date(),
      },
      create: {
        id: randomUUID(),
        key: 'labsmobile_config',
        value: {
          username: settings.username.trim(),
          token: settings.token.trim(),
          ...(settings.senderId ? { senderId: settings.senderId.trim() } : {}),
          ...(settings.baseUrl ? { baseUrl: settings.baseUrl.trim() } : {}),
        },
        updated_at: new Date(),
      },
    })

    return {
      username: settings.username.trim(),
      token: settings.token.trim(),
      senderId: settings.senderId,
      baseUrl: settings.baseUrl,
    }
  }

  // Realtime (Soketi) Settings
  async getRealtimeSettings(): Promise<RealtimeSettings | null> {
    // Simple database query - check all possible keys that might exist
    const possibleKeys = ['realtime_config', 'soketi_config', 'soketi', 'realtime', 'SOKETI_CONFIG']

    for (const key of possibleKeys) {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key },
      })

      if (config && config.value && typeof config.value === 'object') {
        const value = config.value as {
          appId?: string
          key?: string
          secret?: string
          publicHost?: string
          publicPort?: number
          internalHost?: string
          internalPort?: number
          useTLS?: boolean
          enabled?: boolean
        }
        return {
          appId: value.appId || '',
          key: value.key || '',
          secret: value.secret || '',
          publicHost: value.publicHost || '',
          publicPort: value.publicPort || 443,
          internalHost: value.internalHost,
          internalPort: value.internalPort,
          useTLS: value.useTLS ?? true,
          enabled: value.enabled ?? true,
        }
      }
    }

    // Fallback to environment variables
    if (process.env.SOKETI_APP_ID && process.env.SOKETI_APP_KEY && process.env.SOKETI_APP_SECRET) {
      return {
        appId: process.env.SOKETI_APP_ID,
        key: process.env.SOKETI_APP_KEY,
        secret: process.env.SOKETI_APP_SECRET,
        publicHost: process.env.SOKETI_PUBLIC_HOST || process.env.SOKETI_HOST || 'localhost',
        publicPort: parseInt(process.env.SOKETI_PUBLIC_PORT || process.env.SOKETI_PORT || '6001', 10),
        internalHost: process.env.SOKETI_INTERNAL_HOST || process.env.SOKETI_HOST || 'soketi',
        internalPort: parseInt(process.env.SOKETI_INTERNAL_PORT || process.env.SOKETI_PORT || '6001', 10),
        useTLS: process.env.SOKETI_USE_TLS !== 'false',
        enabled: true,
      }
    }

    return null
  }

  async updateRealtimeSettings(settings: RealtimeSettings): Promise<RealtimeSettings> {
    await this.prisma.systemConfig.upsert({
      where: { key: 'realtime_config' },
      update: {
        value: {
          appId: settings.appId.trim(),
          key: settings.key.trim(),
          secret: settings.secret.trim(),
          publicHost: settings.publicHost.trim(),
          publicPort: settings.publicPort,
          ...(settings.internalHost ? { internalHost: settings.internalHost.trim() } : {}),
          ...(settings.internalPort ? { internalPort: settings.internalPort } : {}),
          useTLS: settings.useTLS,
          enabled: settings.enabled,
        },
        updated_at: new Date(),
      },
      create: {
        id: randomUUID(),
        key: 'realtime_config',
        value: {
          appId: settings.appId.trim(),
          key: settings.key.trim(),
          secret: settings.secret.trim(),
          publicHost: settings.publicHost.trim(),
          publicPort: settings.publicPort,
          ...(settings.internalHost ? { internalHost: settings.internalHost.trim() } : {}),
          ...(settings.internalPort ? { internalPort: settings.internalPort } : {}),
          useTLS: settings.useTLS,
          enabled: settings.enabled,
        },
        updated_at: new Date(),
      },
    })

    return {
      appId: settings.appId.trim(),
      key: settings.key.trim(),
      secret: settings.secret.trim(),
      publicHost: settings.publicHost.trim(),
      publicPort: settings.publicPort,
      internalHost: settings.internalHost,
      internalPort: settings.internalPort,
      useTLS: settings.useTLS,
      enabled: settings.enabled,
    }
  }

  // VAPID Settings
  async getVapidSettings(): Promise<VapidSettings | null> {
    // Simple database query - check all possible keys that might exist
    const possibleKeys = ['vapid_config', 'vapid_keys', 'vapid', 'VAPID_CONFIG', 'VAPID_KEYS']

    for (const key of possibleKeys) {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key },
      })

      if (config && config.value && typeof config.value === 'object') {
        const value = config.value as {
          publicKey?: string
          privateKey?: string
          subject?: string
        }
        return {
          publicKey: value.publicKey || '',
          privateKey: value.privateKey || '',
          subject: value.subject || '',
        }
      }
    }

    return null
  }

  async generateVapidKeys(email?: string): Promise<VapidSettings> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpush = require('web-push')

    const vapidKeys = webpush.generateVAPIDKeys()
    const subject = email ? `mailto:${email}` : 'mailto:admin@ipnuo.com'

    const settings: VapidSettings = {
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
      subject,
    }

    // Save to database
    await this.prisma.systemConfig.upsert({
      where: { key: 'vapid_config' },
      update: {
        value: {
          publicKey: settings.publicKey,
          privateKey: settings.privateKey,
          subject: settings.subject,
        },
        updated_at: new Date(),
      },
      create: {
        id: randomUUID(),
        key: 'vapid_config',
        value: {
          publicKey: settings.publicKey,
          privateKey: settings.privateKey,
          subject: settings.subject,
        },
        updated_at: new Date(),
      },
    })

    return settings
  }

  // Lyra Settings
  async getLyraSettings(): Promise<LyraSettings | null> {
    const possibleKeys = ['lyra_config', 'lyra_settings', 'lyra', 'LYRA_CONFIG', 'LYRA_SETTINGS']

    for (const key of possibleKeys) {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key },
      })

      if (config && config.value) {
        try {
          const parsed = typeof config.value === 'string' ? JSON.parse(config.value) : config.value

          // Debug logging
          console.log('[getLyraSettings] Found config for key:', key)
          console.log('[getLyraSettings] Parsed value type:', typeof parsed)
          console.log('[getLyraSettings] Has testMode:', !!parsed.testMode)
          console.log('[getLyraSettings] Has productionMode:', !!parsed.productionMode)
          if (parsed.testMode) {
            console.log('[getLyraSettings] testMode enabled:', parsed.testMode.enabled)
            console.log('[getLyraSettings] testMode has credentials:', !!parsed.testMode.credentials)
          }
          if (parsed.productionMode) {
            console.log('[getLyraSettings] productionMode enabled:', parsed.productionMode.enabled)
            console.log('[getLyraSettings] productionMode has credentials:', !!parsed.productionMode.credentials)
            if (parsed.productionMode.credentials) {
              console.log('[getLyraSettings] productionMode credentials keys:', Object.keys(parsed.productionMode.credentials))
            }
          }

          return parsed as LyraSettings
        } catch (error) {
          console.error('[getLyraSettings] Error parsing config for key:', key, error)
          continue
        }
      }
    }

    return null
  }

  async updateLyraSettings(settings: LyraSettings): Promise<LyraSettings> {
    // Update global configuration only
    // NOTE: Each tenant has its own activeMode in settings.lyraConfig.activeMode
    // The global activeMode is only used as a template when copying config to new tenants
    await this.prisma.systemConfig.upsert({
      where: { key: 'lyra_config' },
      update: {
        value: settings as any,
        updated_at: new Date(),
      },
      create: {
        id: randomUUID(),
        key: 'lyra_config',
        value: settings as any,
        updated_at: new Date(),
      },
    })

    return settings
  }

  async testVapidKeys(): Promise<{ valid: boolean; message: string }> {
    const config = await this.getVapidSettings()

    if (!config) {
      return { valid: false, message: 'No VAPID keys configured' }
    }

    if (!config.publicKey || !config.privateKey) {
      return { valid: false, message: 'VAPID keys are incomplete' }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const webpush = require('web-push')

      // Validate key format by attempting to set VAPID details
      webpush.setVapidDetails(
        config.subject || 'mailto:admin@ipnuo.com',
        config.publicKey,
        config.privateKey
      )

      // If we get here without error, keys are valid
      return { valid: true, message: 'VAPID keys are valid and properly formatted' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { valid: false, message: `VAPID keys validation failed: ${errorMessage}` }
    }
  }

  async updateVapidSettings(settings: VapidSettings): Promise<VapidSettings> {
    await this.prisma.systemConfig.upsert({
      where: { key: 'vapid_config' },
      update: {
        value: {
          publicKey: settings.publicKey.trim(),
          privateKey: settings.privateKey.trim(),
          subject: settings.subject.trim(),
        },
        updated_at: new Date(),
      },
      create: {
        id: randomUUID(),
        key: 'vapid_config',
        value: {
          publicKey: settings.publicKey.trim(),
          privateKey: settings.privateKey.trim(),
          subject: settings.subject.trim(),
        },
        updated_at: new Date(),
      },
    })

    return {
      publicKey: settings.publicKey.trim(),
      privateKey: settings.privateKey.trim(),
      subject: settings.subject.trim(),
    }
  }
}

