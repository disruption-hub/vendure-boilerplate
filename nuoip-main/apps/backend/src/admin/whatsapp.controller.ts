import { Body, Controller, Delete, Get, Patch, Post, Query, Param, UseGuards, BadRequestException, Req, Logger, Inject, forwardRef } from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import { HybridAdminGuard } from '../common/guards/hybrid-auth.guard'
import { AdminWhatsAppService } from './whatsapp.service'
import { WhatsAppConnectionService } from '../modules/whatsapp/services/whatsapp.connection.service'
import { MarkContactAsReadDto } from './dto/mark-contact-read.dto'


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

@Controller('admin/whatsapp')
export class AdminWhatsAppController {
  private readonly logger = new Logger(AdminWhatsAppController.name)

  constructor(
    private readonly whatsAppService: AdminWhatsAppService,
    @Inject(forwardRef(() => WhatsAppConnectionService))
    private readonly connectionService: WhatsAppConnectionService,
  ) { }

  @Get('sessions')
  @UseGuards(HybridAdminGuard)  // Allow both JWT and chat session tokens
  async getSessions(): Promise<{ sessions: WhatsAppSession[]; summary: any }> {
    return this.whatsAppService.getSessions()
  }

  @Post('connect')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async connect(@Body() body: { sessionId: string; name?: string }, @Req() req): Promise<{ success: boolean; message?: string }> {
    // Get tenant ID from authenticated user (JWT payload)
    const tenantId = req.user?.tenantId

    if (!tenantId) {
      throw new BadRequestException('Tenant ID not found in user context')
    }

    // Use new connection service
    this.connectionService.connect(body.sessionId, tenantId)

    // Return immediately - connection is async
    return { success: true, message: 'Connection initiated' }
  }


  @Post('disconnect')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async disconnect(@Body() body: { sessionId: string }): Promise<{ success: boolean; message?: string }> {
    // Use new connection service, but also call legacy cleanup if needed
    try {
      const socket = this.connectionService.getSocket(body.sessionId)
      if (socket) {
        socket.end(undefined)
      }
    } catch (e) {
      console.error('Error closing socket via connection service', e)
    }

    // Fallback to legacy for DB cleanup if new service doesn't handle it fully yet (it handles status updates)
    return this.whatsAppService.disconnect(body.sessionId)
  }

  @Get('status')
  @UseGuards(HybridAdminGuard)  // Allow both JWT and chat session tokens
  async getStatus(@Query('sessionId') sessionId: string): Promise<{ status: string; qr?: string; qrCode?: string; socketStatus?: string }> {
    // Try new service first (eventually status should come from DB/Redis set by ConnectionService)
    // For now, rely on what's in DB (which ConnectionService updates)
    const result = await this.whatsAppService.getStatus(sessionId)

    // Get real-time socket status - derive from DB status rather than just socket existence
    // Socket existence doesn't mean WhatsApp is connected (could be CONNECTING or QR_REQUIRED)
    const socket = this.connectionService.getSocket(sessionId)

    // Map DB status to socket status for frontend
    // Map DB status to socket status for frontend
    // In Standalone Worker architecture, we don't have local sockets, so we rely on DB status
    const dbStatus = result.status?.toUpperCase() || 'DISCONNECTED'

    let realtimeStatus: string
    if (dbStatus === 'CONNECTED') {
      realtimeStatus = 'connected'
    } else if (dbStatus === 'QR_REQUIRED') {
      realtimeStatus = 'qr_required'
    } else if (dbStatus === 'CONNECTING') {
      realtimeStatus = 'connecting'
    } else {
      realtimeStatus = 'disconnected'
    }

    // Get QR from in-memory store as fallback (when Soketi events are missed)
    const qrFromMemory = this.connectionService.getQrCode(sessionId)
    // If no in-memory QR (e.g. because connection is delegated to worker), use what's in DB metadata
    const qr = qrFromMemory || result.qr

    // Ensure both qr and qrCode are set for compatibility
    return {
      status: result.status,
      qr: qr,
      qrCode: qr, // Some frontend code might use qrCode instead of qr
      socketStatus: realtimeStatus,
    }
  }

