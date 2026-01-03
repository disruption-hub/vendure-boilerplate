import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import * as jwt from 'jsonwebtoken'

export interface JwtPayload {
  sub: string
  email: string
  tenantId?: string
  role?: string
  userId?: string
}

/**
 * JWT Strategy for validating JWT tokens
 * 
 * Note: This is a simplified version that works without Passport.
 * To use Passport-based strategy, install:
 * - @nestjs/passport
 * - passport
 * - passport-jwt
 * 
 * Then extend PassportStrategy(Strategy) instead.
 */
@Injectable()
export class JwtStrategy {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private resolveJwtSecret(): string {
    return (
      this.configService.get<string>('NEST_AUTH_SECRET') ??
      this.configService.get<string>('NEXTAUTH_SECRET') ??
      'ipnuo-secret'
    )
  }

  async validate(token: string): Promise<JwtPayload & { id: string }> {
    try {
      const secret = this.resolveJwtSecret()
      const payload = jwt.verify(token, secret) as JwtPayload

      const userId = payload.sub || payload.userId
      if (!userId) {
        throw new UnauthorizedException('Invalid token payload')
      }

      // Optionally fetch user from database to ensure they still exist
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          tenantId: true,
        },
      })

      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      return {
        ...payload,
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException('Invalid token')
    }
  }
}

