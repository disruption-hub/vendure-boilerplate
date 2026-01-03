import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as Pusher from 'pusher'
import { AdminSystemSettingsService } from './system-settings.service'
import { randomUUID } from 'crypto'

interface WhatsAppSession {
  id: string
  sessionId: string
  tenantId: string
  name: string | null
  phoneNumber: string | null
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR_REQUIRED' | 'ERROR'
  isActive: boolean
  browserActive: boolean
  lastSync: string
  lastConnected: string | null
  errorMessage: string | null
}

@Injectable()
export class AdminWhatsAppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemSettingsService: AdminSystemSettingsService,
  ) {
  }



  async getSessions(): Promise<{ sessions: WhatsAppSession[]; summary: any }> {
    try {
      // Fetch real sessions from database using Prisma
      // Filter out soft-deleted sessions (archived)
      const sessions = await this.prisma.whatsAppSession.findMany({
        where: {
          NOT: {
            sessionId: {
              startsWith: 'deleted-'
            }
          }
        },
        orderBy: { lastSync: 'desc' },
        select: {
          id: true,
          sessionId: true,
          tenantId: true,
          name: true,
          phoneNumber: true,
          status: true,
          isActive: true,
          browserActive: true,
          lastSync: true,
          lastConnected: true,
          errorMessage: true,
          creds: true, // Needed to check if credentials exist
          metadata: true, // Needed to check for QR codes
          whatsapp_session_configs: true, // Needed for routingRule
        },
      })

      // Calculate summary
      // Count sessions with QR codes (either status is QR_REQUIRED or has QR in metadata)
      const sessionsWithQR = sessions.filter(s => {
        if (s.status === 'QR_REQUIRED') return true
        // Also check metadata for QR code (in case status hasn't been updated yet)
        if (s.metadata && typeof s.metadata === 'object') {
          const metadata = s.metadata as any
          return !!metadata?.lastQrCode && typeof metadata.lastQrCode === 'string'
        }
        return false
      })

      const summary = {
        total: sessions.length,
        connected: sessions.filter(s => s.status === 'CONNECTED').length,
        qrRequired: sessionsWithQR.length,
        // Connecting should exclude sessions that have QR codes (they're in qrRequired)
        connecting: sessions.filter(s =>
          s.status === 'CONNECTING' && !sessionsWithQR.includes(s)
        ).length,
      }

      // Map Prisma enum to string for compatibility
      const mappedSessions = await Promise.all(sessions.map(async (s) => {
        // Get real stats from database
        const messagesCount = await this.prisma.whatsAppMessage.count({
          where: { sessionId: s.sessionId }
        })

        const contactsCount = await this.prisma.whatsAppContact.count({
          where: { sessionId: s.sessionId }
        })

        const config = (s as any).whatsapp_session_configs || null

        return {
          id: s.id,
          sessionId: s.sessionId,
          tenantId: s.tenantId,
          name: s.name,
          phoneNumber: s.phoneNumber,
          status: s.status as WhatsAppSession['status'],
          isActive: s.isActive,
          browserActive: s.browserActive,
          lastSync: s.lastSync.toISOString(),
          lastConnected: s.lastConnected?.toISOString() || null,
          errorMessage: s.errorMessage,
          routingRule: config?.routingRule || 'FLOWBOT_FIRST', // Expose routingRule for frontend toggle
          config: config || undefined,
          stats: {
            messages: messagesCount,
            contacts: contactsCount
          },
          timestamps: {
            createdAt: s.lastSync.toISOString(), // Use lastSync as createdAt fallback
            updatedAt: s.lastSync.toISOString()
          },
          runtime: {
            socket: {
              status: s.status.toLowerCase(),
              isActuallyConnected: s.isActive && s.status === 'CONNECTED',
              socketExists: s.isActive,
              hasCredentials: Object.keys(s.creds || {}).length > 0,
              lastConnectionEventAt: s.lastConnected?.toISOString() || null,
              lastDisconnectReason: s.errorMessage,
              lastQRCodeDetectedAt: null,
              reconnectAttempts: 0
            }
          }
        }
      }))

      return {
        sessions: mappedSessions,
        summary
      }
    } catch (error) {
      console.error('Error fetching WhatsApp sessions:', error)
      // Return empty data on error
      return { sessions: [], summary: { total: 0, connected: 0, qrRequired: 0, connecting: 0 } }
    }
  }

  async connect(sessionId: string, tenantId: string, name?: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Create or update session record in database
      const session = await this.prisma.whatsAppSession.upsert({
        where: { sessionId },
        update: {
          status: 'CONNECTING',
          name: name || undefined,
          lastSync: new Date(),
        },
        create: {
          id: randomUUID(),
          sessionId,
          tenantId,  // Use tenant ID from authenticated user
          name: name || `Session ${new Date().toLocaleString()}`,
          status: 'CONNECTING',
          creds: {},
          isActive: false,
          browserActive: false,
          lastSync: new Date(),
          updatedAt: new Date(),
        },
      })

      // Ensure session config exists with FLOWBOT_FIRST routing (so flowbot responds by default)
      await this.prisma.whatsAppSessionConfig.upsert({
        where: { sessionId },
        update: {},
        create: {
          id: randomUUID(),
          sessionId,
          routingRule: 'FLOWBOT_FIRST', // Default: flowbot responds first, like in full chat
          autoReplyEnabled: false,
          updatedAt: new Date(),
        },
      })

      console.log(`[WhatsApp Service] Session ${sessionId} created with CONNECTING status`)

      // NOTE: We do NOT create the Baileys socket here anymore.
      // The baileys-worker polls the database and creates sockets for CONNECTING sessions.
      // This prevents conflict (440 error) from multiple processes creating sockets for the same session.
      console.log(`[WhatsApp Service] Worker will pick up session ${sessionId} and create socket for QR generation`)

      // Migrate orphaned contacts from previously deleted sessions
      // This prevents duplicate contacts when a session is recreated
      try {
        await this.migrateOrphanedContacts(session.tenantId, sessionId)
        console.log(`[WhatsApp Service] ✅ Completed contact migration check for ${sessionId}`)
      } catch (migrationError) {
        console.error(`[WhatsApp Service] ⚠️ Contact migration failed for ${sessionId}:`, {
          error: migrationError instanceof Error ? migrationError.message : String(migrationError)
        })
        // Don't fail the connection if migration fails
      }

      return { success: true, message: 'Connection initiated - QR code will appear via WebSocket' }
    } catch (error) {
      console.error(`[WhatsApp Service] Error connecting session ${sessionId}:`, error)
      return { success: false, message: 'Failed to initiate connection' }
    }
  }

  async disconnect(sessionId: string): Promise<{ success: boolean; message?: string }> {
    // TODO: Implement actual WhatsApp disconnection logic
    console.log(`[WhatsApp Service] Disconnect called for session: ${sessionId}`)
    return { success: true, message: 'Disconnected' }
  }

  async getStatus(sessionId: string): Promise<{ status: string; qr?: string; socketStatus?: string }> {
    try {
      // Fetch real session status from database
      const session = await this.prisma.whatsAppSession.findUnique({
        where: { sessionId },
        select: {
          status: true,
          metadata: true,
          isActive: true,
        },
      })

      if (!session) {
        return { status: 'DISCONNECTED' }
      }

      // QR codes are sent via real-time WebSocket events (Soketi), not stored in DB
      // The status endpoint only returns the connection status
      // The frontend should receive QR codes via WebSocket 'qr.code' events
      const status = session.status as string

      // Check metadata for any stored QR (though typically QR comes via WebSocket)
      const qrFromMetadata = session.metadata && typeof session.metadata === 'object'
        ? (session.metadata as any)?.lastQrCode
        : undefined

      // Derive socketStatus from DB status and isActive flag
      // In a distributed setup, we can't easily query the worker process, so DB is the source of truth
      let socketStatus = 'disconnected'
      if (session.isActive && status === 'CONNECTED') {
        socketStatus = 'connected'
      } else if (status === 'CONNECTING') {
        socketStatus = 'connecting'
      } else if (status === 'QR_REQUIRED') {
        socketStatus = 'qr_required'
      }

      return {
        status,
        qr: qrFromMetadata, // May be undefined - QR should come via WebSocket
        socketStatus,
      }
    } catch (error) {
      console.error(`[WhatsApp Service] Error getting status for session ${sessionId}:`, error)
      return { status: 'ERROR' }
    }
  }

  /**
   * Resolve contactId to JID variations, tenantId, and sessionIds
   * Handles ChatbotContact ID, WhatsAppContact ID, direct JID, or phone number
   */
  private async resolveContactToJid(
    contactId: string,
    sessionId?: string
  ): Promise<{ jids: string[]; tenantId?: string; fallbackSessionIds: string[] }> {
    console.log(`[WhatsApp Service] Resolving contactId: ${contactId}`)

    let tenantId: string | undefined
    let resolvedJid: string | null = null
    const fallbackSessionIds: string[] = []

    // 1. Try to find ChatbotContact first to get tenantId directly
    const chatbotContact = await this.prisma.chatbotContact.findUnique({
      where: { id: contactId },
      select: { id: true, tenantId: true },
    })

    if (chatbotContact) {
      tenantId = chatbotContact.tenantId
      console.log(`[WhatsApp Service] Found ChatbotContact, tenantId: ${tenantId}`)

      // Find linked WhatsApp contact to get the JID
      const whatsappContact = await this.prisma.whatsAppContact.findFirst({
        where: { chatbotContactId: contactId },
        select: { jid: true, sessionId: true },
      })

      if (whatsappContact) {
        resolvedJid = whatsappContact.jid
        fallbackSessionIds.push(whatsappContact.sessionId)
        console.log(`[WhatsApp Service] Found linked WhatsAppContact, jid: ${resolvedJid}`)
      } else {
        // Fallback: Try to find WhatsAppContact by phone number from ChatbotContact
        const chatbotContactWithPhone = await this.prisma.chatbotContact.findUnique({
          where: { id: contactId },
          select: { phone: true, tenantId: true },
        })

        if (chatbotContactWithPhone?.phone) {
          console.log(`[WhatsApp Service] No linked WhatsAppContact found, trying to find by phone: ${chatbotContactWithPhone.phone}`)

          // Normalize phone number for matching (remove +, spaces, and non-digits)
          const normalizedPhone = chatbotContactWithPhone.phone.replace(/^\+/, '').replace(/\D/g, '')
          const phoneWithPlus = `+${normalizedPhone}`
          const phoneWithoutPlus = normalizedPhone

          // Try to find WhatsAppContact by phone number within the tenant
          // Match various phone formats and JID patterns
          const whatsappContactByPhone = await this.prisma.whatsAppContact.findFirst({
            where: {
              tenantId: chatbotContactWithPhone.tenantId,
              OR: [
                { phoneNumber: chatbotContactWithPhone.phone },
                { phoneNumber: phoneWithPlus },
                { phoneNumber: phoneWithoutPlus },
                { phoneNumber: { contains: normalizedPhone } },
                { jid: { contains: normalizedPhone } },
                { jid: { contains: `${normalizedPhone}@` } },
              ],
            },
            select: { id: true, jid: true, sessionId: true, phoneNumber: true },
          })

          if (whatsappContactByPhone) {
            resolvedJid = whatsappContactByPhone.jid
            fallbackSessionIds.push(whatsappContactByPhone.sessionId)
            console.log(`[WhatsApp Service] Found WhatsAppContact by phone, jid: ${resolvedJid}`)

            // Link the WhatsAppContact to the ChatbotContact for future lookups
            await this.prisma.whatsAppContact.updateMany({
              where: { id: whatsappContactByPhone.id },
              data: { chatbotContactId: contactId },
            }).catch(err => {
              console.warn(`[WhatsApp Service] Failed to link WhatsAppContact to ChatbotContact:`, err)
            })
          } else {
            console.warn(`[WhatsApp Service] No WhatsAppContact found for ChatbotContact ${contactId} with phone ${chatbotContactWithPhone.phone}`)
          }
        } else {
          console.warn(`[WhatsApp Service] ChatbotContact ${contactId} has no phone number, cannot find WhatsAppContact`)
        }
      }
    } else {
      // 2. Fallback: Check if contactId is a WhatsAppContact ID
      const whatsappContact = await this.prisma.whatsAppContact.findUnique({
        where: { id: contactId },
        select: { jid: true, sessionId: true },
      })

      if (whatsappContact) {
        resolvedJid = whatsappContact.jid
        fallbackSessionIds.push(whatsappContact.sessionId)
        console.log(`[WhatsApp Service] Found WhatsAppContact by ID, jid: ${resolvedJid}`)

        // Get tenantId from session
        const session = await this.prisma.whatsAppSession.findUnique({
          where: { sessionId: whatsappContact.sessionId },
          select: { tenantId: true },
        })
        tenantId = session?.tenantId
      }
    }

    // 2.5. Try to find User by ID (for TenantUser contacts)
    if (!resolvedJid) {
      const user = await this.prisma.user.findUnique({
        where: { id: contactId },
        select: { id: true, phone: true, tenantId: true, metadata: true },
      })

      if (user) {
        tenantId = user.tenantId
        console.log(`[WhatsApp Service] Found User, tenantId: ${tenantId}`)

        // Check metadata for whatsappJid first
        const userMetadata = user.metadata as Record<string, any> | null
        if (userMetadata?.whatsappJid) {
          resolvedJid = userMetadata.whatsappJid
          if (userMetadata.whatsappSessionId) {
            fallbackSessionIds.push(userMetadata.whatsappSessionId)
          }
          console.log(`[WhatsApp Service] Found User with whatsappJid in metadata: ${resolvedJid}`)
        }

        // Fallback: Find WhatsAppContact by user's phone number
        if (!resolvedJid && user.phone) {
          const normalizedPhone = user.phone.replace(/^\+/, '').replace(/\D/g, '')
          const whatsappByPhone = await this.prisma.whatsAppContact.findFirst({
            where: {
              tenantId: user.tenantId,
              OR: [
                { phoneNumber: user.phone },
                { phoneNumber: { contains: normalizedPhone } },
                { jid: { contains: normalizedPhone } },
              ],
            },
            select: { jid: true, sessionId: true },
          })

          if (whatsappByPhone) {
            resolvedJid = whatsappByPhone.jid
            fallbackSessionIds.push(whatsappByPhone.sessionId)
            console.log(`[WhatsApp Service] Found WhatsAppContact by User phone: ${resolvedJid}`)
          }
        }
      }
    }

    // 3. If still not found, check if contactId is actually a JID or phone number
    if (!resolvedJid) {
      const isJid = contactId.includes('@')
      const isPhoneNumber = /^\d+$/.test(contactId.trim())

      let jidToSearch = contactId

      if (isPhoneNumber && !isJid) {
        // Try to find WhatsApp contact by phone number
        const phoneContact = await this.prisma.whatsAppContact.findFirst({
          where: {
            OR: [{ phoneNumber: contactId }, { jid: { contains: contactId } }],
          },
          select: { jid: true, sessionId: true },
        })

        if (phoneContact) {
          jidToSearch = phoneContact.jid
          resolvedJid = phoneContact.jid
          fallbackSessionIds.push(phoneContact.sessionId)
          console.log(`[WhatsApp Service] Found WhatsAppContact by phone, jid: ${resolvedJid}`)

          // Get tenantId from session
          const session = await this.prisma.whatsAppSession.findUnique({
            where: { sessionId: phoneContact.sessionId },
            select: { tenantId: true },
          })
          tenantId = session?.tenantId
        } else {
          // Construct JID from phone number
          jidToSearch = `${contactId}@s.whatsapp.net`
          resolvedJid = jidToSearch
        }
      } else {
        resolvedJid = jidToSearch
      }

      // Try to find tenantId from passed sessionId
      if (!tenantId && sessionId) {
        const session = await this.prisma.whatsAppSession.findUnique({
          where: { sessionId },
          select: { tenantId: true },
        })
        tenantId = session?.tenantId
        if (sessionId) fallbackSessionIds.push(sessionId)
      }

      // If still no tenantId, try to find ANY contact with this JID
      if (!tenantId && resolvedJid) {
        const anyContact = await this.prisma.whatsAppContact.findFirst({
          where: {
            OR: [
              { jid: resolvedJid },
              { jid: { contains: contactId } },
              { phoneNumber: isPhoneNumber ? contactId : undefined },
            ].filter(Boolean),
          },
          include: { whatsapp_sessions: true },
        })

        if (anyContact?.whatsapp_sessions) {
          tenantId = anyContact.whatsapp_sessions.tenantId
          if (anyContact.sessionId) fallbackSessionIds.push(anyContact.sessionId)
          console.log(`[WhatsApp Service] Found tenantId from contact lookup: ${tenantId}`)
        }
      }
    }

    // Generate all possible JID variations
    // Only generate variations if we have a valid JID (contains @)
    // If resolvedJid is still null or doesn't look like a JID, don't use it
    if (!resolvedJid || (!resolvedJid.includes('@') && !/^\d+$/.test(resolvedJid.trim()))) {
      console.warn(`[WhatsApp Service] Could not resolve valid JID for contactId: ${contactId}`, {
        resolvedJid,
        tenantId,
        fallbackSessionIds,
      })
      // Return empty jids array to prevent invalid queries
      return { jids: [], tenantId, fallbackSessionIds }
    }

    const jids = this.generateJidVariations(resolvedJid)

    console.log(`[WhatsApp Service] Resolved contact:`, {
      jids,
      tenantId,
      fallbackSessionIds,
      resolvedJid,
    })

    return { jids, tenantId, fallbackSessionIds }
  }

  /**
   * Generate all possible JID format variations
   */
  private generateJidVariations(jid: string): string[] {
    const variations = [jid]

    // Handle @lid format
    if (jid.endsWith('@lid')) {
      const numberPart = jid.replace('@lid', '')
      variations.push(`${numberPart}@s.whatsapp.net`)
    }

    // Handle @s.whatsapp.net format
    if (jid.endsWith('@s.whatsapp.net')) {
      const numberPart = jid.replace('@s.whatsapp.net', '')
      variations.push(`${numberPart}@lid`)
    }

    // Handle @g.us (group) - no variations needed
    if (jid.endsWith('@g.us')) {
      // Groups don't have alternative formats
    }

    return [...new Set(variations)] // Remove duplicates
  }

  /**
   * Resolve all session IDs for a tenant, including fallback session IDs
   */
  private async resolveSessionsForTenant(
    tenantId: string,
    fallbackSessionIds: string[]
  ): Promise<string[]> {
    console.log(`[WhatsApp Service] Resolving sessions for tenant: ${tenantId}`)

    const tenantSessions = await this.prisma.whatsAppSession.findMany({
      where: { tenantId },
      select: { sessionId: true },
    })

    const sessionIds = tenantSessions.map((s) => s.sessionId)

    // Add fallback session IDs that aren't already in the list
    for (const fallbackId of fallbackSessionIds) {
      if (fallbackId && !sessionIds.includes(fallbackId)) {
        sessionIds.push(fallbackId)
      }
    }

    console.log(`[WhatsApp Service] Resolved ${sessionIds.length} sessions for tenant ${tenantId}`)

    return sessionIds
  }

  /**
   * Build Prisma where clause for message query by JID
   */
  private buildMessageWhereClause(
    jids: string[],
    sessionIds?: string[],
    status?: string
  ): any {
    const whereClause: any = {
      remoteJid: { in: jids },
    }

    if (sessionIds && sessionIds.length > 0) {
      whereClause.sessionId = { in: sessionIds }
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    console.log(`[WhatsApp Service] Built where clause:`, {
      jidCount: jids.length,
      sessionCount: sessionIds?.length || 0,
      status,
      hasSessionFilter: !!whereClause.sessionId,
    })

    return whereClause
  }

  /**
   * Build Prisma where clause for message query by sessionId only
   */
  private buildMessageWhereClauseForSession(
    sessionIds?: string[],
    status?: string
  ): any {
    const whereClause: any = {}

    if (sessionIds && sessionIds.length > 0) {
      whereClause.sessionId = { in: sessionIds }
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    console.log(`[WhatsApp Service] Built where clause for session:`, {
      sessionCount: sessionIds?.length || 0,
      status,
    })

    return whereClause
  }

  /**
   * Execute message query with fallback mechanism
   */
  private async executeMessageQuery(
    whereClause: any,
    limit: number,
    tenantId: string | undefined,
    jids: string[]
  ): Promise<any[]> {
    const startTime = Date.now()

    // Primary query
    let messages = await this.prisma.whatsAppMessage.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit || 100,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    const queryTime = Date.now() - startTime
    console.log(`[WhatsApp Service] Primary query returned ${messages.length} messages in ${queryTime}ms`)

    // Fallback: If no results and we have tenantId, try without session filter
    if (messages.length === 0 && tenantId && whereClause.sessionId) {
      console.log(
        `[WhatsApp Service] Primary query returned 0 results, attempting fallback query without session filter`
      )

      const fallbackWhereClause: any = {
        remoteJid: { in: jids },
      }

      if (whereClause.status) {
        fallbackWhereClause.status = whereClause.status
      }

      // Find all tenant sessions to ensure we're still querying within tenant
      const tenantSessions = await this.prisma.whatsAppSession.findMany({
        where: { tenantId },
        select: { sessionId: true },
      })

      const tenantSessionIds = tenantSessions.map((s) => s.sessionId)

      // Query messages that match JID and are in tenant sessions
      // We use a subquery approach: find messages by JID, then filter by session
      const fallbackMessages = await this.prisma.whatsAppMessage.findMany({
        where: {
          remoteJid: { in: jids },
          sessionId: { in: tenantSessionIds },
          ...(whereClause.status ? { status: whereClause.status } : {}),
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit || 100,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      const fallbackTime = Date.now() - startTime
      console.log(
        `[WhatsApp Service] Fallback query returned ${fallbackMessages.length} messages in ${fallbackTime}ms`
      )

      messages = fallbackMessages
    }

    // Reverse to chronological order (oldest -> newest) for chat display
    messages.reverse()

    return messages
  }

  async getMessages(
    sessionId?: string,
    status?: string,
    limit?: number,
    contactId?: string
  ): Promise<{ messages: any[]; sessionSummaries: any[]; activities: any[] }> {
    try {
      console.log(`[WhatsApp Service] getMessages called:`, {
        sessionId,
        contactId,
        status,
        limit,
      })

      // If no contactId and no sessionId, return empty
      if (!contactId && !sessionId) {
        console.warn(`[WhatsApp Service] No contactId or sessionId provided`)
        return { messages: [], sessionSummaries: [], activities: [] }
      }

      let jids: string[] = []
      let tenantId: string | undefined
      let sessionIds: string[] | undefined

      // Check if contactId is actually a JID (contains @)
      const isDirectJid = contactId?.includes('@') || false

      // Resolve contact to JID and tenant
      if (contactId) {
        const resolved = await this.resolveContactToJid(contactId, sessionId)
        jids = resolved.jids
        tenantId = resolved.tenantId

        // CRITICAL: If sessionId is provided and we're querying by JID,
        // ensure we use the provided sessionId even if contact resolution found different sessions
        if (sessionId && isDirectJid) {
          // Get tenantId from the provided sessionId
          const session = await this.prisma.whatsAppSession.findUnique({
            where: { sessionId },
            select: { tenantId: true },
          })

          if (session) {
            tenantId = session.tenantId
            // Use the provided sessionId plus any resolved fallback sessions
            sessionIds = [sessionId, ...resolved.fallbackSessionIds.filter(s => s !== sessionId)]
            console.log(`[WhatsApp Service] Using provided sessionId for direct JID query:`, {
              sessionId,
              tenantId,
              jids,
              isDirectJid,
            })
          } else {
            console.warn(`[WhatsApp Service] Provided sessionId not found: ${sessionId}`)
            sessionIds = resolved.fallbackSessionIds.length > 0 ? resolved.fallbackSessionIds : [sessionId]
          }
        } else if (tenantId) {
          // Standard path: resolve sessions for tenant
          sessionIds = await this.resolveSessionsForTenant(tenantId, resolved.fallbackSessionIds)
        } else if (resolved.fallbackSessionIds.length > 0) {
          // Use fallback session IDs if no tenant found
          sessionIds = resolved.fallbackSessionIds
        }
      } else if (sessionId) {
        // Query by sessionId only (no contactId/jid)
        const session = await this.prisma.whatsAppSession.findUnique({
          where: { sessionId },
          select: { tenantId: true },
        })
        tenantId = session?.tenantId
        sessionIds = [sessionId]
      }

      // CRITICAL: If we have a contactId but no valid JIDs, return empty messages
      // This prevents returning all session messages when we can't resolve a specific contact
      if (contactId && jids.length === 0) {
        console.warn(`[WhatsApp Service] Cannot query messages for contactId ${contactId} - no valid JID resolved. Returning empty messages.`)
        return { messages: [], sessionSummaries: [], activities: [] }
      }

      // Build where clause
      // Only include JID filter if we have JIDs (when querying by contactId)
      // If querying by sessionId only, don't filter by remoteJid
      const whereClause = jids.length > 0
        ? this.buildMessageWhereClause(jids, sessionIds, status)
        : this.buildMessageWhereClauseForSession(sessionIds, status)

      console.log(`[WhatsApp Service] Built query:`, {
        jidsCount: jids.length,
        jidsPreview: jids.slice(0, 3),
        sessionIdsCount: sessionIds?.length || 0,
        sessionIdsPreview: sessionIds?.slice(0, 3),
        status,
        isDirectJid,
        whereClauseHasJidFilter: !!whereClause.remoteJid,
        whereClauseHasSessionFilter: !!whereClause.sessionId,
      })

      // Execute query with fallback
      const messages = await this.executeMessageQuery(
        whereClause,
        limit || 100,
        tenantId,
        jids.length > 0 ? jids : []
      )

      // Reverse to chronological order (oldest -> newest) for chat display
      messages.reverse()

      let sessionSummaries: any[] = []
      let activities: any[] = []

      if (contactId && jids.length > 0) {
        // Find the actual Contact ID (using the first JID if multiple)
        const contact = await this.prisma.whatsAppContact.findUnique({
          where: { tenantId_jid: { tenantId: tenantId!, jid: jids[0] } },
          select: { id: true }
        })
        const resolvedContactId = contact?.id

        if (resolvedContactId) {
          // Fetch Closed Session Summaries (End Markers)
          sessionSummaries = await this.prisma.crmSessionSummary.findMany({
            where: { contactId: resolvedContactId },
            orderBy: { date: 'asc' }, // End date
            take: 20
          })

          // Fetch Activities (Transfers, Notes, etc.)
          activities = await this.prisma.crmActivity.findMany({
            where: {
              contactId: resolvedContactId,
              type: 'note'
            },
            orderBy: { createdAt: 'asc' },
            take: 20,
            // createdById is a string, not a relation in some schemas, but we'll try to map it manually
          })

          // Hydrate author names manually
          const userIds = new Set<string>()
          sessionSummaries.forEach(s => s.createdById && userIds.add(s.createdById))
          activities.forEach(a => a.createdById && userIds.add(a.createdById))

          if (userIds.size > 0) {
            const users = await this.prisma.user.findMany({
              where: { id: { in: Array.from(userIds) } },
              select: { id: true, name: true, email: true }
            })

            const userMap = new Map(users.map(u => [u.id, u.name || u.email]))

            // Hydrate author names
            sessionSummaries = sessionSummaries.map(s => ({
              ...s,
              authorName: userMap.get(s.createdById) || 'System'
            }))
            activities = activities.map(a => ({
              ...a,
              authorName: userMap.get(a.createdById) || 'System'
            }))
          }
        }
      }

      console.log(`[WhatsApp Service] getMessages completed:`, {
        messageCount: messages.length,
        summaryCount: sessionSummaries.length,
        activityCount: activities.length,
      })

      return { messages, sessionSummaries, activities }
    } catch (error) {
      console.error('[WhatsApp Service] Error fetching messages:', error)
      return { messages: [], sessionSummaries: [], activities: [] }
    }
  }


  async getContacts(sessionId?: string): Promise<{ contacts: any[] }> {
    try {
      console.log(`[WhatsApp Service] Fetching contacts: sessionId=${sessionId || 'all'}`)

      // Build where clause
      const whereClause: any = {}

      // If sessionId provided, get tenantId from session and fetch all tenant contacts
      if (sessionId) {
        const session = await this.prisma.whatsAppSession.findUnique({
          where: { sessionId },
          select: { tenantId: true }
        })

        if (!session) {
          console.warn(`[WhatsApp Service] Session ${sessionId} not found`)
          return { contacts: [] }
        }

        // Fetch all contacts for this tenant
        whereClause.tenantId = session.tenantId
      }

      const contacts = await this.prisma.whatsAppContact.findMany({
        where: whereClause,
        include: {
          chatbotContact: {
            select: {
              id: true,
              displayName: true,
              phone: true,
              type: true
            }
          },
          whatsapp_sessions: {
            select: {
              sessionId: true,
              phoneNumber: true,
              name: true
            }
          },
          users: { // Added
            select: {
              id: true,
              name: true,
              // Add other fields if needed, e.g. avatar
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      })

      console.log(`[WhatsApp Service] Found ${contacts.length} contacts`)

      return {
        contacts: contacts.map(contact => ({
          id: contact.id,
          jid: contact.jid,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          isGroup: contact.isGroup,
          isBusiness: contact.isBusiness,
          avatarUrl: contact.avatarUrl,
          lastMessageAt: contact.lastMessageAt,
          unreadCount: contact.unreadCount,
          sessionId: contact.sessionId,
          tenantId: contact.tenantId,
          chatbotContact: contact.chatbotContact,
          session: contact.whatsapp_sessions,
          assignee: contact.users ? {
            id: contact.users.id,
            name: contact.users.name,
            color: undefined // or generate color from name
          } : null
        }))
      }
    } catch (error) {
      console.error('[WhatsApp Service] Error fetching contacts:', error)
      return { contacts: [] }
    }
  }

  async linkContact(whatsappContactId: string, targetId: string, targetType: string): Promise<{ success: boolean }> {
    // TODO: Implement actual contact linking
    console.log(`[WhatsApp Service] Link contact: ${whatsappContactId} -> ${targetId} (${targetType})`)
    return { success: true }
  }

  async getAnalytics(sessionId?: string): Promise<{ success: boolean; totalMessages: number }> {
    // TODO: Implement actual analytics
    console.log(`[WhatsApp Service] Get analytics called: sessionId=${sessionId}`)
    return { success: true, totalMessages: 0 }
  }

  async getConfig(): Promise<{ config: any }> {
    // TODO: Implement actual config fetching
    console.log('[WhatsApp Service] Get config called')
    return { config: null }
  }

  async updateConfig(body: any): Promise<{ success: boolean; config: any }> {
    // TODO: Implement actual config update
    console.log('[WhatsApp Service] Update config called', body)
    return { success: true, config: body }
  }

  async patchConfig(sessionId: string, routingRule?: string): Promise<{ success: boolean; config: any; message?: string }> {
    try {
      console.log(`[WhatsApp Service] 🔧 Patching config for session: ${sessionId}`, { routingRule })

      // Validate routing rule if provided
      const validRules = ['FLOWBOT_ONLY', 'USER_ONLY', 'FLOWBOT_FIRST', 'USER_FIRST', 'MANUAL']
      if (routingRule && !validRules.includes(routingRule)) {
        return {
          success: false,
          config: null,
          message: `Invalid routing rule. Must be one of: ${validRules.join(', ')}`
        }
      }

      // Handle global update
      if (sessionId === 'all') {
        const sessions = await this.prisma.whatsAppSession.findMany({
          select: { sessionId: true }
        })

        console.log(`[WhatsApp Service] 🌍 Global update for ${sessions.length} sessions`)

        await this.prisma.$transaction(
          sessions.map(session =>
            this.prisma.whatsAppSessionConfig.upsert({
              where: { sessionId: session.sessionId },
              update: routingRule ? { routingRule: routingRule as any } : {},
              create: {
                id: randomUUID(),
                sessionId: session.sessionId,
                routingRule: (routingRule as any) || 'FLOWBOT_FIRST',
                updatedAt: new Date(),
              }
            })
          )
        )

        return {
          success: true,
          config: { routingRule }
        }
      }

      // Check if session exists
      const session = await this.prisma.whatsAppSession.findUnique({
        where: { sessionId },
        include: { whatsapp_session_configs: true }
      })

      if (!session) {
        return {
          success: false,
          config: null,
          message: 'Session not found'
        }
      }

      // Update or create config
      const config = await this.prisma.whatsAppSessionConfig.upsert({
        where: { sessionId },
        update: routingRule ? { routingRule: routingRule as any } : {},
        create: {
          id: randomUUID(),
          sessionId,
          routingRule: (routingRule as any) || 'FLOWBOT_FIRST',
          updatedAt: new Date(),
        }
      })

      console.log(`[WhatsApp Service] ✅ Config updated for session ${sessionId}:`, {
        routingRule: config.routingRule
      })

      return {
        success: true,
        config: {
          sessionId,
          routingRule: config.routingRule,
          autoReplyEnabled: config.autoReplyEnabled,
        }
      }
    } catch (error) {
      console.error(`[WhatsApp Service] ❌ Error patching config:`, error)
      return {
        success: false,
        config: null,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async syncAccounts(sessionId?: string): Promise<{ success: boolean }> {
    // TODO: Implement actual account sync
    console.log(`[WhatsApp Service] Sync accounts called: sessionId=${sessionId}`)
    return { success: true }
  }

  async delegate(messageId: string, jid: string, action: string): Promise<{ success: boolean }> {
    // TODO: Implement actual delegation logic
    console.log(`[WhatsApp Service] Delegate called: messageId=${messageId}, jid=${jid}, action=${action}`)
    return { success: true }
  }

  /**
   * Migrate orphaned WhatsApp contacts to a new session
   * With the new schema, contacts belong to tenants (not just sessions).
   * This function simply updates the sessionId for all tenant contacts to use the new session.
   */
  private async migrateOrphanedContacts(tenantId: string, newSessionId: string): Promise<void> {
    try {
      console.log(`[WhatsApp Service] 🔄 Migrating data for tenant ${tenantId} to new session ${newSessionId}`)

      // 1. Migrate Contacts
      const orphanedContacts = await this.prisma.whatsAppContact.findMany({
        where: {
          tenantId,
          sessionId: { not: newSessionId }
        },
        select: {
          id: true
        }
      })

      if (orphanedContacts.length > 0) {
        console.log(`[WhatsApp Service] Found ${orphanedContacts.length} contacts to migrate to new session`)
        const result = await this.prisma.whatsAppContact.updateMany({
          where: {
            id: { in: orphanedContacts.map(c => c.id) }
          },
          data: {
            sessionId: newSessionId
          }
        })
        console.log(`[WhatsApp Service] ✅ Migrated ${result.count} contacts to session ${newSessionId}`)
      }

      // 2. Migrate Messages
      // Find old sessions for this tenant
      const oldSessions = await this.prisma.whatsAppSession.findMany({
        where: {
          tenantId,
          sessionId: { not: newSessionId }
        },
        select: { sessionId: true }
      })

      const oldSessionIds = oldSessions.map(s => s.sessionId)

      if (oldSessionIds.length === 0) {
        console.log(`[WhatsApp Service] No old sessions found for message migration`)
        return
      }

      // Check for messages to migrate
      const messagesToMigrateCount = await this.prisma.whatsAppMessage.count({
        where: { sessionId: { in: oldSessionIds } }
      })

      if (messagesToMigrateCount === 0) {
        console.log(`[WhatsApp Service] No messages found in old sessions`)
        return
      }

      console.log(`[WhatsApp Service] Found ${messagesToMigrateCount} messages in old sessions to migrate`)

      // Get existing message IDs in the new session to prevent unique constraint violations
      // (sessionId + messageId must be unique)
      const existingMessages = await this.prisma.whatsAppMessage.findMany({
        where: { sessionId: newSessionId },
        select: { messageId: true }
      })

      const existingMessageIds = new Set(existingMessages.map(m => m.messageId))

      // Fetch all candidate messages from old sessions
      const candidateMessages = await this.prisma.whatsAppMessage.findMany({
        where: { sessionId: { in: oldSessionIds } },
        select: { id: true, messageId: true, timestamp: true },
        orderBy: { timestamp: 'desc' } // Prefer newer messages if duplicates exist? Or doesn't matter much. 
      })

      const idsToMigrate: string[] = []

      // Filter out messages that already exist in the new session
      // AND ensure we don't try to migrate multiple messages with the same messageId (from different old sessions)
      for (const msg of candidateMessages) {
        if (!existingMessageIds.has(msg.messageId)) {
          idsToMigrate.push(msg.id)
          existingMessageIds.add(msg.messageId) // Add to set to prevent duplicates within the candidate list
        }
      }

      if (idsToMigrate.length > 0) {
        console.log(`[WhatsApp Service] Migrating ${idsToMigrate.length} unique messages to ${newSessionId}`)

        // Process in chunks to avoid "too many parameters" error if thousands of messages
        const CHUNK_SIZE = 1000
        let migratedCount = 0

        for (let i = 0; i < idsToMigrate.length; i += CHUNK_SIZE) {
          const chunk = idsToMigrate.slice(i, i + CHUNK_SIZE)
          const result = await this.prisma.whatsAppMessage.updateMany({
            where: { id: { in: chunk } },
            data: { sessionId: newSessionId }
          })
          migratedCount += result.count
        }

        console.log(`[WhatsApp Service] ✅ Successfully migrated ${migratedCount} messages to session ${newSessionId}`)
      } else {
        console.log(`[WhatsApp Service] No unique messages to migrate (all duplicates)`)
      }

      // 3. Mark old sessions as DISCONNECTED/INACTIVE if they aren't already
      // This helps cleanup later
      await this.prisma.whatsAppSession.updateMany({
        where: {
          sessionId: { in: oldSessionIds },
          isActive: true
        },
        data: {
          isActive: false,
          status: 'DISCONNECTED',
          errorMessage: 'Migrated to new session'
        }
      })

    } catch (error) {
      console.error(`[WhatsApp Service] Error migrating data:`, {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        newSessionId
      })
      // Don't throw - migration failure shouldn't break session creation
    }
  }

  /**
   * Mark a WhatsApp contact as read (reset unread count)
   * Called when user views a conversation
   */
  async markContactAsRead(contactId: string, tenantId: string): Promise<void> {
    console.log('[WhatsApp Service] markContactAsRead called:', { contactId, tenantId })

    try {
      // Determine if contactId is a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(contactId)

      const whereConditions: any[] = [
        // Always allow searching by JID (it's a string)
        { jid: contactId }
      ]

      if (isUuid) {
        // Only search UUID fields if input is a UUID to prevent DB errors
        whereConditions.push({ id: contactId })
        whereConditions.push({ chatbotContactId: contactId })
        whereConditions.push({ userId: contactId })
      }

      // 🔧 Use updateMany to safely update without throwing P2025 if record is missing
      const result = await this.prisma.whatsAppContact.updateMany({
        where: {
          OR: whereConditions,
          tenantId
        },
        data: { unreadCount: 0 }
      })

      if (result.count > 0) {
        console.log(`[WhatsApp Service] Marked ${result.count} contact(s) as read for: ${contactId}`)
      } else {
        console.warn(`[WhatsApp Service] No WhatsAppContact found to mark as read for contactId: ${contactId}, tenant: ${tenantId}`)
      }
    } catch (error) {
      console.error('[WhatsApp Service] DETAILED mark-read error:', {
        contactId,
        tenantId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error
      })
      // Don't throw 500 to frontend for minor metadata update failure
    }
  }

  async deleteSession(sessionId: string): Promise<{ success: boolean; message?: string }> {
    try {

      // Check if session exists
      const session = await this.prisma.whatsAppSession.findUnique({
        where: { sessionId }
      })

      if (!session) {
        console.warn(`[WhatsApp Service] Session ${sessionId} not found`)
        return { success: false, message: 'Session not found' }
      }

      // 🔧 CRITICAL: Destroy the socket manager logic moved to Controller/Service
      // await socketManagerRegistry.destroy(sessionId)

      // 🔧 CRITICAL CHANGE: Soft Delete instead of Hard Delete
      // We rename the session ID so it doesn't conflict with new sessions,
      // but keep the record so messages/contacts are preserved.
      // They will be automatically migrated to the new session on reconnect via migrateOrphanedContacts.
      // Prisma Cascade Update ensures messages/contacts move to this new 'deleted' ID automatically.

      const archivedSessionId = `deleted-${Date.now()}-${sessionId}`

      console.log(`[WhatsApp Service] 📦 Archiving session ${sessionId} to ${archivedSessionId}`)

      await this.prisma.whatsAppSession.update({
        where: { sessionId },
        data: {
          sessionId: archivedSessionId,
          status: 'DISCONNECTED',
          isActive: false,
          errorMessage: 'Session deleted by user (archived)',
          updatedAt: new Date()
        }
      })

      console.log(`[WhatsApp Service] ✅ Successfully archived session: ${sessionId}`)
      return { success: true, message: 'Session deleted successfully' }
    } catch (error) {
      console.error(`[WhatsApp Service] Error deleting session ${sessionId}:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete session'
      }
    }
  }

  async broadcastTestQR(sessionId: string): Promise<void> {
    console.warn('[WhatsApp Service] broadcastTestQR is deprecated explicitly.')
  }

  // sendMessage was removed as it is now handled by WhatsAppConnectionService via Controller


  async cleanupOldContacts(oldSessionId: string, currentSessionId: string): Promise<{ success: boolean; deletedCount: number; message: string }> {
    try {
      console.log(`[WhatsApp Service] 🗑️  Cleaning up old contacts...`)
      console.log(`  Old session: ${oldSessionId}`)
      console.log(`  Current session: ${currentSessionId}`)

      // Find contacts with old session ID
      const oldContacts = await this.prisma.whatsAppContact.findMany({
        where: { sessionId: oldSessionId },
        select: {
          id: true,
          jid: true,
          phoneNumber: true,
          name: true,
        }
      })

      console.log(`Found ${oldContacts.length} old contacts to delete:`)
      oldContacts.forEach(c => {
        console.log(`  - ${c.jid} (${c.phoneNumber}) - ${c.name || 'No name'}`)
      })

      if (oldContacts.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: 'No old contacts found to delete'
        }
      }

      // Delete old contacts
      const result = await this.prisma.whatsAppContact.deleteMany({
        where: { sessionId: oldSessionId }
      })

      console.log(`✅ Deleted ${result.count} old WhatsApp contacts`)

      return {
        success: true,
        deletedCount: result.count,
        message: `Successfully deleted ${result.count} old contacts. Please refresh the page.`
      }
    } catch (error) {
      console.error(`[WhatsApp Service] ❌ Error cleaning up old contacts:`, error)
      return {
        success: false,
        deletedCount: 0,
        message: `Error: ${error.message}`
      }
    }
  }

  /**
   * Assign a WhatsApp contact to a user
   */
  async assignContactToUser(contactId: string, userId: string): Promise<void> {
    console.log(`[WhatsApp Service] Assigning contact ${contactId} to user ${userId}`)

    // Determine if contactId is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(contactId)

    const whereConditions: any[] = [
      // Always allow searching by JID
      { jid: contactId }
    ]

    if (isUuid) {
      whereConditions.push({ id: contactId })
      whereConditions.push({ chatbotContactId: contactId })
    }

    // 🔧 Use updateMany for safety against P2025
    const result = await this.prisma.whatsAppContact.updateMany({
      where: {
        OR: whereConditions
      },
      data: { userId }
    })

    if (result.count > 0) {
      console.log(`[WhatsApp Service] ✅ Successfully assigned ${result.count} WhatsApp contact(s) to user ${userId}`)
      return
    }

    // If not found as WhatsAppContact, try to find as ChatbotContact
    const chatbotContact = await this.prisma.chatbotContact.findUnique({
      where: { id: contactId }
    })

    if (chatbotContact) {
      // Find and update WhatsAppContact linked to this ChatbotContact
      const linkedResult = await this.prisma.whatsAppContact.updateMany({
        where: { chatbotContactId: contactId },
        data: { userId }
      })

      if (linkedResult.count > 0) {
        console.log(`[WhatsApp Service] ✅ Assigned ${linkedResult.count} linked WhatsApp contact(s) (via ChatbotContact) to user ${userId}`)
        return
      }
    }

    throw new Error(`Contact with ID ${contactId} not found`)
  }
}