  @Get('messages')
  @UseGuards(HybridAdminGuard)  // Allow both JWT and chat session tokens
  async getMessages(
    @Query('sessionId') sessionId?: string,
    @Query('contactId') contactId?: string,
    @Query('jid') jid?: string,  // Support jid as alternative to contactId
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; messages: any[] }> {
    const messages = await this.whatsAppService.getMessages(
      sessionId,
      status,
      limit ? parseInt(limit, 10) : undefined,
      contactId || jid  // Use contactId if provided, otherwise fall back to jid
    )
    return { success: true, ...messages }
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getContacts(@Query('sessionId') sessionId?: string): Promise<{ contacts: any[] }> {
    return this.whatsAppService.getContacts(sessionId)
  }

  @Post('contacts/link')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async linkContact(@Body() body: { whatsappContactId: string; targetId: string; targetType: string }): Promise<{ success: boolean }> {
    return this.whatsAppService.linkContact(body.whatsappContactId, body.targetId, body.targetType)
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAnalytics(@Query('sessionId') sessionId?: string): Promise<{ success: boolean; totalMessages: number }> {
    return this.whatsAppService.getAnalytics(sessionId)
  }

  @Get('config')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getConfig(): Promise<{ config: any }> {
    return this.whatsAppService.getConfig()
  }

  @Post('config')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateConfig(@Body() body: any): Promise<{ success: boolean; config: any }> {
    return this.whatsAppService.updateConfig(body)
  }

  @Patch('config')
  @UseGuards(HybridAdminGuard)  // Allow both JWT and chat session tokens
  async patchConfig(@Body() body: { sessionId: string; routingRule?: string; tenantId?: string }): Promise<{ success: boolean; config: any }> {
    return this.whatsAppService.patchConfig(body.sessionId, body.routingRule)
  }

  @Post('accounts/sync')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async syncAccounts(@Body() body: { sessionId?: string }): Promise<{ success: boolean }> {
    return this.whatsAppService.syncAccounts(body.sessionId)
  }

  @Post('delegate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delegate(@Body() body: { messageId: string; jid: string; action: string }): Promise<{ success: boolean }> {
    return this.whatsAppService.delegate(body.messageId, body.jid, body.action)
  }

  @Post('contacts/mark-read')
  @UseGuards(HybridAdminGuard)
  async markContactAsRead(
    @Body() body: MarkContactAsReadDto,
    @Req() req: any
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[WhatsApp Controller] markContactAsRead called')
    try {
      console.log('[WhatsApp Controller] markContactAsRead request user:', {
        user: req.user ? { id: req.user.id, tenantId: req.user.tenantId, role: req.user.role } : null,
        chatAuth: req.chatAuth ? { tenantId: req.chatAuth.tenantId } : null,
        body: body
      })
      const tenantId = req.user?.tenantId || req.chatAuth?.tenantId

      if (!tenantId) {
        console.warn('[WhatsApp Controller] Mark read failed: Tenant ID not found in request')
        // Return error response instead of throwing to prevent 500
        return { success: false, error: 'Tenant ID not found' }
      }

      if (!body.contactId) {
        console.warn('[WhatsApp Controller] Mark read failed: Contact ID not provided')
        return { success: false, error: 'Contact ID is required' }
      }

      console.log('[WhatsApp Controller] Calling markContactAsRead service:', { contactId: body.contactId, tenantId })
      await this.whatsAppService.markContactAsRead(body.contactId, tenantId)
      console.log('[WhatsApp Controller] markContactAsRead completed successfully')
      return { success: true }
    } catch (error) {
      console.error('[WhatsApp Controller] Error marking contact as read:', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        contactId: body?.contactId,
        hasUser: !!req.user
      })
      // Return success:false but don't throw 500 to prevent frontend disruption
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteSession(@Query('sessionId') sessionId: string): Promise<{ success: boolean; message?: string }> {
    console.log(`🗑️ [WhatsApp Controller] Delete request received for sessionId: ${sessionId}`)

    if (!sessionId) {
      console.log(`❌ [WhatsApp Controller] Delete failed: No sessionId provided`)
      throw new BadRequestException('Session ID is required')
    }

    // Disconnect the session - this cancels reconnect timers and closes the socket
    // This is critical to prevent the session from being recreated after deletion
    console.log(`🔌 [WhatsApp Controller] Disconnecting session ${sessionId}`)
    this.connectionService.disconnect(sessionId)

    console.log(`📤 [WhatsApp Controller] Calling whatsAppService.deleteSession for ${sessionId}`)
    const result = await this.whatsAppService.deleteSession(sessionId)
    console.log(`✅ [WhatsApp Controller] Delete result for ${sessionId}:`, result)
    return result
  }

  @Post('test-qr')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async testQR(@Body() body: { sessionId: string }): Promise<{ success: boolean; message: string }> {
    // Test endpoint to broadcast a test QR code via WebSocket
    // This helps verify WebSocket subscription is working
    // TODO: Remove this once Baileys worker is implemented
    try {
      await this.whatsAppService.broadcastTestQR(body.sessionId)
      return { success: true, message: 'Test QR code broadcasted' }
    } catch (error) {
      console.error('[WhatsApp Controller] Error broadcasting test QR:', error)
      return { success: false, message: 'Failed to broadcast test QR code' }
    }
  }
  @Post('messages/send')
  @UseGuards(HybridAdminGuard)  // Override controller guards to accept both JWT and session tokens
  async sendMessage(@Body() body: { sessionId: string; toJid: string; content: string; senderName?: string }, @Req() req: any) {
    if (!body.sessionId || !body.toJid || !body.content) {
      throw new BadRequestException('Missing required fields: sessionId, toJid, content')
    }

    try {
      // The sessionId might actually be a tenantId if sent from frontend
      // Try to resolve to an actual WhatsApp session
      let actualSessionId = body.sessionId

      // Check if it's a valid WhatsApp session
      const session = await this.whatsAppService['prisma'].whatsAppSession.findUnique({
        where: { sessionId: body.sessionId },
        select: { sessionId: true, status: true }
      }).catch(() => null)

      // If not found, try to find an active session for this tenant
      if (!session) {
        const tenantId = req.user?.tenantId || req.chatAuth?.tenantId || body.sessionId

        const activeSessions = await this.whatsAppService['prisma'].whatsAppSession.findMany({
          where: {
            tenantId,
            status: 'CONNECTED',
            // Note: Don't require isActive=true as some connected sessions may not have this flag set
          },
          orderBy: { lastConnected: 'desc' },
          take: 1,
          select: { sessionId: true }
        })

        if (activeSessions.length > 0) {
          actualSessionId = activeSessions[0].sessionId
          this.logger.log(`Resolved tenantId ${tenantId} to sessionId ${actualSessionId}`)
        } else {
          return {
            success: false,
            error: 'No active WhatsApp session found for this account'
          }
        }
      }

      // Use connection service for sending (which delegates to message service)
      return await this.connectionService.sendMessage(actualSessionId, body.toJid, body.content, body.senderName)
    } catch (error) {
      console.error('[WhatsApp Controller] Error sending message via ConnectionService:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending message',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      }
    }
  }

  @Post('cleanup/old-contacts')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async cleanupOldContacts(
    @Body() body: { oldSessionId: string; currentSessionId: string }
  ): Promise<{ success: boolean; deletedCount: number; message: string }> {
    return this.whatsAppService.cleanupOldContacts(body.oldSessionId, body.currentSessionId)
  }

  @Post('contacts/:contactId/assign')
  @UseGuards(HybridAdminGuard)
  async assignContact(
    @Param('contactId') contactId: string,
    @Body() body: { userId: string }
  ): Promise<{ success: boolean; message?: string }> {
    if (!contactId) {
      throw new BadRequestException('contactId is required')
    }
    if (!body.userId) {
      throw new BadRequestException('userId is required')
    }

    this.logger.log(`Assigning contact ${contactId} to user ${body.userId}`)

    try {
      // Update the contact's assigned user
      await this.whatsAppService.assignContactToUser(contactId, body.userId)

      return {
        success: true,
        message: `Contact ${contactId} assigned to user ${body.userId}`
      }
    } catch (error) {
      this.logger.error(`Error assigning contact: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }
}




