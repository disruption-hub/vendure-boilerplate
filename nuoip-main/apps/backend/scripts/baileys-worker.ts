/**
 * Baileys WhatsApp Worker
 * 
 * Polls database every 30 seconds for active WhatsApp sessions
 * and manages Baileys socket connections for each session.
 * 
 * This worker should run as a separate Railway service.
 */

import 'module-alias/register'
import { PrismaService } from '../src/prisma/prisma.service'
import { WhatsAppSocketManager } from '../src/lib/whatsapp/baileys/socket-manager'
import { AdminSystemSettingsService } from '../src/admin/system-settings.service'
import { createLogger } from '../src/lib/utils/logger'

const logger = createLogger('baileys-worker')

// Singleton instances
let prismaService: PrismaService | null = null
let systemSettingsService: AdminSystemSettingsService | null = null

// Active socket managers per session
const socketManagers = new Map<string, WhatsAppSocketManager>()

// Worker loop interval (30 seconds)
const WORKER_INTERVAL_MS = 30000

// Graceful shutdown handler
let isShuttingDown = false

/**
 * Initialize services
 */
async function initializeServices(): Promise<void> {
  try {
    // Initialize Prisma
    prismaService = new PrismaService({} as any) // ConfigService not needed for PrismaService
    await prismaService.onModuleInit()

    // Initialize System Settings Service
    systemSettingsService = new AdminSystemSettingsService(prismaService)

    logger.info('Services initialized successfully')
  } catch (error) {
    logger.error('Error initializing services:', error)
    throw error
  }
}

/**
 * Worker loop: Check for active sessions and manage connections
 */
async function workerLoop(): Promise<void> {
  if (isShuttingDown || !prismaService) {
    return
  }

  try {
    // Find all active sessions (CONNECTING, QR_REQUIRED, CONNECTED)
    const activeSessions = await prismaService.whatsAppSession.findMany({
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

    logger.info('Worker loop: checking sessions', {
      activeSessionCount: activeSessions.length,
      activeManagerCount: socketManagers.size,
    })

    // Process each active session
    for (const session of activeSessions) {
      // Skip if already has a manager
      if (socketManagers.has(session.sessionId)) {
        const manager = socketManagers.get(session.sessionId)!
        // Check if manager is still connected
        if (!manager.isConnected() && session.status === 'CONNECTING') {
          // Try to reconnect if status is CONNECTING
          try {
            await manager.connect()
          } catch (error) {
            logger.error(`Error reconnecting session ${session.sessionId}:`, error)
          }
        }
        continue
      }

      // Create new socket manager for this session
      try {
        const manager = new WhatsAppSocketManager({
          sessionId: session.sessionId,
          tenantId: session.tenantId,
          prisma: prismaService,
          systemSettingsService: systemSettingsService || undefined,
        })

        socketManagers.set(session.sessionId, manager)

        // Connect the socket
        await manager.connect()

        logger.info(`Socket manager created and connected for session ${session.sessionId}`)
      } catch (error) {
        logger.error(`Error creating socket manager for session ${session.sessionId}:`, error)
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
          logger.error(`Error destroying socket manager for session ${sessionId}:`, error)
        }
        socketManagers.delete(sessionId)
      }
    }
  } catch (error) {
    logger.error('Error in worker loop:', error)
  }
}

/**
 * Start the worker
 */
async function startWorker(): Promise<void> {
  logger.info('Starting Baileys worker service')

  try {
    // Initialize services
    await initializeServices()

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
    logger.error('Error starting worker:', error)
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
      logger.error(`Error destroying socket manager for session ${sessionId}:`, error)
    }
  }
  socketManagers.clear()

  // Disconnect Prisma
  if (prismaService) {
    try {
      await prismaService.onModuleDestroy()
    } catch (error) {
      logger.error('Error disconnecting Prisma:', error)
    }
  }

  logger.info('Baileys worker shut down complete')
}

// Start the worker
startWorker().catch((error) => {
  logger.error('Fatal error starting worker:', error)
  process.exit(1)
})

