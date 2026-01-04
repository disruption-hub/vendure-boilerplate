import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import {
  ChatAuthError,
  type ChatAuthErrorCode,
  calculateExpiry,
  calculateSessionExpiry,
  ensureVerificationId,
  generateOtpCode,
  generatePublicVerificationId,
  generateSessionToken,
  mapProfile,
  mapUser,
  normalizePhoneNumber,
  resolveLanguage,
} from '@ipnuo/shared-chat-auth'
import type {
  ChatAuthProfile,
  ChatAuthProfileInput,
  ChatAuthSession,
  ChatAuthUser,
  ChatOtpRequest,
  ChatOtpResponse,
  ChatOtpVerifyRequest,
  ChatOtpVerifyResponse,
} from '@ipnuo/domain'
import { PrismaService } from '../../prisma/prisma.service'
import { createLogger } from '@/lib/utils/logger'
import {
  getLabsMobileConfig,
  type LabsMobileConfig,
} from '@/lib/services/admin'
import {
  sendLabsMobileSms,
  buildOtpMessage,
  LabsMobileServiceError,
} from '@/lib/services/sms/labsmobile-service'
import { CommunicationService } from '@/lib/communication'

const logger = createLogger('nest-chat-otp-service')

const OTP_EXPIRATION_MINUTES = 5
const OTP_RESEND_MIN_INTERVAL_SECONDS = 60
const OTP_MAX_ATTEMPTS = 5
const OTP_HASH_ROUNDS = 10
const SESSION_TTL_DAYS = 180
const SESSION_MAX_ACTIVE = 5
const DEFAULT_TENANT_ID = 'default'

