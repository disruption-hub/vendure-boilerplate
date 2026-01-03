import { AdminSystemSettingsService } from '../../../admin/system-settings.service'
import { createLogger } from '../../utils/logger'

const logger = createLogger('whatsapp-soketi-emitter')

// Dynamic import for Pusher (ESM module)
let PusherClass: any = null
let pusherLoadPromise: Promise<any> | null = null

async function loadPusher(): Promise<any> {
  if (PusherClass) {
    return PusherClass
  }

  if (pusherLoadPromise) {
    return pusherLoadPromise
  }

  pusherLoadPromise = (async () => {
    try {
      const pusherModule = await import('pusher')
      // Handle both default export and named export
      PusherClass = pusherModule.default || pusherModule
      return PusherClass
    } catch (error) {
      logger.error('Failed to load Pusher module', {
        error: error instanceof Error ? error.message : 'unknown-error',
      })
      throw error
    } finally {
      pusherLoadPromise = null
    }
  })()

  return pusherLoadPromise
}

interface ResolvedSoketiClient {
  client: any // Pusher instance
  channelHost: string
}

let cachedClient: ResolvedSoketiClient | null = null
let clientResolvePromise: Promise<ResolvedSoketiClient | null> | null = null

/**
 * Resolve Soketi client from environment variables or system settings
 */
