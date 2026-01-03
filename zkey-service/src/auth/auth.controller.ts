import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      walletAddress?: string;
      signature?: string; // Proof of ownership
      tenantId?: string;
      clientId?: string; // can be clientId or interactionId
      interactionId?: string;
    },
  ) {
    return this.authService.register(
      body.email,
      body.firstName,
      body.lastName,
      body.phone,
      body.walletAddress,
      body.signature,
      body.tenantId,
      body.clientId ?? body.interactionId,
    );
  }

  @Post('login')
  async login(
    @Body()
    body: {
      email: string;
      password: string;
      tenantId?: string;
      clientId?: string; // can be clientId or interactionId
      interactionId?: string;
    },
  ) {
    return this.authService.login(
      body.email,
      body.password,
      body.tenantId,
      body.clientId ?? body.interactionId,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: { user: { userId: string } }) {
    return this.authService.validateUser(req.user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: { user: { userId: string } },
    @Body() body: { firstName?: string; lastName?: string; phone?: string; walletAddress?: string },
  ) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @Post('otp/request')
  async requestOtp(
    @Body()
    body: {
      identifier: string;
      type: 'email' | 'phone';
      clientId: string; // This can be clientId or interactionId
    },
  ) {
    return this.authService.requestOtp(
      body.identifier,
      body.type,
      body.clientId,
    );
  }

  @Post('otp/verify')
  async verifyOtp(@Body() body: { identifier: string; code: string }) {
    return this.authService.verifyOtp(body.identifier, body.code);
  }

  @Get('nonce/:address')
  async getWalletNonce(@Request() req: { params: { address: string } }) {
    return this.authService.getWalletNonce(req.params.address);
  }

  @Post('wallet/login')
  async loginWithWallet(@Body() body: { address: string; signature: string }) {
    return this.authService.loginWithWallet(body.address, body.signature);
  }

  @Post('wallet/unlink')
  @UseGuards(JwtAuthGuard)
  async unlinkWallet(@Request() req: { user: { userId: string } }) {
    return this.authService.unlinkWallet(req.user.userId);
  }
}
