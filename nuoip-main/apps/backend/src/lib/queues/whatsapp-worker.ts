
import { Worker, Job } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import { createLogger } from '../utils/logger'
import { WhatsAppSocketManager } from '../whatsapp/baileys/socket-manager-standalone'
import { WhatsAppMessageStatus } from '@prisma/client'

const logger = createLogger('whatsapp-worker-queue')

// Shared socket managers map to be used by both the worker loop (for QR/Connection) and the Queue worker (for sending)
export const socketManagers = new Map<string, WhatsAppSocketManager>()

export async function startQueueWorker(prisma: PrismaClient) {
    const connection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
    }

    logger.info('Starting BullMQ worker for whatsapp-outgoing', {
        redis: `${connection.host}:${connection.port}`
    })

    const worker = new Worker('whatsapp-outgoing', async (job: Job) => {
        logger.info(`Processing job ${job.id}`, { name: job.name, data: job.data })

        if (job.name === 'process-outgoing') {
            const { sessionId, jid, text, dbMessageId, messageId } = job.data

            try {
                const manager = socketManagers.get(sessionId)

                if (!manager) {
                    throw new Error(`No active socket manager for session ${sessionId}`)
                }

                if (!manager.isConnected()) {
                    throw new Error(`Socket not connected for session ${sessionId}`)
                }

                const socket = manager.getSocket()
                if (!socket) {
                    throw new Error(`Socket instance missing for ${sessionId}`)
                }

                // Append sender name if present
                const { senderName } = job.data
                const finalText = senderName
                    ? `*${senderName}:* ${text}`
                    : text

                // Send the message
                // CRITICAL: Pass messageId explicitly to ensure Baileys ID matches our DB ID
                await socket.sendMessage(jid, { text: finalText }, { messageId })

                logger.info(`Message sent via queue to ${jid} for session ${sessionId}`)

                // CRITICAL: Update message status in DB to prevent duplicate sends by polling fallback
                if (dbMessageId) {
                    try {
                        await prisma.whatsAppMessage.update({
                            where: { id: dbMessageId },
                            data: {
                                status: 'SENT',
                                deliveredAt: new Date(),
                                metadata: {
                                    processing: false,
                                    processedAt: Date.now(),
                                    sentVia: 'queue',
                                },
                            },
                        })
                        logger.info(`Message ${dbMessageId} status updated to SENT in DB`)
                    } catch (dbError) {
                        logger.warn(`Failed to update message status in DB: ${dbError}`)
                    }
                }

                return { success: true, timestamp: Date.now() }
            } catch (error) {
                logger.error(`Failed to process outgoing message job ${job.id}`, { err: error })
                throw error
            }
        }
    }, {
        connection,
        concurrency: 5, // Process up to 5 messages in parallel
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 }
    })

    worker.on('completed', (job) => {
        logger.debug(`Job ${job.id} completed`)
    })

    worker.on('failed', (job, err) => {
        logger.error(`Job ${job.id} failed`, { err })
    })

    logger.info('BullMQ worker initialized successfully')

    return worker
}
