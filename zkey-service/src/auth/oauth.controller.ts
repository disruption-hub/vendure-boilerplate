import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Res,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller()
export class OAuthController {
  constructor(
    private oauthService: OAuthService,
    private authService: AuthService,
  ) {}

  @Get('oauth/authorize')
  async authorize(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('scope') scope: string,
    @Query('state') state: string,
    @Query('nonce') nonce: string,
    @Res() res: Response,
  ) {
    if (!clientId || !redirectUri || !scope) {
      throw new BadRequestException('Missing required parameters');
    }

    const url = await this.oauthService.startInteraction(
      clientId,
      redirectUri,
      scope,
      state,
      nonce,
    );
    return res.redirect(url);
  }

  @Post('oauth/token')
  async token(
    @Body()
    body: {
      grant_type: string;
      code?: string;
      refresh_token?: string;
      client_id: string;
      client_secret?: string;
      redirect_uri: string;
    },
  ) {
    if (body.grant_type === 'authorization_code') {
      if (!body.code) throw new BadRequestException('Missing code');
      return this.oauthService.exchangeCode(
        body.code,
        body.client_id,
        body.client_secret,
      );
    }

    if (body.grant_type === 'refresh_token') {
      if (!body.refresh_token)
        throw new BadRequestException('Missing refresh_token');
      return this.authService.refreshToken(body.refresh_token);
    }

    throw new BadRequestException('Unsupported grant_type');
  }

  @Get('auth/interaction/:id')
  async getInteraction(@Param('id') id: string) {
    return this.oauthService.getInteractionDetails(id);
  }

  @Post('auth/interaction/login')
  async loginInteraction(
    @Body()
    body: {
      interactionId: string;
      email?: string;
      password?: string;
      userId?: string;
    },
  ) {
    if (body.userId) {
      return this.oauthService.loginInteraction(
        body.interactionId,
        body.userId,
      );
    }

    if (body.email && body.password) {
      // We need to find the tenantId from the interaction's application
      const interaction = await (
        this.oauthService as any
      ).prisma.interaction.findUnique({
        where: { id: body.interactionId },
      });
      if (!interaction) throw new BadRequestException('Invalid interaction');

      const clientId = interaction.details.clientId;
      const app = await (
        this.oauthService as any
      ).prisma.application.findUnique({
        where: { clientId },
      });
      if (!app) throw new BadRequestException('Invalid application');

      const user = await this.oauthService.verifyCredentials(
        body.email,
        body.password,
        app.tenantId,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return this.oauthService.loginInteraction(body.interactionId, user.id);
    }

    throw new BadRequestException('Missing login credentials');
  }
}
