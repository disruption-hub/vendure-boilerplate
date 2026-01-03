
import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { proto } from '@whiskeysockets/baileys'
import { WhatsAppMessageStatus, WhatsAppMessageType, Prisma, ChatbotContactType } from '@prisma/client'
import { randomUUID } from 'crypto'
import { BroadcastService } from '../../socket/services/broadcast.service'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { WhatsAppContactService } from './whatsapp.contact.service'

@Injectable()
export class WhatsAppMessageService {
    private readonly logger = new Logger(WhatsAppMessageService.name)

    constructor(
        private readonly prisma: PrismaService,
        private readonly broadcastService: BroadcastService,
        @InjectQueue('whatsapp-incoming') private incomingQueue: Queue,
        @InjectQueue('whatsapp-outgoing') private outgoingQueue: Queue,
        private readonly contactService: WhatsAppContactService, // Injected
    ) { }

    async sendWhatsAppMessage(sessionId: string, jid: string, message: string, senderName?: string) {
        this.logger.log(`Queueing outgoing message for ${sessionId} to ${jid} (Sender: ${senderName || 'System'})`)
        await this.outgoingQueue.add('process-outgoing', {
            sessionId,
            jid, // Use jid key directly to match worker expectation
            text: message, // Worker expects 'text'
            senderName
        })

        return { success: true, message: 'Message queued' }
    }

    // ... existing code ...

    private async updateContactFromMessage(
        sessionId: string,
        tenantId: string,
        dbMessage: any,
        baileysMessage: proto.IWebMessageInfo
    ) {
        // Simplified contact update logic from message-handler.ts
        // Returns { contactId, contactName }
        const remoteJid = dbMessage.remoteJid
        const timestamp = dbMessage.timestamp

        // Upsert WhatsAppContact
        const contact = await this.prisma.whatsAppContact.upsert({
            where: { tenantId_jid: { tenantId, jid: remoteJid } },
            create: {
                id: randomUUID(),
                tenantId,
                sessionId,
                jid: remoteJid,
                lastMessageAt: timestamp,
                unreadCount: dbMessage.fromMe ? 0 : 1,
                updatedAt: new Date(),
                sessionStatus: 'CLOSED' // Default explicit
            },
            update: {
                lastMessageAt: timestamp,
                unreadCount: dbMessage.fromMe ? 0 : { increment: 1 },
                sessionId // auto-update session
            },
            include: { chatbotContact: true }
        })

        // Auto-Open Session Logic
        if (!dbMessage.fromMe && contact.sessionStatus === 'CLOSED') {
            await this.contactService.openSession(contact.id, timestamp);
        }

        return {
            contactId: contact.chatbotContactId,
            contactName: contact.name
        }
    }
}
