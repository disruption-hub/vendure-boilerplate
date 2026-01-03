import makeWASocket, {
    AuthenticationCreds,
    AuthenticationState,
    BufferJSON,
    DisconnectReason,
    initAuthCreds,
    SignalDataTypeMap,
    WASocket,
    fetchLatestBaileysVersion,
    ConnectionState,
    proto
} from '@whiskeysockets/baileys'
import { WhatsAppMessageType } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import { Boom } from '@hapi/boom'
import { randomUUID } from 'crypto'
import { createLogger } from '../../utils/logger'
import { debugLog } from './debug-logger'

// Logger implementation valid for standalone usage
const logger = createLogger('socket-manager')

/**
 * Standalone Auth State Provider
 * Duplicated logic from PostgreSQLAuthStateProvider to avoid NestJS dependency injection issues
 */
class StandaloneAuthStateProvider {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly sessionId: string,
    ) { }

    async useAuthState(): Promise<{
        state: AuthenticationState
        saveCreds: () => Promise<void>
    }> {
        const session = await this.prisma.whatsAppSession.findUnique({
            where: { sessionId: this.sessionId },
            select: { creds: true },
        })

        let creds: AuthenticationCreds
        const parsedCreds = session?.creds && typeof session.creds === 'object'
            ? JSON.parse(JSON.stringify(session.creds), BufferJSON.reviver)
            : null

        if (parsedCreds && parsedCreds.noiseKey && parsedCreds.signedIdentityKey) {
            creds = parsedCreds
        } else {
            creds = initAuthCreds()
        }

        const saveCreds = async () => {
            try {
                const serializedCreds = JSON.parse(JSON.stringify(creds, BufferJSON.replacer))
                await this.prisma.whatsAppSession.update({
                    where: { sessionId: this.sessionId },
                    data: { creds: serializedCreds },
                })
            } catch (error) {
                logger.error('Error saving creds', { err: error, sessionId: this.sessionId })
            }
        }

        return {
            state: {
                creds,
                keys: {
                    get: async (type, ids) => {
                        const keys: { [id: string]: SignalDataTypeMap[typeof type] } = {}
                        try {
                            const storedKeys = await this.prisma.whatsAppSessionKey.findMany({
                                where: {
                                    sessionId: this.sessionId,
                                    type,
                                    keyId: { in: ids },
                                },
                            })

                            for (const key of storedKeys) {
                                if (key.data) {
                                    keys[key.keyId] = JSON.parse(JSON.stringify(key.data), BufferJSON.reviver)
                                }
                            }
                        } catch (error) {
                            logger.error('Error fetching keys', { err: error, sessionId: this.sessionId })
                        }
                        return keys
                    },
                    set: async (data) => {
                        const tasks: Promise<any>[] = []

                        for (const category in data) {
                            for (const id in data[category]) {
                                const value = data[category][id]
                                const keyId = id
                                const type = category

                                if (value) {
                                    const serializedData = JSON.parse(JSON.stringify(value, BufferJSON.replacer))
                                    tasks.push(
                                        this.prisma.whatsAppSessionKey.upsert({
                                            where: {
                                                sessionId_type_keyId: {
                                                    sessionId: this.sessionId,
                                                    type,
                                                    keyId,
                                                },
                                            },
                                            create: {
                                                id: randomUUID(),
                                                sessionId: this.sessionId,
                                                type,
                                                keyId,
                                                data: serializedData,
                                                updatedAt: new Date(),
                                            },
                                            update: {
                                                data: serializedData,
                                            },
                                        })
                                    )
                                } else {
                                    tasks.push(
                                        this.prisma.whatsAppSessionKey.deleteMany({
                                            where: {
                                                sessionId: this.sessionId,
                                                type,
                                                keyId,
                                            },
                                        })
                                    )
                                }
                            }
                        }

                        try {
                            await Promise.all(tasks)
                        } catch (error) {
                            logger.error('Error saving keys', { err: error, sessionId: this.sessionId })
                        }
                    },
                },
            },
            saveCreds,
        }
    }
}

export interface WhatsAppSocketManagerOptions {
    sessionId: string
    tenantId: string
    prisma: PrismaClient
}

export class WhatsAppSocketManager {
    private socket: WASocket | undefined
    private readonly sessionId: string
    private readonly tenantId: string
    private readonly prisma: PrismaClient
    private connected: boolean = false
    private destroyed: boolean = false

    constructor(options: WhatsAppSocketManagerOptions) {
        this.sessionId = options.sessionId
        this.tenantId = options.tenantId
        this.prisma = options.prisma
    }

