import { createLogger } from '@/lib/utils/logger'
import type { GroupMetadata } from '@whiskeysockets/baileys'

const logger = createLogger('whatsapp-group-metadata-cache')

/**
 * In-memory cache for group metadata
 * In production, this should use Redis for persistence across instances
 */
class GroupMetadataCache {
  private cache: Map<string, { metadata: GroupMetadata; timestamp: number }> = new Map()
  private readonly TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Get group metadata from cache
   */
  get(jid: string): GroupMetadata | undefined {
    const cached = this.cache.get(jid)
    if (!cached) {
      return undefined
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.TTL_MS) {
      this.cache.delete(jid)
      return undefined
    }

    return cached.metadata
  }

  /**
   * Set group metadata in cache
   */
  set(jid: string, metadata: GroupMetadata): void {
    this.cache.set(jid, {
      metadata,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear cache for a specific group
   */
  delete(jid: string): void {
    this.cache.delete(jid)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Singleton cache instance
const groupMetadataCache = new GroupMetadataCache()

/**
 * Create cachedGroupMetadata function for Baileys socket options
 * This caches group metadata to reduce API calls
 */
export function createCachedGroupMetadata(sessionId: string) {
  return async (jid: string): Promise<GroupMetadata | undefined> => {
    try {
      const cached = groupMetadataCache.get(jid)
      if (cached) {
        logger.debug('Group metadata retrieved from cache', {
          sessionId,
          jid,
        })
        return cached
      }

      // If not in cache, return undefined
      // Baileys will fetch it and call the update function
      return undefined
    } catch (error) {
      logger.error('Failed to get cached group metadata', {
        sessionId,
        jid,
        error: error instanceof Error ? error.message : 'unknown-error',
      })
      return undefined
    }
  }
}

/**
 * Update cached group metadata
 * Called when Baileys receives group metadata updates
 */
export function updateCachedGroupMetadata(sessionId: string, jid: string, metadata: GroupMetadata): void {
  try {
    groupMetadataCache.set(jid, metadata)
    logger.debug('Group metadata cached', {
      sessionId,
      jid,
      subject: metadata.subject,
    })
  } catch (error) {
    logger.error('Failed to cache group metadata', {
      sessionId,
      jid,
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }
}

/**
 * Clear group metadata cache for a session
 */
export function clearGroupMetadataCache(sessionId: string): void {
  // For now, clear all cache
  // In production with Redis, filter by sessionId
  groupMetadataCache.clear()
  logger.info('Group metadata cache cleared', { sessionId })
}



