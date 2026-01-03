import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '../common/guards/auth.guard'
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator'
import type { AdminLoginRequest, AdminLoginResponse } from '@ipnuo/domain'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    }
  }

  // Note: Login is handled by AdminAuthController at /auth/admin/login
  // and ChatAuthController for chat OTP flows
  // This controller provides the standard "me" endpoint for authenticated users
}

