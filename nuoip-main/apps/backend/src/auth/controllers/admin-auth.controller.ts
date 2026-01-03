import { Body, Controller, Post } from '@nestjs/common'
import type { AdminLoginRequest, AdminLoginResponse } from '@ipnuo/domain'
import { AuthService } from '../auth.service'

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() payload: AdminLoginRequest): Promise<AdminLoginResponse> {
    return this.authService.adminLogin(payload)
  }
}
