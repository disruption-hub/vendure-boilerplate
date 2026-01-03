import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('whatsapp-soketi-emitter')

// Stub for resolveClient (soketi.ts uses server-side modules)
const resolveClient = async () => {
  if (typeof window === 'undefined') {
    // Server-side: would need actual soketi implementation
    return null
  }
  // Client-side: return null for now
  return null
}

/**
 * Build WhatsApp Soketi channel name
 * Using public channel instead of private to avoid auth issues
 * Session IDs are unique, so this is safe
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
  data: any
): Promise<void> {
  const resolved = await resolveClient()
  if (!resolved) {
    logger.warn('Cannot broadcast WhatsApp event: Soketi not configured', {
      sessionId,
      eventName,
      hasEnvVars: {
        SOKETI_APP_ID: !!process.env.SOKETI_APP_ID,
        SOKETI_APP_KEY: !!process.env.SOKETI_APP_KEY,
        SOKETI_APP_SECRET: !!process.env.SOKETI_APP_SECRET,
        SOKETI_HOST: !!process.env.SOKETI_HOST,
      },
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
    
    await resolved.client.trigger(channel, eventName, payload)

    // Always log QR code events for debugging
    if (eventName === 'qr.code') {
      logger.info('QR code event broadcasted to Soketi', {
        channel,
        sessionId,
        tenantId,
        eventName,
        qrLength: typeof data?.qr === 'string' ? data.qr.length : 0,
        soketiHost: resolved.channelHost,
      })
    } else {
      logger.debug('WhatsApp event broadcasted', {
        channel,
        sessionId,
        tenantId,
        eventName,
      })
    }
  } catch (error) {
    logger.error('Failed to broadcast WhatsApp event', {
      channel,
      sessionId,
      tenantId,
      eventName,
      error: error instanceof Error ? error.message : 'unknown-error',
      stack: error instanceof Error ? error.stack : undefined,
      soketiHost: resolved?.channelHost,
    })
  }
}

/**
 * WhatsApp event types
 */
export interface WhatsAppConnectionUpdateEvent {
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_required' | 'error'
  timestamp: number
}

export interface WhatsAppQRCodeEvent {
  qr: string
  timestamp: number
}

export interface WhatsAppMessageReceivedEvent {
  id: string
  messageId: string
  remoteJid: string
  fromMe: boolean
  content: string | null
  messageType: string
  timestamp: Date
}

export interface WhatsAppMessageStatusEvent {
  messageId: string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  deliveredAt?: Date
  readAt?: Date
}

export interface WhatsAppChatUpdateEvent {
  chats?: any[]
  updates?: any[]
  type: 'upsert' | 'update'
}

export interface WhatsAppContactUpdateEvent {
  contacts?: any[]
  updates?: any[]
  type: 'upsert' | 'update'
}

export interface WhatsAppGroupUpdateEvent {
  groups?: any[]
  updates?: any[]
  type: 'upsert' | 'update'
}