    async connect(): Promise<void> {
        if (this.socket || this.destroyed) {
            if (this.destroyed) {
                logger.warn('Attempted to connect a destroyed session manager', { sessionId: this.sessionId })
            }
            return
        }

        logger.info('Connecting session', { sessionId: this.sessionId })

        try {
            debugLog('Starting connection...', { sessionId: this.sessionId })
            const authProvider = new StandaloneAuthStateProvider(this.prisma, this.sessionId)
            const { state, saveCreds } = await authProvider.useAuthState()
            const { version } = await fetchLatestBaileysVersion()

            // Double check destruction before creating socket
            if (this.destroyed) return

            this.socket = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false,
                markOnlineOnConnect: false,
                connectTimeoutMs: 60_000,
                defaultQueryTimeoutMs: 60_000,
                keepAliveIntervalMs: 10_000,
                browser: ['Ubuntu', 'Chrome', '20.0.04'],
                shouldSyncHistoryMessage: () => false, // Worker mostly for QR, don't heavy sync
            })

            this.socket.ev.on('creds.update', async (update) => {
                await saveCreds()

                if (update.me) {
                    const phoneNumber = update.me.id ? update.me.id.split(':')[0].split('@')[0] : undefined
                    const name = update.me.name || update.me.notify

                    if (name || phoneNumber) {
                        logger.info('Updating session info from creds.update', { sessionId: this.sessionId, phoneNumber, name })
                        await this.prisma.whatsAppSession.update({
                            where: { sessionId: this.sessionId },
                            data: {
                                ...(phoneNumber ? { phoneNumber } : {}),
                                ...(name ? { name } : {})
                            }
                        }).catch(err => {
                            logger.warn('Failed to update session info from creds', { err, sessionId: this.sessionId })
                        })
                    }
                }
            })

            this.socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
                if (this.destroyed) return

                const { connection, lastDisconnect, qr } = update

                debugLog('Connection update', { sessionId: this.sessionId, updateKey: Object.keys(update), connection, hasQr: !!qr })

                if (qr) {
                    debugLog('QR generated', { sessionId: this.sessionId })
                    logger.info('QR generated', { sessionId: this.sessionId })

                    // Fetch current metadata to preserve existing fields
                    const currentSession = await this.prisma.whatsAppSession.findUnique({
                        where: { sessionId: this.sessionId },
                        select: { metadata: true, tenantId: true }
                    })
                    const metadata = (currentSession?.metadata as any) || {}
                    const tenantId = currentSession?.tenantId || this.tenantId

                    // Update status to QR_REQUIRED and store QR in metadata
                    await this.prisma.whatsAppSession.update({
                        where: { sessionId: this.sessionId },
                        data: {
                            status: 'QR_REQUIRED',
                            metadata: {
                                ...metadata,
                                lastQrCode: qr,
                                lastQrCodeTimestamp: Date.now()
                            }
                        }
                    }).catch(err => logger.error('Failed to update QR_REQUIRED status', { err, sessionId: this.sessionId }))

                    logger.info('Updated QR code in metadata', { sessionId: this.sessionId })

                    // Broadcast QR code via Soketi for real-time delivery to frontend
                    try {
                        const { broadcastWhatsAppEvent } = await import('../integration/soketi-emitter')
                        await broadcastWhatsAppEvent(this.sessionId, tenantId, 'qr.code', { qr })
                        logger.info('Broadcasted QR code via Soketi', { sessionId: this.sessionId })
                    } catch (broadcastError) {
                        logger.error('Failed to broadcast QR code', { err: broadcastError, sessionId: this.sessionId })
                        // Continue even if broadcast fails - QR is stored in DB for polling fallback
                    }
                }

