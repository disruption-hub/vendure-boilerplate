/**
 * Baileys WhatsApp Worker (Standalone - No NestJS dependencies)
 * 
 * Polls database every 30 seconds for active WhatsApp sessions
 * and manages Baileys socket connections for each session.
 * 
 * This worker should run as a separate Railway service.
 * It uses Prisma Client directly, without NestJS dependencies.
 * 
 * IMPORTANT: This script will exit immediately if it detects it's being
 * run in a NestJS context (e.g., if main.js exists and is being loaded).
 */

import 'module-alias/register'

// Early exit if this is being run in NestJS context
// Check if we're being executed via main.js (NestJS entry point)
const isNestJSContext = process.argv.some(arg => arg.includes('main.js')) ||
  process.env.NODE_ENV === 'production' && !process.env.SERVICE_TYPE &&
  !process.env.RAILWAY_SERVICE_NAME?.includes('Worker')

if (isNestJSContext && !process.env.SERVICE_TYPE && !process.env.RAILWAY_SERVICE_NAME?.includes('Worker')) {
  console.error('❌ ERROR: Baileys Worker script detected NestJS context!')
  console.error('❌ This script should NOT be executed via NestJS (main.js)')
  console.error('❌ Please use: npm run worker:baileys')
  console.error('❌ Or set SERVICE_TYPE=worker environment variable')
  process.exit(1)
}
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { WhatsAppSocketManager } from '../src/lib/whatsapp/baileys/socket-manager-standalone'
import { createLogger } from '../src/lib/utils/logger'
// Import shared socket managers map to prevent conflicts with BullMQ worker
import { socketManagers, startQueueWorker } from '../src/lib/queues/whatsapp-worker'

const logger = createLogger('baileys-worker')
import { debugLog } from '../src/lib/whatsapp/baileys/debug-logger'

// Prisma Client instance
let prisma: PrismaClient | null = null

// Active socket managers per session (Now imported from whatsapp-worker to share state)
// const socketManagers = new Map<string, WhatsAppSocketManager>()

// Worker loop interval (3 seconds for fast QR code generation since worker is single owner of sockets)
const WORKER_INTERVAL_MS = 3000

// Graceful shutdown handler
let isShuttingDown = false

/**
 * Initialize Prisma Client (standalone, no NestJS)
 */
async function initializePrisma(): Promise<PrismaClient> {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    logger.error('DATABASE_URL is required but not found')
    logger.error('Please configure DATABASE_URL in Railway service variables')
    logger.error('Or link the PostgreSQL database service to this worker service')
    throw new Error('DATABASE_URL is required but not found')
  }

  // Create a connection pool for the adapter
  const pool = new Pool({
    connectionString: databaseUrl,
  })

  // Create the Prisma adapter
  const adapter = new PrismaPg(pool)

  // Initialize PrismaClient with the adapter
  const prismaClient = new PrismaClient({ adapter })

  // Connect to database
  await prismaClient.$connect()

  logger.info('Prisma Client initialized and connected to database')

  // Start BullMQ queue worker for instant message processing
  await startQueueWorker(prismaClient)
  logger.info('✅ BullMQ queue worker started for instant message processing')
  // logger.info('ℹ️ BullMQ worker skipped (module not found), using polling fallback')

  return prismaClient
}

/**
 * Process pending outgoing messages (FALLBACK for messages not  in queue)
 */
async function processPendingMessages(): Promise<void> {
  if (!prisma) return

  try {
    // Find pending messages for active sessions
    // CRITICAL: Only process outgoing bot messages (fromMe: true), not incoming user messages
    // This prevents the worker from sending user messages back to users, which causes echoes
    const pendingMessages = await prisma.whatsAppMessage.findMany({
      where: {
        status: 'PENDING',
        fromMe: true, // CRITICAL: Only process outgoing bot messages, not incoming user messages
        // Only process messages created in the last 24 hours to avoid stuck messages
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      take: 50, // Batch size
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (pendingMessages.length > 0) {
      logger.info(`Found ${pendingMessages.length} pending messages to send`)
    }

    for (const msg of pendingMessages) {
      const manager = socketManagers.get(msg.sessionId)

      // If no manager or not connected, skip (will be picked up later)
      if (!manager || !manager.isConnected()) {
        continue
      }

      // Check if message is currently being processed (lock check)
      const metadata = (msg.metadata as Record<string, any>) || {}
      if (metadata.processing && metadata.processingStartedAt) {
        const processingTime = Date.now() - (metadata.processingStartedAt as number)
        // If processing started less than 5 minutes ago, assume it's still being handled and skip
        if (processingTime < 300000) {
          logger.debug(`Skipping locked message ${msg.id} (processing for ${processingTime}ms)`)
          continue
        }
        // If > 5 mins, assume lock is stale and retry
        logger.warn(`Retrying stale locked message ${msg.id} (locked ${processingTime}ms ago)`)
      }

      try {
        // LOCK the message immediately
        await prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: {
            metadata: {
              ...metadata,
              processing: true,
              processingStartedAt: Date.now(),
              workerId: process.env.RAILWAY_REPLICA_ID || 'unknown',
            },
          },
        })

        const socket = manager.getSocket()
        if (socket) {
          logger.info(`Sending pending message ${msg.id} to ${msg.remoteJid}`)

          // Send message via Baileys
          // TODO: Handle different message types (currently text only)
          // CRITICAL: Pass messageId explicitly to ensure Baileys ID matches our DB ID
          await socket.sendMessage(msg.remoteJid, { text: msg.content || '' }, { messageId: msg.messageId })

          // Update status to SENT
          await prisma.whatsAppMessage.update({
            where: { id: msg.id },
            data: {
              status: 'SENT',
              deliveredAt: new Date(), // Optimistic delivery time
              metadata: {
                ...metadata,
                processing: false, // Unlock
                processedAt: Date.now(),
              },
            },
          })

          logger.info(`Message ${msg.id} sent successfully`)
        }
      } catch (error) {
        logger.error(`Error sending message ${msg.id}`, { err: error })

        // Update status to FAILED
        await prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: {
            status: 'FAILED',
            errorMessage: String(error),
            metadata: {
              ...metadata,
              processing: false, // Unlock even on failure
              failedAt: Date.now(),
            },
          },
        })
      }
    }
  } catch (error) {
    logger.error('Error processing pending messages', { err: error })
  }
}

