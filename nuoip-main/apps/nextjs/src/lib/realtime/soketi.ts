import Pusher from 'pusher'
import crypto from 'crypto'
// TODO: Generate Prisma client to use proper types
type ScheduledMessageStatus = string
type ScheduledMessageTarget = string
import {
  buildPresenceThreadChannel,
  type TenantUserThreadEvent,
  type TenantUserThreadReadEvent,
  type TenantUserThreadDeliveredEvent,
} from '@/lib/chatbot/user-thread-utils'
import { getSoketiConfig } from '@/lib/services/admin/system-config-service'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('soketi-realtime')
const DEFAULT_PUSHER_CLUSTER = process.env.SOKETI_PUSHER_CLUSTER?.trim() || 'mt1'

type ResolvedClient = {
  client: Pusher
  channelHost: string
}

let cachedClient: Pusher | null = null
let cachedSignature: string | null = null

// Force cache clear for debugging
setTimeout(() => {
  cachedClient = null
  cachedSignature = null
  console.log('🚨🚨🚨 SOKETI CLIENT CACHE CLEARED 🚨🚨🚨')
}, 1000)

export async function resolveClient(): Promise<ResolvedClient | null> {
  try {
    const config = await getSoketiConfig()
    if (!config || !config.enabled) {
      logger.warn('Soketi not configured or disabled', {
        hasConfig: !!config,
        enabled: config?.enabled,
        envVars: {
          SOKETI_DEFAULT_APP_ID: !!process.env.SOKETI_DEFAULT_APP_ID,
          SOKETI_DEFAULT_APP_KEY: !!process.env.SOKETI_DEFAULT_APP_KEY,
          SOKETI_DEFAULT_APP_SECRET: !!process.env.SOKETI_DEFAULT_APP_SECRET,
          SOKETI_PUBLIC_HOST: !!process.env.SOKETI_PUBLIC_HOST,
          SOKETI_PUBLIC_PORT: !!process.env.SOKETI_PUBLIC_PORT,
        },
      })
      return null
    }

    const host = config.publicHost.trim()
    const port = config.publicPort
    const signature = `${config.appId}:${config.key}:${config.secret}:${host}:${port}:${config.useTLS}`

    if (!cachedClient || cachedSignature !== signature) {
      // Trim all config values to remove trailing newlines from database
      cachedClient = new Pusher({
        appId: config.appId.trim(),
        key: config.key.trim(),
        secret: config.secret.trim(),
        host,
        port: port ? String(port) : undefined,
        useTLS: config.useTLS,
      })
      cachedSignature = signature
      logger.info('Initialized Soketi client', {
        host,
        port,
        useTLS: config.useTLS,
        appId: config.appId,
        isRailway: !!process.env.RAILWAY_ENVIRONMENT,
        isVercel: !!process.env.VERCEL,
      })
    }

    return { client: cachedClient, channelHost: config.publicHost }
  } catch (error) {
    logger.error('Unable to initialize Soketi client', {
      error: error instanceof Error ? error.message : 'unknown-error',
      stack: error instanceof Error ? error.stack : undefined,
      isRailway: !!process.env.RAILWAY_ENVIRONMENT,
      isVercel: !!process.env.VERCEL,
    })
    return null
  }
}