function generateId(): string {
  // Generate a unique ID similar to cuid format (c + timestamp + random)
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${random}`;
}

type ExternalChannel = 'WHATSAPP' | 'TELEGRAM' | 'INSTAGRAM'

interface SyncPhoneSessionInput extends ChatOtpRequest {
  sessionToken?: string | null
}

interface SyncPhoneSessionResult {
  success: boolean
  requiresOtp?: boolean
  reason?: 'user_not_found' | 'access_denied' | 'no_active_session' | 'session_verification_required'
  message?: string
  session?: ChatAuthSession
  user?: ChatAuthUser
}

@Injectable()
export class ChatOtpService {
  constructor(private readonly prisma: PrismaService) {
    console.log('[ChatOtpService] Constructor: this.prisma is', this.prisma ? 'defined' : 'undefined')
  }

  async requestOtp(payload: ChatOtpRequest): Promise<ChatOtpResponse> {
    try {
      logger.info('[ChatOtpService] requestOtp called', { phone: payload.phone, tenantId: payload.tenantId, host: payload.host })

      if (!this.prisma) {
        console.error('[ChatOtpService] requestOtp: this.prisma is undefined')
        throw new ChatAuthError('Database service is not available', 'DATABASE_NOT_READY')
      }

      // Wait for PrismaService to be fully initialized (models available)
      let retries = 0
      while (!this.prisma.isReady && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }

      if (!this.prisma.isReady) {
        throw new ChatAuthError('Database is not ready', 'DATABASE_NOT_READY')
      }

      const normalized = normalizePhoneNumber(payload.phone, payload.countryCode ?? undefined)
      logger.info('[ChatOtpService] Phone normalized', { normalized: normalized.normalized, countryCode: normalized.countryCode })

      const tenantId = await this.resolveTenantId(payload.tenantId ?? payload.host)
      logger.info('[ChatOtpService] Tenant resolved', { tenantId })

      const user = await this.prisma.chatbotPhoneUser.upsert({
        where: {
          normalizedPhone_tenantId: {
            normalizedPhone: normalized.normalized,
            tenantId,
          },
        },
        update: {
          phone: normalized.raw,
          normalizedPhone: normalized.normalized,
          countryCode: normalized.countryCode,
          lastActiveAt: new Date(),
          tenantId,
        },
        create: {
          id: generateId(),
          phone: normalized.raw,
          normalizedPhone: normalized.normalized,
          countryCode: normalized.countryCode,
          tenantId,
          updatedAt: new Date(),
        },
      })
      logger.info('[ChatOtpService] Phone user upserted', { userId: user.id })

      await this.ensureChatbotAccessApproved({
        id: user.id,
        email: user.email ?? null,
        tenantId: user.tenantId ?? tenantId,
        normalizedPhone: user.normalizedPhone ?? normalized.normalized,
        phone: user.phone ?? normalized.raw,
      })

      await this.enforceOtpRateLimit(user.id)

      const code = generateOtpCode()
      const codeHash = await bcrypt.hash(code, OTP_HASH_ROUNDS)
      const expiresAt = calculateExpiry(OTP_EXPIRATION_MINUTES)
      const publicId = generatePublicVerificationId()

      if (!this.prisma || !this.prisma.isReady) {
        console.warn('[ChatOtpService] requestOtp: Prisma not ready')
        throw new ChatAuthError('Database is not ready', 'DATABASE_NOT_READY')
      }

      const otpRecord = await this.prisma.chatbotPhoneOtp.create({
        data: {
          id: generateId(),
          publicId,
          userId: user.id,
          codeHash,
          expiresAt,
          updatedAt: new Date(),
        },
      })

      const otpMessage = buildOtpMessage(code, resolveLanguage(payload.language))

      // For OTP, prefer SMS unless explicitly requested otherwise
      // The communication hub WhatsApp/Telegram/Instagram are stubs and don't actually send
      const shouldUseHub = payload.preferredChannel && payload.preferredChannel !== 'SMS'

      let deliveredViaHub = false
      if (shouldUseHub) {
        try {
          const hubChannel = await this.dispatchOtpViaCommunicationHub({
            tenantId,
            normalizedPhone: normalized.normalized,
            message: otpMessage,
            preferredChannel: payload.preferredChannel,
            whatsappNumber: payload.whatsappNumber ?? normalized.normalized,
            telegramChatId: payload.telegramChatId ?? null,
            instagramUserId: payload.instagramUserId ?? null,
          })
          deliveredViaHub = hubChannel !== null
          logger.info('OTP dispatch via communication hub', {
            channel: hubChannel,
            deliveredViaHub,
            note: 'Communication hub channels are currently stubs - SMS fallback will be used'
          })
        } catch (error) {
          logger.warn('Communication hub OTP dispatch failed', {
            tenantId,
            error: error instanceof Error ? error.message : 'unknown-error',
          })
        }
      }

      // Always use SMS for OTP delivery (communication hub is not fully implemented)
      // This ensures OTP codes are actually delivered
      if (!deliveredViaHub || !shouldUseHub) {
        let labsMobileConfig: LabsMobileConfig
        try {
          // First try to get config from database, then fall back to environment variables
          const dbConfig = await this.getLabsMobileConfigFromDb()
          const envConfig = await getLabsMobileConfig()
          const config = dbConfig || envConfig
          labsMobileConfig = this.ensureLabsMobileConfig(config)
        } catch (error) {
          // Delete OTP record using raw SQL if model not available
          if (this.prisma.chatbotPhoneOtp) {
            await this.prisma.chatbotPhoneOtp.delete({ where: { id: otpRecord.id } })
          } else {
            await this.prisma.$queryRaw`DELETE FROM chatbot_phone_otps WHERE id = ${otpRecord.id}`
          }
          throw error
        }

        try {
          logger.info('[ChatOtpService] Attempting to send SMS via LabsMobile', {
            normalizedPhone: normalized.normalized,
            hasConfig: !!labsMobileConfig,
            hasUsername: !!labsMobileConfig.username,
            hasToken: !!labsMobileConfig.token,
            senderId: labsMobileConfig.senderId,
          })

          await sendLabsMobileSms(labsMobileConfig, {
            to: normalized.normalized,
            message: otpMessage,
            senderId: labsMobileConfig.senderId,
          })

          logger.info('[ChatOtpService] SMS sent successfully via LabsMobile', {
            normalizedPhone: normalized.normalized,
          })
        } catch (error) {
          logger.error('[ChatOtpService] Failed to dispatch OTP message via SMS', {
            error: error instanceof Error ? error.message : 'unknown-error',
            errorStack: error instanceof Error ? error.stack : undefined,
            normalizedPhone: normalized.normalized,
            errorDetails: error instanceof LabsMobileServiceError ? {
              status: error.status,
              details: error.details,
            } : undefined,
          })

          await this.prisma.chatbotPhoneOtp.delete({ where: { id: otpRecord.id } })

          if (error instanceof LabsMobileServiceError) {
            let mappedMessage = error.message
            if (error.details && typeof error.details === 'object') {
              const details = error.details as { message?: unknown }
              if (typeof details.message === 'string') {
                mappedMessage = details.message
              }
            }

            const code: ChatAuthErrorCode = error.status === 401 ? 'CONFIG_NOT_FOUND' : 'SMS_DELIVERY_FAILED'

            throw new ChatAuthError(mappedMessage, code)
          }

          throw error
        }
      }

      return {
        success: true,
        verificationId: otpRecord.publicId,
        expiresAt: expiresAt.toISOString(),
        normalizedPhone: normalized.normalized,
        countryCode: normalized.countryCode ?? null,
      }
    } catch (error) {
      logger.error('[ChatOtpService] Error in requestOtp', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        payload: { phone: payload.phone, tenantId: payload.tenantId, host: payload.host },
      })
      throw error
    }
  }

  async verifyOtp(payload: ChatOtpVerifyRequest): Promise<ChatOtpVerifyResponse> {
    const verificationId = ensureVerificationId(payload.verificationId)
    const code = payload.code?.trim()

    if (!code) {
      throw new ChatAuthError('Verification code is required', 'INVALID_CODE')
    }

    const otp = await this.prisma.chatbotPhoneOtp.findUnique({
      where: { publicId: verificationId },
      include: { chatbotPhoneUser: true },
    })

    if (!otp) {
      throw new ChatAuthError('Verification request not found', 'NOT_FOUND')
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      throw new ChatAuthError('The verification code has expired', 'EXPIRED')
    }

    if (otp.attemptCount >= OTP_MAX_ATTEMPTS) {
      throw new ChatAuthError('Too many invalid attempts', 'INVALID_CODE')
    }

    const linkedUser = await this.ensureChatbotAccessApproved({
      id: otp.chatbotPhoneUser.id,
      email: otp.chatbotPhoneUser.email ?? null,
      tenantId: otp.chatbotPhoneUser.tenantId ?? null,
      normalizedPhone: otp.chatbotPhoneUser.normalizedPhone ?? null,
      phone: otp.chatbotPhoneUser.phone ?? null,
    })

    const isValid = await bcrypt.compare(code, otp.codeHash)
    if (!isValid) {
      await this.prisma.chatbotPhoneOtp.update({
        where: { id: otp.id },
        data: { attemptCount: { increment: 1 } },
      })

      throw new ChatAuthError('Invalid verification code', 'INVALID_CODE')
    }

    const session = await this.prisma.$transaction(async tx => {
      await tx.chatbotPhoneOtp.delete({ where: { id: otp.id } })
      return this.createSession(tx, otp.chatbotPhoneUser.id, null)
    })

    const userRecord = await this.prisma.chatbotPhoneUser.update({
      where: { id: otp.chatbotPhoneUser.id },
      data: { lastActiveAt: new Date() },
    })

    return {
      success: true,
      session,
      user: mapUser(userRecord, linkedUser),
    }
  }

  async syncSession(payload: SyncPhoneSessionInput): Promise<SyncPhoneSessionResult> {
    if (!this.prisma) {
      console.error('[ChatOtpService] syncSession: this.prisma is undefined')
      throw new ChatAuthError('Database service is not available', 'DATABASE_NOT_READY')
    }

    // Wait for PrismaService to be fully initialized (models available)
    let retries = 0
    while (!this.prisma.isReady && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      retries++
    }

    if (!this.prisma.isReady) {
      throw new ChatAuthError('Database is not ready', 'DATABASE_NOT_READY')
    }

    const normalized = normalizePhoneNumber(payload.phone, payload.countryCode ?? undefined)
    const tenantId = await this.resolveTenantId(payload.tenantId ?? payload.host)

    const phoneUser = await this.prisma.chatbotPhoneUser.findUnique({
      where: {
        normalizedPhone_tenantId: {
          normalizedPhone: normalized.normalized,
          tenantId,
        },
      },
      include: {
        chatbot_phone_sessions: {
          where: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { lastUsedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!phoneUser) {
      return {
        success: false,
        reason: 'user_not_found',
        message: 'User not found. Please register first.',
      }
    }

    let linkedUser
    try {
      linkedUser = await this.ensureChatbotAccessApproved({
        id: phoneUser.id,
        email: phoneUser.email ?? null,
        tenantId: phoneUser.tenantId ?? tenantId,
        normalizedPhone: phoneUser.normalizedPhone ?? normalized.normalized,
        phone: phoneUser.phone ?? normalized.raw,
      })
    } catch (error) {
      if (error instanceof ChatAuthError) {
        const sessionIds = phoneUser.chatbot_phone_sessions?.map(session => session.id) ?? []
        if (sessionIds.length) {
          void this.prisma.chatbotPhoneSession
            .updateMany({
              where: { id: { in: sessionIds } },
              data: { revokedAt: new Date() },
            })
            .catch(updateError => {
              logger.warn('Failed to revoke sessions after access denial', {
                error: updateError instanceof Error ? updateError.message : 'unknown-error',
              })
            })
        }

        return {
          success: false,
          reason: 'access_denied',
          message: error.message,
          requiresOtp: false,
        }
      }

      throw error
    }

    const refreshedPhoneUser = await this.prisma.chatbotPhoneUser.findUnique({ where: { id: phoneUser.id } })
    const userRecord = refreshedPhoneUser ?? phoneUser
    const activeSession = phoneUser.chatbot_phone_sessions?.[0] ?? null

    let validatedSession: ChatOtpVerifyResponse | null = null

    if (payload.sessionToken) {
      try {
        const result = await this.validateSessionToken(payload.sessionToken, true)
        if (result.user.id === phoneUser.id) {
          validatedSession = result
        } else {
          logger.warn('Session token user mismatch during phone sync', {
            requestedPhoneUserId: phoneUser.id,
            tokenUserId: result.user.id,
          })
        }
      } catch (error) {
        logger.warn('Session token validation failed during phone sync', {
          error: error instanceof Error ? error.message : 'unknown-error',
        })
      }
    }

    if (validatedSession) {
      try {
        await this.prisma.chatbotPhoneUser.update({
          where: { id: phoneUser.id },
          data: { lastActiveAt: new Date() },
        })
      } catch (updateError) {
        logger.warn('Failed to update lastActiveAt during session sync', {
          error: updateError instanceof Error ? updateError.message : 'unknown-error',
        })
      }

      return {
        success: true,
        session: validatedSession.session,
        user: validatedSession.user,
        message: 'Existing session restored',
      }
    }

    if (activeSession) {
      return {
        success: false,
        reason: 'session_verification_required',
        message: 'Please verify your phone number to continue',
        requiresOtp: true,
      }
    }

    return {
      success: false,
      reason: 'no_active_session',
      message: 'Please verify your phone number to continue',
      requiresOtp: true,
    }
  }

  async loadSession(sessionToken: string, extend: boolean): Promise<ChatOtpVerifyResponse> {
    const result = await this.validateSessionToken(sessionToken, extend)
    return result
  }

  async revokeSession(sessionToken: string): Promise<void> {
    if (!sessionToken || typeof sessionToken !== 'string') {
      throw new ChatAuthError('Session token is required', 'SESSION_INVALID')
    }

    if (!this.prisma) {
      console.error('[ChatOtpService] revokeSession: this.prisma is undefined')
      throw new ChatAuthError('Database service is not available', 'DATABASE_NOT_READY')
    }

    // Wait for PrismaService to be fully initialized (models available)
    let retries = 0
    while (!this.prisma.isReady && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      retries++
    }

    if (!this.prisma.isReady) {
      throw new ChatAuthError('Database is not ready', 'DATABASE_NOT_READY')
    }

    const session = await this.prisma.chatbotPhoneSession.findFirst({
      where: { sessionToken },
    })

    if (!session) {
      throw new ChatAuthError('Session not found', 'SESSION_INVALID')
    }

    await this.prisma.chatbotPhoneSession.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  async fetchProfile(sessionToken: string): Promise<ChatAuthProfile | null> {
    const session = await this.prisma.chatbotPhoneSession.findFirst({
      where: {
        sessionToken,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { chatbotPhoneUser: true },
    })

    if (!session) {
      return null
    }

    return mapProfile({
      id: session.chatbotPhoneUser.id,
      displayName: session.chatbotPhoneUser.displayName ?? null,
      email: session.chatbotPhoneUser.email ?? null,
      tenantId: session.chatbotPhoneUser.tenantId ?? null,
      phone: session.chatbotPhoneUser.phone ?? session.chatbotPhoneUser.normalizedPhone ?? '',
      countryCode: session.chatbotPhoneUser.countryCode,
    })
  }

  async updateProfile(sessionToken: string, input: ChatAuthProfileInput): Promise<ChatAuthProfile> {
    const session = await this.prisma.chatbotPhoneSession.findFirst({
      where: {
        sessionToken,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!session) {
      throw new ChatAuthError('Session not found', 'SESSION_INVALID')
    }

    const trimmedName = input.displayName?.trim()
    const trimmedEmail = input.email?.trim().toLowerCase()

    if (!trimmedName) {
      throw new ChatAuthError('Full name is required', 'PROFILE_INVALID')
    }

    if (!trimmedEmail) {
      throw new ChatAuthError('Email is required', 'PROFILE_INVALID')
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new ChatAuthError('Email is invalid', 'PROFILE_INVALID')
    }

    const updated = await this.prisma.chatbotPhoneUser.update({
      where: { id: session.userId },
      data: {
        displayName: trimmedName,
        email: trimmedEmail,
      },
    })

    await this.ensureLinkBetweenPhoneUserAndAppUser(updated)

    return mapProfile({
      id: updated.id,
      displayName: updated.displayName ?? null,
      email: updated.email ?? null,
      tenantId: updated.tenantId ?? null,
      phone: updated.phone ?? updated.normalizedPhone ?? '',
      countryCode: updated.countryCode,
    })
  }

  private async ensureLinkBetweenPhoneUserAndAppUser(phoneUser: any) {
    const tenantId = await this.resolveTenantId(phoneUser.tenantId)

    const filters: Array<Record<string, unknown>> = []

    filters.push({ chatbotPhoneUserId: phoneUser.id })

    if (phoneUser.email) {
      filters.push({ email: { equals: phoneUser.email, mode: 'insensitive' } })
    }

    if (phoneUser.normalizedPhone) {
      filters.push({ normalizedPhone: phoneUser.normalizedPhone })
    }

    if (phoneUser.phone) {
      filters.push({ phone: phoneUser.phone })
    }

    const uniqueClauses = filters.filter(Boolean)
    if (!uniqueClauses.length) {
      return null
    }

    const candidates = await this.prisma.user.findMany({
      where: {
        tenantId,
        OR: uniqueClauses,
      },
      orderBy: [{ chatbotPhoneUserId: 'desc' }, { updatedAt: 'desc' }],
    })

    const matchedUser =
      candidates.find(candidate => candidate.chatbotPhoneUserId === phoneUser.id) ?? candidates[0] ?? null

    if (!matchedUser) {
      return null
    }

    const userUpdates: Record<string, unknown> = {}
    if (!matchedUser.chatbotPhoneUserId) {
      userUpdates.chatbotPhoneUserId = phoneUser.id
    }
    if (!matchedUser.phone && phoneUser.phone) {
      userUpdates.phone = phoneUser.phone
    }
    if (!matchedUser.normalizedPhone && phoneUser.normalizedPhone) {
      userUpdates.normalizedPhone = phoneUser.normalizedPhone
    }
    if ((!matchedUser.name || !matchedUser.name.trim()) && phoneUser.displayName) {
      userUpdates.name = phoneUser.displayName
    }
    if ((!matchedUser.email || !matchedUser.email.trim()) && phoneUser.email) {
      userUpdates.email = phoneUser.email
    }

    const phoneUserUpdates: Record<string, unknown> = {}
    if (!phoneUser.email && matchedUser.email) {
      phoneUserUpdates.email = matchedUser.email
    }
    if (!phoneUser.displayName && matchedUser.name) {
      phoneUserUpdates.displayName = matchedUser.name
    }
    if (!phoneUser.tenantId && matchedUser.tenantId) {
      phoneUserUpdates.tenantId = matchedUser.tenantId
    }

    if (Object.keys(userUpdates).length || Object.keys(phoneUserUpdates).length) {
      await this.prisma.$transaction(async tx => {
        if (Object.keys(userUpdates).length) {
          await tx.user.update({
            where: { id: matchedUser.id },
            data: userUpdates,
          })
        }

        if (Object.keys(phoneUserUpdates).length) {
          await tx.chatbotPhoneUser.update({
            where: { id: phoneUser.id },
            data: phoneUserUpdates,
          })
        }
      })
    }

    return this.prisma.user.findUnique({ where: { id: matchedUser.id } })
  }

  private async ensureChatbotAccessApproved(phoneUser: {
    id?: string | null
    email: string | null
    tenantId: string | null
    normalizedPhone?: string | null
    phone?: string | null
  }) {
    if (!phoneUser.id) {
      throw new ChatAuthError('No encontramos una cuenta autorizada para este número.', 'ACCESS_DENIED')
    }

    const storedPhoneUser = await this.prisma.chatbotPhoneUser.findUnique({
      where: { id: phoneUser.id },
    })

    if (!storedPhoneUser) {
      throw new ChatAuthError('No encontramos una cuenta autorizada para este número.', 'ACCESS_DENIED')
    }

    const linkedUser = await this.ensureLinkBetweenPhoneUserAndAppUser(storedPhoneUser)

    if (!linkedUser) {
      throw new ChatAuthError('No encontramos una cuenta autorizada para este número.', 'ACCESS_DENIED')
    }

    if (linkedUser.approvalStatus !== 'approved') {
      throw new ChatAuthError('Tu acceso al chatbot está pendiente de aprobación. Contacta al administrador.', 'ACCESS_DENIED')
    }

    if (linkedUser.status === 'suspended' || linkedUser.status === 'inactive') {
      throw new ChatAuthError('Tu cuenta se encuentra suspendida. Contacta al administrador.', 'ACCESS_DENIED')
    }

    if (linkedUser.chatbotAccessStatus !== 'approved') {
      const message =
        linkedUser.chatbotAccessStatus === 'revoked'
          ? 'Tu acceso al chatbot fue revocado por un administrador.'
          : 'Tu acceso al chatbot está pendiente de aprobación. Contacta al administrador.'
      throw new ChatAuthError(message, 'ACCESS_DENIED')
    }

    return linkedUser
  }

  private async enforceOtpRateLimit(userId: string): Promise<void> {
    if (!this.prisma || !this.prisma.isReady) {
      console.warn('[ChatOtpService] enforceOtpRateLimit: Prisma not ready, skipping rate limit check')
      return
    }

    const recent = await this.prisma.chatbotPhoneOtp.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (!recent) {
      return
    }

    const secondsSinceLast = Math.floor((Date.now() - recent.createdAt.getTime()) / 1000)
    if (secondsSinceLast < OTP_RESEND_MIN_INTERVAL_SECONDS) {
      throw new ChatAuthError('OTP recently sent. Please wait before requesting again.', 'RATE_LIMITED')
    }
  }

  private async dispatchOtpViaCommunicationHub(options: {
    tenantId: string | null
    normalizedPhone: string
    message: string
    preferredChannel?: 'SMS' | ExternalChannel
    whatsappNumber?: string | null
    telegramChatId?: string | null
    instagramUserId?: string | null
  }): Promise<ExternalChannel | null> {
    const availableChannels: ExternalChannel[] = []
    const whatsappTarget = options.whatsappNumber ?? options.normalizedPhone

    if (whatsappTarget) {
      availableChannels.push('WHATSAPP')
    }
    if (options.telegramChatId) {
      availableChannels.push('TELEGRAM')
    }
    if (options.instagramUserId) {
      availableChannels.push('INSTAGRAM')
    }

    if (!availableChannels.length) {
      return null
    }

    const orderedChannels: ExternalChannel[] = []
    if (options.preferredChannel && options.preferredChannel !== 'SMS') {
      const preferred = options.preferredChannel as ExternalChannel
      if (availableChannels.includes(preferred)) {
        orderedChannels.push(preferred)
      }
    }

    for (const channel of availableChannels) {
      if (!orderedChannels.includes(channel)) {
        orderedChannels.push(channel)
      }
    }

    const service = new CommunicationService({ tenantId: options.tenantId })

    for (const channel of orderedChannels) {
      try {
        switch (channel) {
          case 'WHATSAPP':
            await service.sendWhatsAppMessage({
              to: whatsappTarget!,
              message: options.message,
            })
            break
          case 'TELEGRAM':
            await service.sendTelegramMessage({
              chatId: options.telegramChatId!,
              message: options.message,
            })
            break
          case 'INSTAGRAM':
            await service.sendInstagramMessage({
              to: options.instagramUserId!,
              message: options.message,
            })
            break
        }

        logger.info('OTP dispatched via communication hub channel', {
          tenantId: options.tenantId ?? 'system',
          channel,
        })

        return channel
      } catch (error) {
        logger.warn('Failed to send OTP via communication hub channel', {
          tenantId: options.tenantId ?? 'system',
          channel,
          error: error instanceof Error ? error.message : 'unknown-error',
        })
      }
    }

    return null
  }

  private async getLabsMobileConfigFromDb(): Promise<LabsMobileConfig | null> {
    try {
      // Check database for LabsMobile settings (same logic as AdminSystemSettingsService)
      const possibleKeys = ['labsmobile_config', 'labs_mobile_api_key', 'labsmobile_api_key', 'labs_mobile', 'LABSMOBILE_API_KEY']

      for (const key of possibleKeys) {
        const config = await this.prisma.systemConfig.findUnique({
          where: { key },
        })

        if (config && config.value && typeof config.value === 'object') {
          const value = config.value as {
            username?: string;
            token?: string;
            apiKey?: string;
            senderId?: string;
            baseUrl?: string;
            endpoint?: string;
          }

          const username = value.username?.trim()
          const token = value.token?.trim() || value.apiKey?.trim()

          if (username && token) {
            return {
              username,
              token,
              senderId: value.senderId?.trim() || null,
              endpoint: value.endpoint?.trim() || value.baseUrl?.trim() || null,
            }
          }
        }
      }
    } catch (error) {
      // Log but don't throw - fall back to environment variables
      logger.warn('Failed to fetch LabsMobile config from database', {
        error: error instanceof Error ? error.message : 'unknown-error',
      })
    }

    return null
  }

  private ensureLabsMobileConfig(config: LabsMobileConfig | null): LabsMobileConfig {
    if (!config) {
      logger.error('[ChatOtpService] LabsMobile config is null - checking environment variables and database')
      throw new ChatAuthError('LabsMobile configuration is missing. Please configure SMS credentials in system settings.', 'CONFIG_NOT_FOUND')
    }

    if (!config.username || !config.token) {
      logger.error('[ChatOtpService] LabsMobile config missing credentials', {
        hasUsername: !!config.username,
        hasToken: !!config.token,
      })
      throw new ChatAuthError('LabsMobile credentials are incomplete. Please configure username and token in system settings.', 'CONFIG_NOT_FOUND')
    }

    logger.info('[ChatOtpService] LabsMobile config validated', {
      hasUsername: !!config.username,
      hasToken: !!config.token,
      hasSenderId: !!config.senderId,
    })

    return config
  }

  private async createSession(client: Prisma.TransactionClient, userId: string, metadata?: unknown) {
    const expiresAt = calculateSessionExpiry(SESSION_TTL_DAYS)
    const sessionToken = generateSessionToken()

    const session = await client.chatbotPhoneSession.create({
      data: {
        id: generateId(),
        userId,
        sessionToken,
        expiresAt,
        metadata: metadata as any,
      },
    })

    await this.pruneOldSessions(client, userId)

    return mapSession(session)
  }

  private async pruneOldSessions(client: Prisma.TransactionClient, userId: string) {
    const sessions = await client.chatbotPhoneSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: SESSION_MAX_ACTIVE,
      select: { id: true },
    })

    if (!sessions.length) {
      return
    }

    await client.chatbotPhoneSession.deleteMany({
      where: { id: { in: sessions.map(session => session.id) } },
    })
  }

  private async validateSessionToken(sessionToken: string, extend: boolean): Promise<ChatOtpVerifyResponse> {
    if (!sessionToken || typeof sessionToken !== 'string') {
      throw new ChatAuthError('Session token is required', 'SESSION_INVALID')
    }

    if (!this.prisma) {
      console.error('[ChatOtpService] validateSessionToken: this.prisma is undefined')
      throw new ChatAuthError('Database service is not available', 'DATABASE_NOT_READY')
    }

    // Ensure Prisma is connected and ready before using models
    await this.prisma.$connect()

    // Wait for PrismaService to be fully initialized (models available)
    // When using custom adapter, models might not be available immediately
    let retries = 0
    while (!this.prisma.isReady && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      retries++
    }

    if (!this.prisma.isReady) {
      throw new ChatAuthError('Database is not ready', 'DATABASE_NOT_READY')
    }

    // Try to access the model - if it fails, the error will be caught below
    const session = await this.prisma.chatbotPhoneSession.findFirst({
      where: {
        sessionToken,
      },
      include: {
        chatbotPhoneUser: true,
      },
    })

    if (!session) {
      throw new ChatAuthError('Session not found', 'SESSION_INVALID')
    }

    if (session.revokedAt) {
      throw new ChatAuthError('Session not found', 'SESSION_INVALID')
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new ChatAuthError('Session has expired', 'SESSION_INVALID')
    }

    const linkedUser = await this.ensureChatbotAccessApproved({
      id: session.chatbotPhoneUser.id,
      email: session.chatbotPhoneUser.email ?? null,
      tenantId: session.chatbotPhoneUser.tenantId ?? null,
      normalizedPhone: session.chatbotPhoneUser.normalizedPhone ?? null,
      phone: session.chatbotPhoneUser.phone ?? null,
    })

    const updates: Record<string, unknown> = {
      lastUsedAt: new Date(),
    }

    let finalSession = session

    if (extend) {
      const newExpiry = calculateSessionExpiry(SESSION_TTL_DAYS)
      updates.expiresAt = newExpiry

      finalSession = await this.prisma.chatbotPhoneSession.update({
        where: { id: session.id },
        data: updates,
        include: { chatbotPhoneUser: true },
      })
    } else {
      await this.prisma.chatbotPhoneSession.update({
        where: { id: session.id },
        data: updates,
      })
    }

    await this.prisma.chatbotPhoneUser.update({
      where: { id: session.userId },
      data: { lastActiveAt: new Date() },
    })

    const refreshedPhoneUser = await this.prisma.chatbotPhoneUser.findUnique({ where: { id: session.userId } })
    const userRecord = refreshedPhoneUser ?? session.chatbotPhoneUser

    return {
      success: true,
      session: mapSession(finalSession),
      user: mapUser(
        {
          id: userRecord.id,
          phone: userRecord.phone ?? null,
          normalizedPhone: userRecord.normalizedPhone ?? null,
          countryCode: userRecord.countryCode ?? null,
          tenantId: userRecord.tenantId ?? null,
          displayName: userRecord.displayName ?? null,
          email: userRecord.email ?? null,
        },
        linkedUser,
      ),
    }
  }

  private async resolveTenantId(input?: string | null): Promise<string> {
    const trimmed = input?.trim()
    if (!trimmed) {
      return DEFAULT_TENANT_ID
    }

    if (trimmed === DEFAULT_TENANT_ID) {
      return trimmed
    }

    const hostCandidate = trimmed.replace(/^https?:\/\//i, '').split('/')[0]?.toLowerCase() ?? ''
    const hostWithoutPort = hostCandidate.split(':')[0] ?? hostCandidate
    const normalizedHost = hostWithoutPort.startsWith('www.') ? hostWithoutPort.slice(4) : hostWithoutPort

    const domainCandidates = normalizedHost
      ? Array.from(new Set([normalizedHost, hostWithoutPort, hostCandidate].filter(Boolean)))
      : []

    const orClauses: Array<Record<string, unknown>> = [{ id: trimmed }, { subdomain: trimmed }]
    if (domainCandidates.length) {
      orClauses.push({ domain: { in: domainCandidates } })
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { OR: orClauses },
      select: { id: true },
    })

    if (tenant?.id) {
      return tenant.id
    }

    const isLikelyTenantId = /^tenant_|^[a-z0-9]{12,}$/i.test(trimmed)
    if (isLikelyTenantId) {
      return trimmed
    }

    return DEFAULT_TENANT_ID
  }

  async getUserMessages(userId: string, peerId: string) {
    if (!userId || !peerId) {
      return []
    }

    // Build thread key from sorted user IDs
    const sortedIds = [userId, peerId].sort()
    const threadKey = `${sortedIds[0]}.${sortedIds[1]}`

    const messages = await this.prisma.tenantUserChatMessage.findMany({
      where: {
        threadKey,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        attachments: true,
      },
    })

    return messages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      recipientId: msg.recipientId,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      readAt: msg.readAt?.toISOString() ?? null,
      editedAt: msg.editedAt?.toISOString() ?? null,
      attachments: msg.attachments.map(att => ({
        id: att.id,
        filename: att.filename,
        originalName: att.originalName,
        mimeType: att.mimeType,
        size: att.size,
        // Generate URL for database-stored attachments, or use existing URL
        url: att.url || `/api/chat/attachments/${att.id}`,
      })),
    }))
  }

  async markMessagesAsRead(userId: string, messageIds: string[]) {
    if (!userId || !messageIds || messageIds.length === 0) {
      return 0
    }

    const result = await this.prisma.tenantUserChatMessage.updateMany({
      where: {
        id: { in: messageIds },
        recipientId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })

    return result.count
  }

  async sendUserMessage(
    senderId: string,
    recipientId: string,
    content: string,
    attachments: any[] = []
  ) {
    if (!senderId || !recipientId || !content) {
      throw new Error('senderId, recipientId, and content are required')
    }

    // Get sender info to determine tenantId
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { tenantId: true },
    })

    if (!sender?.tenantId) {
      throw new Error('Sender tenantId not found')
    }

    // Build thread key from sorted user IDs
    const sortedIds = [senderId, recipientId].sort()
    const threadKey = `${sortedIds[0]}.${sortedIds[1]}`

    // Create message with attachments
    const message = await this.prisma.tenantUserChatMessage.create({
      data: {
        id: generateId(),
        tenantId: sender.tenantId,
        threadKey,
        senderId,
        recipientId,
        content,
      },
      include: {
        attachments: true,
      },
    })

    // Link existing attachments to the message (attachments were created during upload)
    if (attachments.length > 0) {
      const attachmentIds = attachments.map(att => att.id).filter(Boolean)
      if (attachmentIds.length > 0) {
        await this.prisma.chatAttachment.updateMany({
          where: {
            id: { in: attachmentIds },
            messageId: null, // Only link unlinked attachments
          },
          data: {
            messageId: message.id,
          },
        })

        // Fetch updated message with linked attachments
        const updatedMessage = await this.prisma.tenantUserChatMessage.findUnique({
          where: { id: message.id },
          include: { attachments: true },
        })

        if (updatedMessage) {
          return {
            id: updatedMessage.id,
            senderId: updatedMessage.senderId,
            recipientId: updatedMessage.recipientId,
            content: updatedMessage.content,
            createdAt: updatedMessage.createdAt.toISOString(),
            readAt: updatedMessage.readAt?.toISOString() ?? null,
            editedAt: updatedMessage.editedAt?.toISOString() ?? null,
            attachments: updatedMessage.attachments.map(att => ({
              id: att.id,
              filename: att.filename,
              originalName: att.originalName,
              mimeType: att.mimeType,
              size: att.size,
              url: att.url || `/api/chat/attachments/${att.id}`,
            })),
          }
        }
      }
    }

    return {
      id: message.id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() ?? null,
      editedAt: message.editedAt?.toISOString() ?? null,
      attachments: [],
    }
  }

  async getAttachmentById(id: string) {
    return await this.prisma.chatAttachment.findUnique({
      where: { id },
      select: {
        id: true,
        data: true,
        mimeType: true,
        originalName: true,
        size: true,
      },
    });
  }

  async createAttachment(data: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    data: string;
  }) {
    return await this.prisma.chatAttachment.create({
      data: {
        id: generateId(),
        ...data,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
      },
    });
  }
}

function mapSession(session: { id: string; sessionToken: string; expiresAt: Date }): ChatAuthSession {
  return {
    token: session.sessionToken,
    sessionId: session.id,
    expiresAt: session.expiresAt.toISOString(),
  }
}
