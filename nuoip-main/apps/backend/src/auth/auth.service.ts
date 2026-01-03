import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import type { Secret, SignOptions } from 'jsonwebtoken'
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  ChatOtpRequest,
  ChatOtpResponse,
  ChatOtpVerifyRequest,
  ChatOtpVerifyResponse,
} from '@ipnuo/domain'
import { ChatAuthError } from '@ipnuo/shared-chat-auth'
import { PrismaService } from '../prisma/prisma.service'
import { ChatOtpService } from './services/chat-otp.service'

const DEFAULT_TOKEN_EXPIRATION = '1h'

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly chatOtpService: ChatOtpService,
  ) {
    console.log('[Auth Service] Constructor - prisma:', this.prisma ? 'injected' : 'NOT INJECTED')
  }

  private resolveJwtSecret(): string {
    return (
      this.configService.get<string>('NEST_AUTH_SECRET') ??
      this.configService.get<string>('NEXTAUTH_SECRET') ??
      'ipnuo-secret'
    )
  }

  private resolveJwtExpiry(): string {
    return this.configService.get<string>('AUTH_TOKEN_EXPIRES_IN') ?? DEFAULT_TOKEN_EXPIRATION
  }

  async adminLogin(request: AdminLoginRequest): Promise<AdminLoginResponse> {
    const email = request.email.trim().toLowerCase()
    if (!email || !request.password) {
      throw new UnauthorizedException('Invalid credentials')
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
      throw new InternalServerErrorException('Database is not ready. Please try again in a moment.')
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    })

    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const matches = await bcrypt.compare(request.password, user.password)
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    }

    const secret: Secret = this.resolveJwtSecret()
    const options: SignOptions = {
      expiresIn: this.resolveJwtExpiry() as SignOptions['expiresIn'],
    }

    const token = jwt.sign(jwtPayload, secret, options)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role ?? undefined,
        tenantId: user.tenantId ?? undefined,
      },
    }
  }

  async chatRequestOtp(payload: ChatOtpRequest): Promise<ChatOtpResponse> {
    try {
      return await this.chatOtpService.requestOtp(payload)
    } catch (error) {
      if (error instanceof ChatAuthError) {
        throw new BadRequestException({ error: error.message, code: error.code })
      }

      // Log the actual error for debugging
      console.error('[AuthService] Error requesting OTP:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        payload: { phone: payload.phone, tenantId: payload.tenantId, host: payload.host },
      })

      throw new InternalServerErrorException('Unable to request verification code')
    }
  }

  async chatVerifyOtp(payload: ChatOtpVerifyRequest): Promise<ChatOtpVerifyResponse> {
    try {
      return await this.chatOtpService.verifyOtp(payload)
    } catch (error) {
      if (error instanceof ChatAuthError) {
        throw new BadRequestException({ error: error.message, code: error.code })
      }

      throw new InternalServerErrorException('Unable to verify verification code')
    }
  }
}
