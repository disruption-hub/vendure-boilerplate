import { proto, type WASocket } from '@whiskeysockets/baileys'
import { WhatsAppMessageType, WhatsAppMessageStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { broadcastWhatsAppEvent } from '@/lib/whatsapp/integration/soketi-emitter'
import { WhatsAppMessageRouter } from './message-router'

const logger = createLogger('whatsapp-message-handler')

/**
 * Handles incoming and outgoing WhatsApp messages
 */
export class WhatsAppMessageHandler {
  private sessionId: string
  private tenantId: string
  private router: WhatsAppMessageRouter

  constructor(sessionId: string, tenantId: string) {
    this.sessionId = sessionId
    this.tenantId = tenantId
    this.router = new WhatsAppMessageRouter(sessionId, tenantId)
  }

  /**
   * Register message event handlers
   */
  register(socket: WASocket): void {
    // Handle new messages
    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      for (const message of messages) {
        await this.handleMessageUpsert(message, type)
      }
    })

    // Handle message updates (delivery, read receipts)
    socket.ev.on('messages.update', async (updates) => {
      for (const update of updates) {
        await this.handleMessageUpdate(update)
      }
    })

    logger.info('Message handlers registered', { sessionId: this.sessionId })
  }

  /**
   * Handle message upsert (new message)
   */
  private async handleMessageUpsert(message: proto.IWebMessageInfo, type: string): Promise<void> {
    try {
      const messageId = message.key.id
      const remoteJid = message.key.remoteJid
      const fromMe = message.key.fromMe || false

      if (!messageId || !remoteJid) {
        return
      }

      // Extract message content
      const content = this.extractMessageContent(message)
      const messageType = this.determineMessageType(message) as WhatsAppMessageType

      // Store message in database
      const dbMessage = await prisma.whatsAppMessage.upsert({
        where: {
          sessionId_messageId: {
            sessionId: this.sessionId,
            messageId,
          },
        },
        create: {
          sessionId: this.sessionId,
          messageId,
          remoteJid,
          fromMe,
          content,
          messageType,
          status: (fromMe ? 'SENT' : 'PENDING') as WhatsAppMessageStatus,
          timestamp: new Date(Number(message.messageTimestamp) * 1000 || Date.now()),
          metadata: message as any,
        },
        update: {
          content,
          messageType,
          metadata: message as any,
        },
      })

      // Emit to Soketi
      await broadcastWhatsAppEvent(this.sessionId, this.tenantId, 'message.received', {
        id: dbMessage.id,
        messageId,
        remoteJid,
        fromMe,
        content,
        messageType,
        timestamp: dbMessage.timestamp,
      })

      // Route message if incoming
      if (!fromMe) {
        await this.router.routeMessage(dbMessage, message)
      }
    } catch (error) {
      logger.error('Failed to handle message upsert', {
        sessionId: this.sessionId,
        error: error instanceof Error ? error.message : 'unknown-error',
      })
    }
  }

  /**
   * Handle message update (delivery, read receipts)
   */
  private async handleMessageUpdate(update: any): Promise<void> {
    try {
      const messageId = update.key?.id
      if (!messageId) {
        return
      }

      const updateData: any = {}

      // Check for delivery status
      if (update.update?.status === proto.WebMessageInfo.Status.DELIVERY_ACK) {
        updateData.status = 'DELIVERED'
        updateData.deliveredAt = new Date()
      }

      // Check for read status
      if (update.update?.status === proto.WebMessageInfo.Status.READ) {
        updateData.status = 'READ'
        updateData.readAt = new Date()
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.whatsAppMessage.updateMany({
          where: {
            sessionId: this.sessionId,
            messageId,
          },
          data: updateData,
        })

        // Emit to Soketi
        await broadcastWhatsAppEvent(this.sessionId, this.tenantId, 'message.status', {
          messageId,
          ...updateData,
        })
      }
    } catch (error) {
      logger.error('Failed to handle message update', {
        sessionId: this.sessionId,
        error: error instanceof Error ? error.message : 'unknown-error',
      })
    }
  }

  /**
   * Extract message content from Baileys message
   */
  private extractMessageContent(message: proto.IWebMessageInfo): string | null {
    const msg = message.message
    if (!msg) {
      return null
    }

    if (msg.conversation) {
      return msg.conversation
    }

    if (msg.extendedTextMessage?.text) {
      return msg.extendedTextMessage.text
    }

    // Handle other message types
    if (msg.imageMessage?.caption) {
      return msg.imageMessage.caption
    }

    if (msg.videoMessage?.caption) {
      return msg.videoMessage.caption
    }

    return null
  }

  /**
   * Determine message type from Baileys message
   */
  private determineMessageType(message: proto.IWebMessageInfo): WhatsAppMessageType {
    const msg = message.message
    if (!msg) {
      return 'TEXT'
    }

    if (msg.imageMessage) {
      return 'IMAGE' as WhatsAppMessageType
    }

    if (msg.videoMessage) {
      return 'VIDEO' as WhatsAppMessageType
    }

    if (msg.audioMessage) {
      return 'AUDIO' as WhatsAppMessageType
    }

    if (msg.documentMessage) {
      return 'DOCUMENT' as WhatsAppMessageType
    }

    if (msg.stickerMessage) {
      return 'STICKER' as WhatsAppMessageType
    }

    if (msg.locationMessage) {
      return 'LOCATION' as WhatsAppMessageType
    }

    if (msg.contactMessage) {
      return 'CONTACT' as WhatsAppMessageType
    }

    if (msg.buttonsResponseMessage || msg.buttonsMessage) {
      return 'BUTTONS' as WhatsAppMessageType
    }

    if (msg.listResponseMessage || msg.listMessage) {
      return 'LIST' as WhatsAppMessageType
    }

    return 'TEXT' as WhatsAppMessageType
  }
}