                if (connection === 'open') {
                    logger.info('Connected', { sessionId: this.sessionId })
                    this.connected = true

                    // Extract user info
                    const user = this.socket?.user
                    const phoneNumber = user?.id ? user.id.split(':')[0].split('@')[0] : undefined
                    const name = user?.name || user?.notify

                    logger.info('Updating session with user info', { sessionId: this.sessionId, phoneNumber, name })

                    await this.prisma.whatsAppSession.update({
                        where: { sessionId: this.sessionId },
                        data: {
                            status: 'CONNECTED',
                            phoneNumber: phoneNumber,
                            name: name
                        }
                    }).catch(err => {
                        logger.warn('Failed to update CONNECTED status and info', { err, sessionId: this.sessionId })
                    })
                } else if (connection === 'close') {
                    this.connected = false
                    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 440 // Conflict

                    logger.info('Disconnected', {
                        sessionId: this.sessionId,
                        statusCode,
                        shouldReconnect,
                        error: lastDisconnect?.error instanceof Error ? lastDisconnect.error.message : String(lastDisconnect?.error)
                    })
                    if (lastDisconnect?.error) {
                        logger.error('Disconnect details', { err: lastDisconnect.error, sessionId: this.sessionId })
                    }

                    if (shouldReconnect && !this.destroyed) {
                        logger.info('Connection closed, reconnecting...', { sessionId: this.sessionId })

                        // Clear current socket
                        this.socket = undefined

                        // Update status to CONNECTING so worker loop keeps it alive
                        try {
                            await this.prisma.whatsAppSession.update({
                                where: { sessionId: this.sessionId },
                                data: { status: 'CONNECTING' }
                            })
                        } catch (e) {
                            logger.info('Session record not found during reconnect update, ignoring', { sessionId: this.sessionId })
                        }

                        // Trigger reconnection immediately
                        // Use a small delay to prevent tight loops
                        setTimeout(() => {
                            if (!this.destroyed) {
                                this.connect().catch(err => {
                                    logger.error('Failed to reconnect', { err, sessionId: this.sessionId })
                                })
                            }
                        }, 2000)
                    } else {
                        // Permanent disconnect (logout or conflict) or destroyed
                        try {
                            if (!this.destroyed) {
                                await this.prisma.whatsAppSession.update({
                                    where: { sessionId: this.sessionId },
                                    data: { status: 'DISCONNECTED' }
                                })
                            }
                        } catch (e) {
                            logger.info('Session record not found during disconnect update (no reconnect), ignoring', { sessionId: this.sessionId })
                        }
                        if (statusCode === DisconnectReason.loggedOut) {
                            // Handle logout cleanup if needed
                        }
                    }
                }
            })



            // Contact Handling - Capture LID mappings
            this.socket.ev.on('contacts.upsert', async (contacts) => {
                if (this.destroyed) return

                try {
                    for (const contact of contacts) {
                        // Check if we have a phone number JID and an LID
                        if (contact.id?.endsWith('@s.whatsapp.net') && (contact as any).lid) {
                            const lid = (contact as any).lid
                            const phoneJid = contact.id

                            try {
                                const existing = await this.prisma.whatsAppContact.findUnique({
                                    where: {
                                        tenantId_jid: {
                                            tenantId: this.tenantId,
                                            jid: phoneJid
                                        }
                                    }
                                })

                                const metadata = (existing?.metadata as any) || {}
                                metadata.lid = lid

                                if (existing) {
                                    await this.prisma.whatsAppContact.update({
                                        where: { id: existing.id },
                                        data: {
                                            metadata,
                                            name: contact.name || contact.notify || existing.name
                                        }
                                    })
                                } else {
                                    await this.prisma.whatsAppContact.create({
                                        data: {
                                            id: randomUUID(),
                                            jid: phoneJid,
                                            name: contact.name || contact.notify,
                                            metadata,
                                            updatedAt: new Date(),
                                            whatsapp_sessions: { connect: { sessionId: this.sessionId } },
                                            tenant: { connect: { id: this.tenantId } }
                                        }
                                    })
                                }
                                logger.debug('Mapped LID to Phone JID', { lid, phoneJid, sessionId: this.sessionId })
                            } catch (e) {
                                logger.warn('Failed to update contact LID mapping', { id: contact.id, error: e })
                            }
                        }
                    }
                } catch (err) {
                    logger.error('Error in contacts.upsert handler', { err, sessionId: this.sessionId })
                }
            })

            // Message Handling
            this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
                if (this.destroyed) return

                // Filter out history syncs or unwanted messages
                if (type !== 'notify') return

                logger.info('📩 [Socket Manager] messages.upsert received', {
                    sessionId: this.sessionId,
                    messageCount: messages.length,
                    type,
                })

                for (const message of messages) {
                    const messageId = message.key.id
                    let remoteJid = message.key.remoteJid

                    // Attempt to resolve LID to Phone Number
                    if (remoteJid?.endsWith('@lid')) {
                        // 1. Try heuristic from participant (common in some flows)
                        const participant = message.key.participant
                        if (participant?.endsWith('@s.whatsapp.net')) {
                            logger.info('Resolved LID via participant', { lid: remoteJid, resolved: participant, sessionId: this.sessionId })
                            remoteJid = participant
                        } else {
                            // 2. Try DB lookup
                            const resolved = await this.resolveJid(remoteJid)
                            if (resolved && resolved !== remoteJid) {
                                logger.info('Resolved LID via DB mapping', { lid: remoteJid, resolved, sessionId: this.sessionId })
                                remoteJid = resolved
                            }
                        }
                    }
                    const fromMe = message.key.fromMe || false

                    if (!messageId || !remoteJid) continue
                    if (remoteJid === 'status@broadcast') continue

                    // Upsert Contact to ensure ID availability for frontend
                    // This fixes 'new contacts not appearing' by ensuring the contact record exists
                    let contactId: string | undefined
                    let contactName: string | undefined
                    try {
                        const contact = await this.prisma.whatsAppContact.upsert({
                            where: { tenantId_jid: { tenantId: this.tenantId, jid: remoteJid } },
                            create: {
                                id: randomUUID(),
                                jid: remoteJid,
                                name: message.pushName,
                                updatedAt: new Date(),
                                whatsapp_sessions: { connect: { sessionId: this.sessionId } },
                                tenant: { connect: { id: this.tenantId } }
                            },
                            update: {
                                name: message.pushName || undefined,
                                lastMessageAt: new Date()
                            }
                        })
                        contactId = contact.id
                        contactName = contact.name || undefined
                    } catch (e) {
                        logger.warn('Contact upsert failed', { err: e })
                    }

                    // Extract Content
                    const content = this.extractMessageContent(message)
                    const messageType = this.determineMessageType(message)

                    logger.info('📩 [Socket Manager] Processing message', {
                        sessionId: this.sessionId,
                        messageId,
                        remoteJid,
                        fromMe,
                        hasContent: !!content,
                        contentPreview: content?.substring(0, 50),
                        messageType,
                        // LID debugging
                        participant: message.key.participant,
                        pushName: message.pushName,
                        fullKey: JSON.stringify(message.key),
                        isLid: remoteJid?.endsWith('@lid'),
                    })

                    // Skip messages without content (status updates, receipts, etc.)
                    // Only process messages that have actual text/media content
                    if (!content && messageType === 'TEXT') {
                        logger.debug('Skipping message without text content', {
                            sessionId: this.sessionId,
                            messageId,
                            fromMe,
                            messageType
                        })
                        continue
                    }

                    try {
                        const timestamp = new Date(Number(message.messageTimestamp) * 1000 || Date.now())

                        // 1. Persist to DB
                        const dbMessage = await this.prisma.whatsAppMessage.upsert({
                            where: { sessionId_messageId: { sessionId: this.sessionId, messageId } },
                            create: {
                                id: randomUUID(),
                                sessionId: this.sessionId,
                                messageId,
                                remoteJid,
                                fromMe,
                                content: content || '',
                                messageType: messageType as WhatsAppMessageType,
                                status: fromMe ? 'SENT' : 'DELIVERED',
                                timestamp,
                                metadata: message as any,
                                updatedAt: new Date()
                            },
                            update: {
                                status: fromMe ? 'SENT' : 'DELIVERED',
                                content: content || '', // Update content in case of edit/correction if supported later
                                metadata: message as any
                            }
                        })

                        // 2. Broadcast via Soketi
                        try {
                            const { broadcastWhatsAppEvent } = await import('../integration/soketi-emitter')
                            await broadcastWhatsAppEvent(this.sessionId, this.tenantId, 'message.received', {
                                id: dbMessage.id,
                                messageId,
                                remoteJid,
                                fromMe,
                                content,
                                timestamp: dbMessage.timestamp,
                                contactId,
                                contactName
                            })
                            logger.info('Broadcasted message.received', { sessionId: this.sessionId, messageId })
                        } catch (broadCastErr) {
                            logger.error('Failed to broadcast message', { err: broadCastErr, sessionId: this.sessionId })
                        }

                    } catch (err) {
                        logger.error('Failed to process incoming message', { err, sessionId: this.sessionId, messageId })
                    }
                }
            })

        } catch (error) {
            logger.error('Failed to connect', { err: error, sessionId: this.sessionId })
            throw error
        }
    }

    async destroy(): Promise<void> {
        this.destroyed = true
        if (this.socket) {
            this.socket.end(undefined)
            this.socket = undefined
        }
        this.connected = false
    }

    getSocket(): WASocket | undefined {
        return this.socket
    }

    isConnected(): boolean {
        return this.connected
    }

    private async resolveJid(jid: string | null | undefined): Promise<string | null | undefined> {
        if (!jid || !jid.endsWith('@lid')) return jid

        try {
            // Attempt to find the phone number JID associated with this LID
            // We search for a contact where metadata.lid == jid
            const contact = await this.prisma.whatsAppContact.findFirst({
                where: {
                    tenantId: this.tenantId,
                    metadata: {
                        path: ['lid'],
                        equals: jid
                    }
                },
                select: { jid: true }
            })

            if (contact) {
                return contact.jid
            }
        } catch (e) {
            logger.warn('Failed to resolve LID', { jid, error: e })
        }

        return jid
    }

    private extractMessageContent(message: proto.IWebMessageInfo): string | null {
        const msg = message.message
        if (!msg) return null
        return msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || null
    }

    private determineMessageType(message: proto.IWebMessageInfo): string {
        const msg = message.message
        if (msg?.imageMessage) return 'IMAGE'
        if (msg?.videoMessage) return 'VIDEO'
        if (msg?.audioMessage) return 'AUDIO'
        return 'TEXT'
    }
}
