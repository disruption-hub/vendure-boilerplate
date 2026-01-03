import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import type { ChatAuthProfile, ChatOtpRequest, ChatOtpResponse, ChatOtpVerifyRequest, ChatOtpVerifyResponse } from '@ipnuo/domain'
import { AuthService } from '../auth.service'
import { ChatOtpService } from '../services/chat-otp.service'
import { ChatAuthError } from '@ipnuo/shared-chat-auth'
import { AdminTenantsService } from '../../admin/tenants.service'

@Controller('auth/phone')
export class ChatAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly chatOtpService: ChatOtpService,
    private readonly adminTenantsService: AdminTenantsService,
  ) { }

  @Post('request')
  async requestOtp(@Body() payload: ChatOtpRequest): Promise<ChatOtpResponse> {
    return this.authService.chatRequestOtp(payload)
  }

  @Post('verify')
  async verify(@Body() payload: ChatOtpVerifyRequest): Promise<ChatOtpVerifyResponse> {
    return this.authService.chatVerifyOtp(payload)
  }

  @Post('sync')
  async syncSession(@Body() payload: ChatOtpRequest & { sessionToken?: string | null }) {
    if (!payload.phone) {
      throw new BadRequestException({ error: 'Phone number is required' })
    }

    return this.chatOtpService.syncSession(payload)
  }

  @Post('session')
  async loadSession(@Body() payload: { token: string; extend?: boolean }) {
    try {
      return await this.chatOtpService.loadSession(payload.token, payload.extend !== false)
    } catch (error) {
      if (error instanceof ChatAuthError) {
        const statusMap: Record<string, number> = {
          SESSION_INVALID: HttpStatus.UNAUTHORIZED,
          ACCESS_DENIED: HttpStatus.FORBIDDEN,
        }
        const status = statusMap[error.code] ?? HttpStatus.BAD_REQUEST
        throw new HttpException({ error: error.message, code: error.code }, status)
      }
      throw error
    }
  }

  @Delete('session')
  async revokeSession(@Body() payload: { token: string }) {
    try {
      await this.chatOtpService.revokeSession(payload.token)
      return { success: true }
    } catch (error) {
      if (error instanceof ChatAuthError) {
        const status = error.code === 'SESSION_INVALID' ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST
        throw new HttpException({ error: error.message, code: error.code }, status)
      }
      throw error
    }
  }

  @Get('profile')
  async getProfile(@Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const resolvedToken = this.resolveToken(token, authHeader)
    if (!resolvedToken) {
      throw new BadRequestException({ error: 'Session token is required' })
    }

    try {
      await this.chatOtpService.loadSession(resolvedToken, false)
      const profile = await this.chatOtpService.fetchProfile(resolvedToken)

      return {
        success: true,
        profile: profile
          ? {
            ...profile,
            displayName: profile.displayName ?? null,
            email: profile.email ?? null,
            tenantId: profile.tenantId ?? null,
            countryCode: profile.countryCode ?? null,
          }
          : null,
      }
    } catch (error) {
      if (error instanceof ChatAuthError) {
        const status = error.code === 'SESSION_INVALID' ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST
        throw new HttpException({ error: error.message, code: error.code }, status)
      }
      throw error
    }
  }

  @Get('contacts')
  async getContacts(
    @Query('token') token?: string,
    @Query('tenantId') queryTenantId?: string,
    @Headers('authorization') authHeader?: string
  ) {
    const resolvedToken = this.resolveToken(token, authHeader)
    if (!resolvedToken) {
      throw new BadRequestException({ error: 'Session token is required' })
    }

    try {
      // Validate session and get user info
      const sessionData = await this.chatOtpService.loadSession(resolvedToken, false)
      // Use tenantId from query parameter as fallback if session doesn't have it
      const tenantId = sessionData.user?.tenantId || queryTenantId

      if (!tenantId) {
        console.error('[ChatAuthController] getContacts: No tenantId found', {
          hasSessionTenantId: !!sessionData.user?.tenantId,
          hasQueryTenantId: !!queryTenantId,
          userId: sessionData.user?.id,
        })
        throw new BadRequestException({ error: 'User does not have a tenantId and none provided in query' })
      }

      console.log('[ChatAuthController] getContacts: Fetching contacts', {
        tenantId,
        fromSession: !!sessionData.user?.tenantId,
        fromQuery: !!queryTenantId,
        userId: sessionData.user?.linkedUserId,
      })

      // Get contacts for the tenant using the admin service
      const result = await this.adminTenantsService.getTenantContacts(tenantId, sessionData.user?.linkedUserId)
      
      console.log('[ChatAuthController] getContacts: Contacts fetched', {
        tenantId,
        success: result.success,
        contactsCount: result.contacts?.length || 0,
        tenantUsersCount: result.contacts?.filter((c: any) => c.type === 'TENANT_USER').length || 0,
      })
      
      return result
    } catch (error) {
      console.error('[ChatAuthController] getContacts: Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      if (error instanceof ChatAuthError) {
        const status = error.code === 'SESSION_INVALID' ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST
        throw new HttpException({ error: error.message, code: error.code }, status)
      }
      throw error
    }
  }

  @Put('profile')
  async updateProfile(
    @Body() payload: { token: string; displayName: string; email: string },
  ): Promise<{ success: true; profile: ChatAuthProfile }> {
    try {
      const profile = await this.chatOtpService.updateProfile(payload.token, {
        displayName: payload.displayName,
        email: payload.email,
      })

      return {
        success: true,
        profile,
      }
    } catch (error) {
      if (error instanceof ChatAuthError) {
        const statusMap: Record<string, number> = {
          PROFILE_INVALID: HttpStatus.UNPROCESSABLE_ENTITY,
          SESSION_INVALID: HttpStatus.UNAUTHORIZED,
          NOT_FOUND: HttpStatus.NOT_FOUND,
        }
        const status = statusMap[error.code] ?? HttpStatus.BAD_REQUEST
        throw new HttpException({ error: error.message, code: error.code }, status)
      }
      throw error
    }
  }

  @Get('messages')
  async getMessages(
    @Query('peerId') peerId?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = this.resolveToken(undefined, authHeader)
    if (!token) {
      throw new BadRequestException({ error: 'Authorization required' })
    }

    if (!peerId) {
      throw new BadRequestException({ error: 'peerId is required' })
    }

    try {
      const sessionData = await this.chatOtpService.loadSession(token, false)
      const linkedUserId = sessionData.user?.linkedUserId

      if (!linkedUserId) {
        throw new BadRequestException({ error: 'User linkedUserId not found' })
      }

      const messages = await this.chatOtpService.getUserMessages(linkedUserId, peerId)

      return {
        success: true,
        messages,
      }
    } catch (error) {
      if (error instanceof ChatAuthError) {
        const status = error.code === 'SESSION_INVALID' ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST
        throw new HttpException({ error: error.message, code: error.code }, status)
      }
      throw error
    }
  }

  @Post('messages')
  async sendMessage(
    @Body() payload: { recipientId: string; content: string; attachments?: any[] },
    @Headers('authorization') authHeader?: string,
  ) {
    const token = this.resolveToken(undefined, authHeader)
    if (!token) {
      throw new BadRequestException({ error: 'Authorization required' })
    }

    if (!payload.recipientId || !payload.content) {
      throw new BadRequestException({ error: 'recipientId and content are required' })
    }

    try {
      const sessionData = await this.chatOtpService.loadSession(token, false)
      const linkedUserId = sessionData.user?.linkedUserId

      if (!linkedUserId) {
        throw new BadRequestException({ error: 'User linkedUserId not found' })
      }

      const message = await this.chatOtpService.sendUserMessage(
        linkedUserId,
        payload.recipientId,
        payload.content,
        payload.attachments || []
      )

      return {
        success: true,
        message,
      }
    } catch (error) {
      if (error instanceof ChatAuthError) {
        const status = error.code === 'SESSION_INVALID' ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST
        throw new HttpException({ error: error.message, code: error.code }, status)
      }
      throw error
    }
  }

  @Post('messages/read')
  async markMessagesAsRead(
    @Body() payload: { peerId: string; messageIds: string[] },
    @Headers('authorization') authHeader?: string,
  ) {
    const token = this.resolveToken(undefined, authHeader)
    if (!token) {
      throw new BadRequestException({ error: 'Authorization required' })
    }

    if (!payload.peerId || !payload.messageIds || !Array.isArray(payload.messageIds)) {
      throw new BadRequestException({ error: 'peerId and messageIds are required' })
    }

    try {
      const sessionData = await this.chatOtpService.loadSession(token, false)
      const linkedUserId = sessionData.user?.linkedUserId

      if (!linkedUserId) {
        throw new BadRequestException({ error: 'User linkedUserId not found' })
      }

      const count = await this.chatOtpService.markMessagesAsRead(linkedUserId, payload.messageIds)

      return {
        success: true,
        count,
      }
    } catch (error) {
      if (error instanceof ChatAuthError) {
        const status = error.code === 'SESSION_INVALID' ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST
        throw new HttpException({ error: error.message, code: error.code }, status)
      }
      throw error
    }
  }

  private resolveToken(queryToken?: string, authHeader?: string): string {
    if (queryToken) {
      return queryToken
    }

    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7)
    }

    return ''
  }
}
