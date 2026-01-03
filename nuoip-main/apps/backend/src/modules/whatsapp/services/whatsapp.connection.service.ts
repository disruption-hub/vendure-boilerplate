
import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject, forwardRef } from '@nestjs/common'
import makeWASocket, {
    ConnectionState,
    DisconnectReason,
    WASocket,
    fetchLatestBaileysVersion,
    isJidUser,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { PrismaService } from '../../../prisma/prisma.service'
import { BroadcastService } from '../../socket/services/broadcast.service'
import { PostgreSQLAuthStateProvider } from './auth-state-provider'
import { WhatsAppMessageService } from './whatsapp.message.service'
import { WhatsAppSessionService } from './whatsapp.session.service'

@Injectable()
export class WhatsAppConnectionService implements OnModuleInit, OnModuleDestroy {
    private sockets: Map<string, WASocket> = new Map()
    private readonly logger = new Logger(WhatsAppConnectionService.name)
    private reconnectTimers: Map<string, NodeJS.Timeout> = new Map()
    // Store QR codes in memory for status API fallback (when Soketi events are missed)
    private qrCodes: Map<string, { qr: string; timestamp: number }> = new Map()

    constructor(
        private readonly prisma: PrismaService,
        private readonly broadcastService: BroadcastService,
        private readonly sessionService: WhatsAppSessionService,
        @Inject(forwardRef(() => WhatsAppMessageService))
        private readonly messageService: WhatsAppMessageService,
    ) { }

    async onModuleInit() {
        this.logger.log('Initializing WhatsAppConnectionService...')
        // In a real production startup, we would fetch all 'CONNECTED' sessions and reconnect them.
        // For now, we wait for explicit connect calls or implement a startup logic in a separate "Bootstrap" service.
        // Or we can do it here:
        await this.recoverSessions()
    }

    async onModuleDestroy() {
        this.logger.log('Destroying WhatsAppConnectionService...')
        for (const [sessionId, socket] of this.sockets.entries()) {
            try {
                socket.end(undefined)
            } catch (e) {
                this.logger.error(`Error closing socket for ${sessionId}`, e)
            }
        }
        this.sockets.clear()
        this.reconnectTimers.forEach(t => clearTimeout(t))
        this.reconnectTimers.clear()
    }

    private async recoverSessions() {
        // Fetch sessions that should be connected
        const connectedSessions = await this.prisma.whatsAppSession.findMany({
            where: { status: 'CONNECTED' }
        })
        this.logger.log(`🔄 Recovering ${connectedSessions.length} sessions (delegating to worker)`)
        for (const session of connectedSessions) {
            await this.connect(session.sessionId, session.tenantId)
        }
    }

    async connect(sessionId: string, tenantId: string) {
        // Delegate connection to Baileys Worker
        // We only update the DB to 'CONNECTING' and the worker loop will pick it up.

        this.logger.log(`🔌 Requesting connection for session ${sessionId} (delegating to worker)`)

        try {
            // Step 1: Create/update session in database
            this.logger.log(`📝 Creating/updating session record for ${sessionId}`)
            await this.sessionService.create(sessionId, tenantId, undefined)

            // Step 2: Set status to CONNECTING so worker picks it up
            await this.sessionService.updateStatus(sessionId, 'CONNECTING')

            // Step 3: Broadcast connecting status for UI feedback
            this.logger.log(`📡 Broadcasting connecting status for ${sessionId}`)
            await this.broadcastService.broadcast(`whatsapp.${sessionId}`, 'connection.update', { status: 'connecting' })

            this.logger.log(`✅ Connection request delegated to worker for ${sessionId}`)

        } catch (e) {
            this.logger.error(`💥 Failed to initiate connection for session ${sessionId}:`, e)
            throw e
        }
    }


    private scheduleReconnect(sessionId: string, tenantId: string) {
        // Cancel any existing timer first
        const existingTimer = this.reconnectTimers.get(sessionId)
        if (existingTimer) {
            clearTimeout(existingTimer)
        }

        // Basic exponential backoff implementation needed
        // For now just fixed delay 5s
        const timer = setTimeout(async () => {
            // Check if session still exists before reconnecting
            // If it was deleted, don't reconnect
            try {
                const session = await this.sessionService.findOne(sessionId)
                if (!session || session.sessionId.startsWith('deleted-')) {
                    this.logger.log(`⏹️ Session ${sessionId} was deleted, skipping reconnect`)
                    this.reconnectTimers.delete(sessionId)
                    return
                }
                this.connect(sessionId, tenantId)
            } catch (e) {
                this.logger.error(`Error checking session before reconnect: ${e}`)
            }
        }, 5000)
        this.reconnectTimers.set(sessionId, timer)
    }

    /**
     * Disconnect a session - cancels reconnect timer and closes socket
     * Call this before deleting a session to prevent it from being recreated
     */
    /**
     * Disconnect a session - updates status so worker stops reconnecting
     */
    async disconnect(sessionId: string) {
        this.logger.log(`🔌 Requesting disconnect for session ${sessionId}`)

        // Update status to DISCONNECTED - worker loop will see this and clean up
        try {
            await this.sessionService.updateStatus(sessionId, 'DISCONNECTED')
            this.logger.log(`✅ Disconnect requested for ${sessionId}`)
        } catch (e) {
            this.logger.error(`Error requesting disconnect for ${sessionId}:`, e)
        }
    }

    async sendMessage(sessionId: string, jid: string, text: string, senderName?: string) {
        // Delegate to MessageService which uses the outgoing queue
        this.logger.log(`📨 Queuing message for session ${sessionId} to ${jid}`)
        return this.messageService.sendWhatsAppMessage(sessionId, jid, text, senderName)
    }

    /**
     * Get stored QR code for a session (fallback for when Soketi events are missed)
     * Returns undefined if no QR code is stored or if it's older than 2 minutes
     */
    getQrCode(sessionId: string): string | undefined {
        const stored = this.qrCodes.get(sessionId)
        if (!stored) return undefined

        // QR codes expire after 2 minutes
        const MAX_QR_AGE_MS = 2 * 60 * 1000
        if (Date.now() - stored.timestamp > MAX_QR_AGE_MS) {
            this.qrCodes.delete(sessionId)
            return undefined
        }

        return stored.qr
    }

    getSocket(sessionId: string): WASocket | undefined {
        return this.sockets.get(sessionId)
    }
}

