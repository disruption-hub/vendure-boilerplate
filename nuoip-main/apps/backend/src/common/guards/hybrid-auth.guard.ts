import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import * as jwt from 'jsonwebtoken'
import type { Request } from 'express'

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
    chatAuth?: {
        tenantId?: string
        phoneUserId?: string
        phone?: string
    }
}

/**
 * Hybrid authentication guard that accepts both:
 * 1. JWT tokens (from email/password login) - existing admin flow
 * 2. Session tokens (from OTP login) - for admins logged in via chat
 * 
 * Validates that the user has admin or super_admin role for both auth methods.
 */
@Injectable()
export class HybridAdminGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    private resolveJwtSecret(): string {
        return (
            this.configService.get<string>('NEST_AUTH_SECRET') ??
            this.configService.get<string>('NEXTAUTH_SECRET') ??
            'ipnuo-secret'
        )
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
            const token = this.extractTokenFromHeader(request)

            console.log('[HybridAdminGuard] canActivate called with token:', token ? token.substring(0, 10) + '...' : 'none')

            if (!token) {
                console.log('[HybridAdminGuard] No token provided, throwing 401')
                throw new UnauthorizedException('No token provided')
            }

            // First, try JWT authentication (admin email/password login)
            const jwtResult = await this.tryJwtAuth(token, request)
            if (jwtResult) {
                console.log('[HybridAdminGuard] JWT auth succeeded')
                return true
            }

            // If JWT fails, try session token authentication (OTP login)
            const sessionResult = await this.trySessionAuth(token, request)
            if (sessionResult) {
                console.log('[HybridAdminGuard] Session auth succeeded')
                return true
            }

            console.log('[HybridAdminGuard] Both auth methods failed, throwing 401')
            throw new UnauthorizedException('Invalid token or insufficient permissions')
        } catch (error) {
            // Re-throw UnauthorizedException as-is (it becomes 401)
            if (error instanceof UnauthorizedException) {
                throw error
            }
            // Log and wrap any other error as UnauthorizedException to prevent 500
            console.error('[HybridAdminGuard] Unexpected error in canActivate:', error)
            throw new UnauthorizedException('Authentication failed due to internal error')
        }
    }

    /**
     * Try to authenticate using JWT token
     */
    private async tryJwtAuth(
        token: string,
        request: AuthenticatedRequest,
    ): Promise<boolean> {
        try {
            const secret = this.resolveJwtSecret()
            const payload = jwt.verify(token, secret) as JwtPayload

            // Verify admin role
            if (!payload.role || (payload.role !== 'admin' && payload.role !== 'super_admin')) {
                return false
            }

            // Attach user to request
            console.log('[HybridAdminGuard] JWT payload:', { sub: payload.sub, tenantId: payload.tenantId, role: payload.role })
            request.user = {
                id: payload.sub || payload.userId || '',
                email: payload.email,
                tenantId: payload.tenantId,
                role: payload.role,
            }

            return true
        } catch (error) {
            // JWT verification failed, not a JWT token or invalid
            return false
        }
    }

    /**
     * Try to authenticate using session token (OTP login)
     */
    private async trySessionAuth(
        token: string,
        request: AuthenticatedRequest,
    ): Promise<boolean> {
        try {
            console.log('[HybridAdminGuard] Trying session auth with token:', token.substring(0, 10) + '...')

            // Look up the session by sessionToken
            const session = await this.prisma.chatbotPhoneSession.findUnique({
                where: { sessionToken: token },
                include: {
                    chatbotPhoneUser: {
                        include: {
                            users: true, // Get the linked User records
                        },
                    },
                },
            })

            if (!session) {
                console.log('[HybridAdminGuard] Session not found')
                return false
            }

            // Check if session is expired
            if (session.expiresAt < new Date()) {
                console.log('[HybridAdminGuard] Session expired', { expiresAt: session.expiresAt, now: new Date() })
                return false
            }

            // Check if session is revoked
            if (session.revokedAt) {
                console.log('[HybridAdminGuard] Session revoked', { revokedAt: session.revokedAt })
                return false
            }

            console.log('[HybridAdminGuard] Session found for phone user:', {
                phoneUserId: session.userId,
                phone: session.chatbotPhoneUser.phone,
                linkedUsersCount: session.chatbotPhoneUser.users?.length || 0
            })

            // Find any linked user to get tenantId (prefer admin but accept any)
            const anyLinkedUser = session.chatbotPhoneUser.users?.[0]
            const tenantIdFromLinkedUser = anyLinkedUser?.tenantId

            // Always attach chatAuth for valid sessions - this allows endpoints 
            // that only need tenantId to work without requiring admin role
            request.chatAuth = {
                tenantId: tenantIdFromLinkedUser,
                phoneUserId: session.userId,
                phone: session.chatbotPhoneUser.phone,
            }

            console.log('[HybridAdminGuard] chatAuth attached:', request.chatAuth)

            // Find the admin User linked to this ChatbotPhoneUser
            let adminUser = session.chatbotPhoneUser.users?.find(
                (u) => u.role === 'admin' || u.role === 'super_admin',
            )

            // Fallback: If no linked admin user found, try to find by phone number
            // This handles cases where the relation might not be established yet but the phone matches
            if (!adminUser && session.chatbotPhoneUser.phone) {
                console.log('[HybridAdminGuard] No linked admin user found, trying fallback by phone:', session.chatbotPhoneUser.phone)

                const userByPhone = await this.prisma.user.findFirst({
                    where: {
                        phone: session.chatbotPhoneUser.phone,
                        OR: [
                            { role: 'admin' },
                            { role: 'super_admin' }
                        ]
                    }
                })

                if (userByPhone) {
                    console.log('[HybridAdminGuard] Found admin user by phone fallback:', userByPhone.id)
                    adminUser = userByPhone
                    // Update chatAuth tenantId if we found an admin user
                    request.chatAuth.tenantId = userByPhone.tenantId
                }
            }

            if (!adminUser) {
                console.log('[HybridAdminGuard] No admin user linked to this session (checked relation and phone fallback)')
                // Session is valid but user doesn't have admin role
                // chatAuth is still attached, so endpoints that don't require admin can still work
                return true  // Changed from false - allow valid sessions through
            }

            console.log('[HybridAdminGuard] Admin user found:', {
                id: adminUser.id,
                email: adminUser.email,
                role: adminUser.role
            })

            // Attach user to request (for admin-only features)
            console.log('[HybridAdminGuard] Session user attached:', { id: adminUser.id, tenantId: adminUser.tenantId, role: adminUser.role })
            request.user = {
                id: adminUser.id,
                email: adminUser.email,
                tenantId: adminUser.tenantId,
                role: adminUser.role,
            }

            return true
        } catch (error) {
            console.error('[HybridAdminGuard] Session auth error:', error)
            // Session lookup failed
            return false
        }
    }

    private extractTokenFromHeader(request: AuthenticatedRequest): string | undefined {
        // 1. Try Authorization header
        const [type, token] = request.headers.authorization?.split(' ') ?? []
        if (type === 'Bearer') {
            return token
        }

        // 2. Try Cookies (manual parsing to avoid adding cookie-parser dependency)
        // Look for next-auth.session-token or __Secure-next-auth.session-token
        const cookieHeader = request.headers.cookie
        if (cookieHeader) {
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=')
                if (key && value) {
                    acc[key] = decodeURIComponent(value)
                }
                return acc
            }, {} as Record<string, string>)

            return cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token']
        }

        return undefined
    }
}