export async function authorizeSoketiChannel(
  socketId: string,
  channelName: string,
  data?: Pusher.PresenceChannelData,
): Promise<string | null> {
  console.log('🔐🔐🔐 authorizeSoketiChannel: STARTING MANUAL AUTHORIZATION 🔐🔐🔐', {
    socketId,
    channelName,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
  })

  const config = await getSoketiConfig()
  if (!config || !config.enabled) {
    console.log('authorizeSoketiChannel: No config available')
    return null
  }

  console.log('authorizeSoketiChannel: Config loaded', {
    hasAppId: !!config.appId,
    hasKey: !!config.key,
    hasSecret: !!config.secret,
    appId: config.appId,
    keyPrefix: config.key ? config.key.substring(0, 5) + '...' : 'missing',
    secretPrefix: config.secret ? config.secret.substring(0, 5) + '...' : 'missing',
    // Log partial hash of secret to verify match without exposing it
    secretHash: config.secret ? crypto.createHash('sha256').update(config.secret).digest('hex').substring(0, 8) : 'missing',
    configSource: config.internalHost ? 'env-vars' : 'database', // Heuristic: env vars usually set internalHost
  })

  try {
    // Manual authorization signature generation (Soketi/Pusher format)
    // For private channels: sign "socketId:channelName"
    // For presence channels: sign "socketId:channelName:channelData"

    let stringToSign = `${socketId}:${channelName}`
    let channelData: string | undefined = undefined

    // If it's a presence channel, include channel_data
    if (channelName.startsWith('presence-')) {
      if (!data) {
        console.error('authorizeSoketiChannel: Presence channel requires channelData but none provided', {
          channelName,
          socketId,
        })
        return null
      }
      channelData = JSON.stringify(data)
      stringToSign = `${socketId}:${channelName}:${channelData}`
      console.log('authorizeSoketiChannel: Presence channel detected', {
        channelName,
        channelDataLength: channelData.length,
        stringToSignLength: stringToSign.length,
        hasData: !!data,
      })
    } else {
      console.log('authorizeSoketiChannel: Private channel', {
        channelName,
        stringToSignLength: stringToSign.length,
      })
    }

    // Generate HMAC-SHA256 signature
    // CRITICAL: Trim the secret to remove any trailing newlines from database/env
    const signature = crypto
      .createHmac('sha256', config.secret.trim())
      .update(stringToSign)
      .digest('hex')

    console.log('authorizeSoketiChannel: Signature generated', {
      stringToSignLength: stringToSign.length,
      signatureLength: signature.length,
      signaturePrefix: signature.substring(0, 20) + '...',
    })

    // Build auth string: APP_KEY:SIGNATURE
    // CRITICAL: Trim the key to remove any trailing newlines from database/env
    const authString = `${config.key.trim()}:${signature}`

    // Build response object
    const authResponse: any = {
      auth: authString,
    }

    // Add channel_data for presence channels
    // CRITICAL: channel_data must be a JSON string (not object) for Pusher
    if (channelData) {
      // channelData is already a JSON string from JSON.stringify(data) above
      // Ensure it's a string, not an object
      if (typeof channelData === 'string') {
        authResponse.channel_data = channelData
      } else {
        // If somehow it's not a string, stringify it
        console.warn('authorizeSoketiChannel: channelData is not a string, stringifying', {
          type: typeof channelData,
          isObject: typeof channelData === 'object',
        })
        authResponse.channel_data = JSON.stringify(channelData)
      }
    }

    // Validate response format before returning
    if (!authResponse.auth || typeof authResponse.auth !== 'string') {
      console.error('authorizeSoketiChannel: Invalid auth string generated', {
        hasAuth: !!authResponse.auth,
        authType: typeof authResponse.auth,
      })
      return null
    }

    const responseString = JSON.stringify(authResponse)

    // Verify the response can be parsed back (sanity check)
    try {
      const verify = JSON.parse(responseString)
      if (!verify.auth || typeof verify.auth !== 'string') {
        console.error('authorizeSoketiChannel: Response validation failed after stringify')
        return null
      }
    } catch (verifyError) {
      console.error('authorizeSoketiChannel: Response validation parse failed', verifyError)
      return null
    }

    console.log('✅✅✅ authorizeSoketiChannel: MANUAL AUTH SUCCESS ✅✅✅', {
      channelName,
      responseLength: responseString.length,
      hasAuth: !!authResponse.auth,
      hasChannelData: !!authResponse.channel_data,
      channelDataType: typeof authResponse.channel_data,
      authLength: authResponse.auth?.length,
      authPrefix: authResponse.auth?.substring(0, 50) + '...',
      fullResponse: authResponse,
    })

    return responseString
  } catch (error) {
    console.error('❌❌❌ authorizeSoketiChannel: MANUAL AUTH FAILED ❌❌❌', {
      channelName,
      error: error instanceof Error ? error.message : 'unknown-error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return null
  }
}

export async function broadcastTenantUserMessage(payload: TenantUserThreadEvent): Promise<void> {
  const resolved = await resolveClient()
  if (!resolved) {
    return
  }

  const channel = buildPresenceThreadChannel(payload.tenantId, payload.threadKey)

  try {
    await resolved.client.trigger(channel, 'tenant-user-message', payload)
  } catch (error) {
    logger.error('Failed to broadcast tenant user message', {
      channel,
      tenantId: payload.tenantId,
      threadKey: payload.threadKey,
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }
}

export async function broadcastTenantUserReadReceipt(event: TenantUserThreadReadEvent): Promise<void> {
  const resolved = await resolveClient()
  if (!resolved) {
    return
  }

  const channel = buildPresenceThreadChannel(event.tenantId, event.threadKey)

  try {
    await resolved.client.trigger(channel, 'tenant-user-message-read', event)
  } catch (error) {
    logger.error('Failed to broadcast read receipt', {
      channel,
      tenantId: event.tenantId,
      threadKey: event.threadKey,
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }
}

export async function broadcastTenantUserDeliveryReceipt(event: TenantUserThreadDeliveredEvent): Promise<void> {
  const resolved = await resolveClient()
  if (!resolved) {
    return
  }

  const channel = buildPresenceThreadChannel(event.tenantId, event.threadKey)

  try {
    await resolved.client.trigger(channel, 'tenant-user-message-delivered', event)
  } catch (error) {
    logger.error('Failed to broadcast delivery receipt', {
      channel,
      tenantId: event.tenantId,
      threadKey: event.threadKey,
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }
}

export interface ScheduledMessageEventPayload {
  id: string
  contactId?: string | null
  contactKey?: string | null
  scheduledAt?: string
  status?: ScheduledMessageStatus
  sentAt?: string
  lastError?: string | null
  content?: string
  targetType?: ScheduledMessageTarget
}

export interface ScheduledMessageEvent {
  tenantId: string
  senderId: string
  contactId: string | null
  contactKey?: string | null
  scheduledMessageId: string
  payload: ScheduledMessageEventPayload
}

export async function broadcastScheduledMessageEvent(event: ScheduledMessageEvent): Promise<void> {
  const resolved = await resolveClient()
  if (!resolved) {
    return
  }

  const channel = `private-scheduled.${event.tenantId}.${event.senderId}`

  try {
    await resolved.client.trigger(channel, 'scheduled-message-update', {
      scheduledMessageId: event.scheduledMessageId,
      contactId: event.contactId,
      contactKey: event.contactKey ?? event.payload.contactKey ?? null,
      ...event.payload,
    })
  } catch (error) {
    logger.error('Failed to broadcast scheduled message event', {
      channel,
      tenantId: event.tenantId,
      senderId: event.senderId,
      scheduledMessageId: event.scheduledMessageId,
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }
}

export interface PaymentNotificationPayload {
  type: 'payment'
  id?: string
  amount: number | string
  currency?: string
  customer?: {
    name?: string
    email?: string
  }
  link?: {
    id?: string
    description?: string
  }
  mode?: string
  timestamp?: string
  tenantId?: string
}

export async function broadcastPaymentNotification(payload: PaymentNotificationPayload): Promise<void> {
  const resolved = await resolveClient()
  if (!resolved) {
    logger.warn('Cannot broadcast payment notification: Soketi not configured')
    return
  }

  const tenantId = payload.tenantId
  if (!tenantId) {
    logger.warn('Cannot broadcast payment notification: tenantId is required')
    return
  }

  const channel = `private-tenant.${tenantId}.notifications`

  try {
    await resolved.client.trigger(channel, 'payment-notification', payload)
    logger.info('Payment notification broadcasted successfully', {
      channel,
      tenantId,
      paymentId: payload.id,
    })
  } catch (error) {
    logger.error('Failed to broadcast payment notification', {
      channel,
      tenantId,
      paymentId: payload.id,
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }
}

export async function broadcastTenantNotification(
  tenantId: string,
  eventName: string,
  data: any
): Promise<void> {
  const resolved = await resolveClient()
  if (!resolved) {
    return
  }

  const channel = `private-tenant.${tenantId}.notifications`

  try {
    await resolved.client.trigger(channel, eventName, data)
    logger.info('Tenant notification broadcasted', {
      channel,
      tenantId,
      eventName,
    })
  } catch (error) {
    logger.error('Failed to broadcast tenant notification', {
      channel,
      tenantId,
      eventName,
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }
}

// Ticket events
export interface TicketCreatedEvent {
  tenantId: string
  ticketId: string
  customerId: string
  type: string
  priority: string
  title: string
}

export interface TicketUpdatedEvent {
  tenantId: string
  ticketId: string
  status?: string
  priority?: string
  assignedToId?: string
}

export interface TicketCommentAddedEvent {
  tenantId: string
  ticketId: string
  commentId: string
  authorId: string
  authorName: string
  content: string
  isInternal: boolean
}

export async function broadcastTicketCreated(payload: TicketCreatedEvent): Promise<void> {
  const resolved = await resolveClient()
  if (!resolved) {
    return
  }

  const channel = `private-tenant.${payload.tenantId}.tickets`

  try {
    await resolved.client.trigger(channel, 'ticket-created', payload)
    logger.info('Ticket created event broadcasted', {
      channel,
      ticketId: payload.ticketId,
      tenantId: payload.tenantId,
    })
  } catch (error) {
    logger.error('Failed to broadcast ticket created event', {
      channel,
      ticketId: payload.ticketId,
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }
}

export async function broadcastTicketUpdated(payload: TicketUpdatedEvent): Promise<void> {
  const resolved = await resolveClient()
  if (!resolved) {
    return
  }

  const channel = `private-tenant.${payload.tenantId}.tickets`

  try {
    await resolved.client.trigger(channel, 'ticket-updated', payload)
    logger.info('Ticket updated event broadcasted', {
      channel,
      ticketId: payload.ticketId,
      tenantId: payload.tenantId,
    })
  } catch (error) {
    logger.error('Failed to broadcast ticket updated event', {
      channel,
      ticketId: payload.ticketId,
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }
}

export async function broadcastTicketCommentAdded(payload: TicketCommentAddedEvent): Promise<void> {
  const resolved = await resolveClient()
  if (!resolved) {
    return
  }

  const channel = `private-tenant.${payload.tenantId}.tickets`

  try {
    await resolved.client.trigger(channel, 'ticket-comment-added', payload)
    logger.info('Ticket comment added event broadcasted', {
      channel,
      ticketId: payload.ticketId,
      commentId: payload.commentId,
      tenantId: payload.tenantId,
    })
  } catch (error) {
    logger.error('Failed to broadcast ticket comment added event', {
      channel,
      ticketId: payload.ticketId,
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }
}

export interface PublicRealtimeConfig {
  key: string
  host: string
  port: number
  useTLS: boolean
  appId: string
  cluster: string
}

export async function getPublicRealtimeConfig(): Promise<PublicRealtimeConfig | null> {
  console.log('🎯🎯🎯 getPublicRealtimeConfig CALLED 🎯🎯🎯')
  console.log('getPublicRealtimeConfig: Getting config')
  const config = await getSoketiConfig()
  console.log('getPublicRealtimeConfig: Got config', {
    exists: !!config,
    enabled: config?.enabled,
    host: config?.publicHost,
    port: config?.publicPort,
    appId: config?.appId,
  })

  if (!config || !config.enabled) {
    console.log('getPublicRealtimeConfig: Config not available or disabled')
    return null
  }

  const result = {
    key: config.key,
    host: (config.publicHost || '').trim(),
    port: config.publicPort,
    useTLS: config.useTLS,
    appId: config.appId,
    cluster: DEFAULT_PUSHER_CLUSTER,
  }

  console.log('getPublicRealtimeConfig: Returning config', {
    key: result.key.substring(0, 10) + '...',
    host: result.host,
    port: result.port,
    useTLS: result.useTLS,
    appId: result.appId,
    cluster: result.cluster,
  })
  return result
}