async function resolveSoketiClient(
  systemSettingsService?: AdminSystemSettingsService,
): Promise<ResolvedSoketiClient | null> {
  // Return cached client if available
  if (cachedClient) {
    return cachedClient
  }

  // Return existing promise if already resolving
  if (clientResolvePromise) {
    return clientResolvePromise
  }

  // Start resolving
  clientResolvePromise = (async () => {
    try {
      // First try environment variables (Railway deployment)
      // Support both SOKETI_* and SOKETI_DEFAULT_* variable names
      const envAppId = process.env.SOKETI_APP_ID || process.env.SOKETI_DEFAULT_APP_ID
      const envKey = process.env.SOKETI_APP_KEY || process.env.SOKETI_DEFAULT_APP_KEY
      const envSecret = process.env.SOKETI_APP_SECRET || process.env.SOKETI_DEFAULT_APP_SECRET
      // Prefer public host for Railway (internal host may not be accessible from worker)
      // Fallback order: PUBLIC_HOST > HOST > INTERNAL_HOST
      const envHost = process.env.SOKETI_PUBLIC_HOST || process.env.SOKETI_HOST || process.env.SOKETI_INTERNAL_HOST
      const envPort = process.env.SOKETI_PUBLIC_PORT || process.env.SOKETI_PORT || process.env.SOKETI_INTERNAL_PORT || '443'
      const envUseTLS = process.env.SOKETI_USE_TLS !== 'false'

      if (envAppId && envKey && envSecret && envHost) {
        // Load Pusher dynamically
        const Pusher = await loadPusher()
        const pusher = new Pusher({
          appId: envAppId,
          key: envKey,
          secret: envSecret,
          host: envHost,
          port: parseInt(envPort, 10),
          useTLS: envUseTLS,
          cluster: 'mt1',
        })

        cachedClient = {
          client: pusher,
          channelHost: envHost,
        }

        logger.info('Soketi client resolved from environment variables', {
          host: envHost,
          port: envPort,
          useTLS: envUseTLS,
        })
        console.log('✅✅✅ SOKETI CLIENT RESOLVED ✅✅✅', {
          channelHost: envHost,
          hasClient: !!pusher,
        })

        return cachedClient
      }

      // Fallback to system settings (database)
      if (systemSettingsService) {
        const realtimeConfig = await systemSettingsService.getRealtimeSettings()
        if (realtimeConfig && realtimeConfig.enabled) {
          // Load Pusher dynamically
          const Pusher = await loadPusher()
          const pusher = new Pusher({
            appId: realtimeConfig.appId,
            key: realtimeConfig.key,
            secret: realtimeConfig.secret,
            host: realtimeConfig.internalHost || realtimeConfig.publicHost,
            port: realtimeConfig.internalPort || realtimeConfig.publicPort,
            useTLS: realtimeConfig.useTLS,
            cluster: 'mt1',
          })

          cachedClient = {
            client: pusher,
            channelHost: realtimeConfig.internalHost || realtimeConfig.publicHost,
          }

          logger.info('Soketi client resolved from system settings', {
            host: cachedClient.channelHost,
            port: realtimeConfig.internalPort || realtimeConfig.publicPort,
            useTLS: realtimeConfig.useTLS,
          })

          return cachedClient
        }
      }

      logger.warn('Soketi client could not be resolved - no configuration found', {
        hasEnvVars: {
          SOKETI_APP_ID: !!process.env.SOKETI_APP_ID,
          SOKETI_DEFAULT_APP_ID: !!process.env.SOKETI_DEFAULT_APP_ID,
          SOKETI_APP_KEY: !!process.env.SOKETI_APP_KEY,
          SOKETI_DEFAULT_APP_KEY: !!process.env.SOKETI_DEFAULT_APP_KEY,
          SOKETI_APP_SECRET: !!process.env.SOKETI_APP_SECRET,
          SOKETI_DEFAULT_APP_SECRET: !!process.env.SOKETI_DEFAULT_APP_SECRET,
          SOKETI_HOST: !!process.env.SOKETI_HOST,
          SOKETI_INTERNAL_HOST: !!process.env.SOKETI_INTERNAL_HOST,
          SOKETI_PUBLIC_HOST: !!process.env.SOKETI_PUBLIC_HOST,
          SOKETI_PUBLIC_PORT: !!process.env.SOKETI_PUBLIC_PORT,
        },
        resolvedEnvVars: {
          envAppId: !!envAppId,
          envKey: !!envKey,
          envSecret: !!envSecret,
          envHost: !!envHost,
        },
        isRailway: !!process.env.RAILWAY_ENVIRONMENT,
      })
      return null
    } catch (error) {
      logger.error('Error resolving Soketi client', {
        error: error instanceof Error ? error.message : 'unknown-error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      return null
    } finally {
      clientResolvePromise = null
    }
  })()

  return clientResolvePromise
}

/**
 * Build WhatsApp Soketi channel name
 * Using public channel: whatsapp.{sessionId}
 */
export function buildWhatsAppChannel(sessionId: string): string {
  return `whatsapp.${sessionId}`
}

/**
 * Broadcast WhatsApp event to Soketi
 */
export async function broadcastWhatsAppEvent(
  sessionId: string,
  tenantId: string,
  eventName: string,
  data: any,
  systemSettingsService?: AdminSystemSettingsService,
): Promise<void> {
  console.log('🚀🚀🚀 BROADCASTING WhatsApp EVENT 🚀🚀🚀', {
    sessionId,
    tenantId,
    eventName,
    isRailway: !!process.env.RAILWAY_ENVIRONMENT,
    isVercel: !!process.env.VERCEL,
    hasData: !!data,
  })

  const resolved = await resolveSoketiClient(systemSettingsService)
  if (!resolved) {
    console.log('❌❌❌ SOKETI NOT CONFIGURED ❌❌❌')
    logger.warn('Cannot broadcast WhatsApp event: Soketi not configured', {
      sessionId,
      eventName,
      hasEnvVars: {
        SOKETI_APP_ID: !!process.env.SOKETI_APP_ID,
        SOKETI_DEFAULT_APP_ID: !!process.env.SOKETI_DEFAULT_APP_ID,
        SOKETI_APP_KEY: !!process.env.SOKETI_APP_KEY,
        SOKETI_DEFAULT_APP_KEY: !!process.env.SOKETI_DEFAULT_APP_KEY,
        SOKETI_APP_SECRET: !!process.env.SOKETI_APP_SECRET,
        SOKETI_DEFAULT_APP_SECRET: !!process.env.SOKETI_DEFAULT_APP_SECRET,
        SOKETI_HOST: !!process.env.SOKETI_HOST,
        SOKETI_INTERNAL_HOST: !!process.env.SOKETI_INTERNAL_HOST,
        SOKETI_PUBLIC_HOST: !!process.env.SOKETI_PUBLIC_HOST,
      },
      isRailway: !!process.env.RAILWAY_ENVIRONMENT,
    })
    return
  }

  const channel = buildWhatsAppChannel(sessionId)

  try {
    const payload = {
      ...data,
      sessionId,
      tenantId,
      timestamp: Date.now(),
    }

    console.log('📤📤📤 SENDING TO SOKETI 📤📤📤', {
      channel,
      eventName,
      payloadKeys: Object.keys(payload),
      isRailway: !!process.env.RAILWAY_ENVIRONMENT,
    })

    try {
      await resolved.client.trigger(channel, eventName, payload)

      console.log('✅✅✅ EVENT SENT TO SOKETI ✅✅✅', {
        channel,
        eventName,
        soketiHost: resolved.channelHost,
        isRailway: !!process.env.RAILWAY_ENVIRONMENT,
      })
    } catch (triggerError: any) {
      // Re-throw with more context
      const errorMessage = triggerError?.message || 'unknown-error'
      const errorCode = triggerError?.code || 'no-code'
      const errorStatus = triggerError?.status || 'no-status'

      throw new Error(
        `Soketi trigger failed: ${errorMessage} (code: ${errorCode}, status: ${errorStatus}, host: ${resolved.channelHost})`
      )
    }

    // Always log QR code events for debugging
    if (eventName === 'qr.code') {
      logger.info('QR code event broadcasted to Soketi', {
        channel,
        sessionId,
        tenantId,
        eventName,
        qrLength: typeof data?.qr === 'string' ? data.qr.length : 0,
        soketiHost: resolved.channelHost,
        isRailway: !!process.env.RAILWAY_ENVIRONMENT,
      })
      console.log('📱📱📱 QR CODE EVENT SENT 📱📱📱', {
        sessionId,
        qrLength: typeof data?.qr === 'string' ? data.qr.length : 0,
      })
    } else {
      logger.debug('WhatsApp event broadcasted', {
        channel,
        sessionId,
        tenantId,
        eventName,
        isRailway: !!process.env.RAILWAY_ENVIRONMENT,
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'unknown-error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      ...(error as any).code && { code: (error as any).code },
      ...(error as any).status && { status: (error as any).status },
      ...(error as any).statusCode && { statusCode: (error as any).statusCode },
    } : {}

    console.log('❌❌❌ FAILED TO SEND EVENT ❌❌❌', {
      channel,
      eventName,
      error: errorMessage,
      errorDetails,
      soketiHost: resolved?.channelHost,
      isRailway: !!process.env.RAILWAY_ENVIRONMENT,
    })

    logger.error('Failed to broadcast WhatsApp event', {
      channel,
      sessionId,
      tenantId,
      eventName,
      error: errorMessage,
      errorDetails,
      stack: errorStack,
      soketiHost: resolved?.channelHost,
      isRailway: !!process.env.RAILWAY_ENVIRONMENT,
    })
  }
}