/**
 * Worker loop: Check for active sessions and manage connections
 */
async function workerLoop(): Promise<void> {
  if (isShuttingDown || !prisma) {
    return
  }

  try {
    // Find all active sessions (CONNECTING, QR_REQUIRED, CONNECTED)
    const activeSessions = await prisma.whatsAppSession.findMany({
      where: {
        status: {
          in: ['CONNECTING', 'QR_REQUIRED', 'CONNECTED'],
        },
      },
      select: {
        sessionId: true,
        tenantId: true,
        status: true,
      },
    })

    // debugLog import moved to top level

    logger.info('Worker loop: checking sessions', {
      activeSessionCount: activeSessions.length,
      activeManagerCount: socketManagers.size,
    })

    debugLog('Worker loop', { activeSessions: activeSessions.length, managers: socketManagers.size })

    // ✅ SELECTIVE SOCKET CREATION:
    // - Create sockets for QR generation (CONNECTING, QR_REQUIRED)
    // - Skip CONNECTED sessions (handled by BullMQ worker)
    // This prevents WhatsApp conflict errors while allowing QR code generation

    // Process each active session
    for (const session of activeSessions) {


      // Skip if already has a manager - let it handle its own reconnection internally
      // This prevents the worker loop from competing with the socket manager's internal reconnect logic
      // which was causing 440 conflict errors (multiple concurrent connection attempts)
      if (socketManagers.has(session.sessionId)) {
        logger.debug(`Manager exists for session ${session.sessionId}, skipping (socket manager handles reconnection)`)
        continue
      }

      // Create new socket manager for all active sessions (including CONNECTED)
      if (session.status === 'CONNECTING' || session.status === 'QR_REQUIRED' || session.status === 'CONNECTED') {
        try {
          logger.info(`Creating socket manager for QR generation: ${session.sessionId} (${session.status})`)

          const manager = new WhatsAppSocketManager({
            sessionId: session.sessionId,
            tenantId: session.tenantId,
            prisma: prisma,
          })

          socketManagers.set(session.sessionId, manager)

          // Connect the socket
          await manager.connect()

          logger.info(`Socket manager created and connected for session ${session.sessionId}`)
        } catch (error) {
          logger.error(`Error creating socket manager for session ${session.sessionId}`, { err: error })
        }
      }
    }

    // Clean up managers for sessions that are no longer active
    const activeSessionIds = new Set(activeSessions.map((s) => s.sessionId))
    for (const [sessionId, manager] of socketManagers.entries()) {
      if (!activeSessionIds.has(sessionId)) {
        logger.info(`Cleaning up socket manager for inactive session ${sessionId}`)
        try {
          await manager.destroy()
        } catch (error) {
          logger.error(`Error destroying socket manager for session ${sessionId}`, { err: error })
        }
        socketManagers.delete(sessionId)
      }
    }

    // Process pending messages (Still keeping as backup, but queue should handle most)
    await processPendingMessages()
  } catch (error) {
    logger.error('Error in worker loop', { err: error })
  }
}

/**
 * Start the worker
 */
async function startWorker(): Promise<void> {
  logger.info('Starting Baileys worker service (standalone)')

  try {
    // Initialize Prisma
    prisma = await initializePrisma()

    // Start worker loop
    logger.info('Baileys worker service is running')

    // Run immediately, then every 30 seconds
    await workerLoop()
    const intervalId = setInterval(async () => {
      if (!isShuttingDown) {
        await workerLoop()
      } else {
        clearInterval(intervalId)
      }
    }, WORKER_INTERVAL_MS)

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...')
      await shutdown()
      process.exit(0)
    })

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...')
      await shutdown()
      process.exit(0)
    })
  } catch (error) {
    logger.error('Error starting worker', { err: error })
    process.exit(1)
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(): Promise<void> {
  isShuttingDown = true

  logger.info('Shutting down Baileys worker...')

  // Destroy all socket managers
  for (const [sessionId, manager] of socketManagers.entries()) {
    try {
      await manager.destroy()
    } catch (error) {
      logger.error(`Error destroying socket manager for session ${sessionId}`, { err: error })
    }
  }
  socketManagers.clear()

  // Disconnect Prisma
  if (prisma) {
    try {
      await prisma.$disconnect()
    } catch (error) {
      logger.error('Error disconnecting Prisma', { err: error })
    }
  }

  logger.info('Baileys worker shut down complete')
}

// Start the worker
startWorker().catch((error) => {
  logger.error('Fatal error starting worker', { err: error })
  process.exit(1)
})

