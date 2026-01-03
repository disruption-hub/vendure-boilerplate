import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import * as jwt from 'jsonwebtoken'
import type { Request } from 'express'

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

export interface JwtPayload {
  sub: string
  email: string
  tenantId?: string
  role?: string
  userId?: string
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    tenantId?: string
    role?: string
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  private resolveJwtSecret(): string {
    return (
      this.configService.get<string>('NEST_AUTH_SECRET') ??
      this.configService.get<string>('NEXTAUTH_SECRET') ??
      'ipnuo-secret'
    )
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('No token provided')
    }

    try {
      const secret = this.resolveJwtSecret()
      const payload = jwt.verify(token, secret) as JwtPayload

      // Attach user to request
      request.user = {
        id: payload.sub || payload.userId || '',
        email: payload.email,
        tenantId: payload.tenantId,
        role: payload.role,
      }

      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }

  private extractTokenFromHeader(request: AuthenticatedRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.user) {
      throw new UnauthorizedException('User not authenticated')
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = request.user.role
      if (!userRole || !requiredRoles.includes(userRole)) {
        throw new UnauthorizedException('Insufficient permissions')
      }
    } else {
      // Default: require admin or super_admin
      const userRole = request.user.role
      if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
        throw new UnauthorizedException('Admin access required')
      }
    }

    return true
  }
}

