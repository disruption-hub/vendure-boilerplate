import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OAuthService {
  private readonly DASHBOARD_URL =
    process.env.DASHBOARD_URL || 'http://localhost:3003';

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private jwtService: JwtService,
  ) { }

  async validateClient(clientId: string, redirectUri: string) {
    const app = await this.prisma.application.findUnique({
      where: { clientId },
      include: { tenant: true },
    });

    if (!app) {
      throw new BadRequestException('Invalid client_id');
    }

    if (!app.redirectUris.includes(redirectUri)) {
      console.error(
        `[OIDC] Redirect URI mismatch. Received: "${redirectUri}", Expected one of: ${JSON.stringify(app.redirectUris)}`,
      );
      throw new BadRequestException('Invalid redirect_uri');
    }

    return app;
  }

  async startInteraction(
    clientId: string,
    redirectUri: string,
    scope: string,
    state?: string,
    nonce?: string,
  ) {
    const app = await this.validateClient(clientId, redirectUri);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins to login
    console.log(
      `[OIDC] Starting interaction for client ${clientId}, redirect: ${redirectUri}`,
    );
    const interaction = await this.prisma.interaction.create({
      data: {
        expiresAt,
        details: {
          type: 'oidc_login',
          clientId,
          redirectUri,
          scope,
          state,
          nonce,
        },
      },
    });
    console.log(`[OIDC] Created interaction ${interaction.id}`);

    console.log(`[OIDC] Created interaction ${interaction.id}`);

    const dashboardUrls = (app.tenant as any).dashboardUrls || {};
    const env = process.env.NODE_ENV || 'development';
    const dashboardUrl =
      env === 'production'
        ? dashboardUrls['production'] || this.DASHBOARD_URL
        : dashboardUrls[env] ||
        dashboardUrls['development'] ||
        this.DASHBOARD_URL;

    return `${dashboardUrl}/auth/login?interactionId=${interaction.id}`;
  }

  async getInteractionDetails(interactionId: string) {
    const interaction = await this.prisma.interaction.findUnique({
      where: { id: interactionId },
    });

    if (!interaction) {
      throw new BadRequestException('Invalid interaction');
    }

    const details = interaction.details as any;
    if (details.type !== 'oidc_login') {
      throw new BadRequestException('Invalid interaction type');
    }

    if (new Date() > interaction.expiresAt) {
      const restartUrl = await this.startInteraction(
        details.clientId,
        details.redirectUri,
        details.scope,
        details.state,
        details.nonce,
      );
      return {
        expired: true,
        restartUrl,
      };
    }

    const app = await this.prisma.application.findUnique({
      where: { clientId: details.clientId },
      include: { tenant: true },
    });

    const tenantBranding = (app?.tenant as any)?.branding || {};
    const appBranding = (app?.branding as any) || {};

    const hasOwn = (obj: any, key: string) =>
      !!obj && Object.prototype.hasOwnProperty.call(obj, key);

    // Merge tenant + application branding deeply (application overrides tenant).
    const mergeObj = (a: any, b: any) => ({ ...(a || {}), ...(b || {}) });
    const mergeLocales = (
      tenantLocales: Record<string, Record<string, any>> | undefined,
      appLocales: Record<string, Record<string, any>> | undefined,
    ) => {
      const a = tenantLocales || {};
      const b = appLocales || {};
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      const out: Record<string, Record<string, any>> = { ...a, ...b };
      for (const k of keys) {
        out[k] = { ...(a[k] || {}), ...(b[k] || {}) };
      }
      return out;
    };
    const mergeCard = (tenantCard: any, appCard: any) => {
      const merged = mergeObj(tenantCard, appCard);
      merged.colors = mergeObj(tenantCard?.colors, appCard?.colors);
      return merged;
    };

    const mergedUi = mergeObj(tenantBranding?.ui, appBranding?.ui);
    mergedUi.locales = mergeLocales(
      tenantBranding?.ui?.locales,
      appBranding?.ui?.locales,
    );

    const mergedMessages = mergeObj(
      tenantBranding?.messages,
      appBranding?.messages,
    );
    mergedMessages.locales = mergeLocales(
      tenantBranding?.messages?.locales,
      appBranding?.messages?.locales,
    );
    mergedMessages.styles = mergeObj(
      tenantBranding?.messages?.styles,
      appBranding?.messages?.styles,
    );

    const branding: any = {
      ...mergeObj(tenantBranding, appBranding),
      colors: mergeObj(tenantBranding?.colors, appBranding?.colors),
      ui: mergedUi,
      messages: mergedMessages,
      designTokens: mergeObj(
        tenantBranding?.designTokens,
        appBranding?.designTokens,
      ),
      loginContainer: mergeObj(
        tenantBranding?.loginContainer,
        appBranding?.loginContainer,
      ),
      authCards: {
        password: mergeCard(
          tenantBranding?.authCards?.password,
          appBranding?.authCards?.password,
        ),
        emailOtp: mergeCard(
          tenantBranding?.authCards?.emailOtp,
          appBranding?.authCards?.emailOtp,
        ),
        smsOtp: mergeCard(
          tenantBranding?.authCards?.smsOtp,
          appBranding?.authCards?.smsOtp,
        ),
        wallet: mergeCard(
          tenantBranding?.authCards?.wallet,
          appBranding?.authCards?.wallet,
        ),
      },
    };

    // If branding explicitly sets logo to null, treat that as "no logo" and do not fall back.
    const effectiveLogo = hasOwn(appBranding, 'logo')
      ? appBranding.logo
      : hasOwn(tenantBranding, 'logo')
        ? tenantBranding.logo
        : app?.logo || app?.tenant.slug || null;

    branding.logo = effectiveLogo;
    branding.invertLogo =
      appBranding.invertLogo !== undefined
        ? appBranding.invertLogo
        : tenantBranding.invertLogo || false;
    branding.primaryColor =
      appBranding.primaryColor || tenantBranding.primaryColor || null;
    branding.backgroundColor =
      appBranding.backgroundColor || tenantBranding.backgroundColor || null;
    branding.loginTitle =
      appBranding.loginTitle || tenantBranding.loginTitle || null;
    branding.loginSubtitle =
      appBranding.loginSubtitle || tenantBranding.loginSubtitle || null;

    return {
      clientName: app?.name,
      clientDescription: app?.description,
      tenantName: app?.tenant.name,
      logo: effectiveLogo,
      invertLogo: branding.invertLogo,
      primaryColor: branding.primaryColor || app?.primaryColor,
      branding, // Return computed branding object with fallbacks
      scopes: details.scope,
      authMethods: (app?.authMethods as any) || {
        password: true,
        emailOtp: false,
        smsOtp: false,
        wallet: false,
      },
    };
  }

  async verifyCredentials(email: string, password: string, tenantId: string) {
    // Query ALL users with this email in this tenant
    const users = await this.prisma.user.findMany({
      where: { primaryEmail: email, tenantId, deletedAt: null },
    });

    if (users.length === 0) return null;

    // 1. Check if there is ANY verified user first.
    // If a verified user exists, they are the ONLY valid one for login.
    // We do not allow logging into an unverified "imposter" account if a verified one owns the email.
    const verifiedUser = users.find((u) => u.emailVerified);

    if (verifiedUser) {
      if (!verifiedUser.passwordHash) return null;
      const isValid = await bcrypt.compare(password, verifiedUser.passwordHash);
      return isValid ? verifiedUser : null;
    }

    // 2. If no verified user exists, check unverified users.
    // Iterate through all unverified matches.
    // If multiple unverified users have the same password, we pick the first one (arbitrarily, or by creation date).
    // Since they are unverified/pending, this is acceptable until one verifies.
    for (const user of users) {
      if (
        user.passwordHash &&
        (await bcrypt.compare(password, user.passwordHash))
      ) {
        return user;
      }
    }

    return null;
  }

  async loginInteraction(interactionId: string, userId: string) {
    const interaction = await this.prisma.interaction.findUnique({
      where: { id: interactionId },
    });

    if (!interaction || new Date() > interaction.expiresAt) {
      throw new BadRequestException('Interaction invalid or expired');
    }

    const details = interaction.details as any;

    // Generate Auth Code
    const code = uuidv4();
    console.log(
      `[OIDC] Finishing interaction ${interactionId} with code ${code} for user ${userId}`,
    );

    // Update interaction with code and userId
    await this.prisma.interaction.update({
      where: { id: interactionId },
      data: {
        details: {
          ...details,
          code,
          userId,
        },
      },
    });

    // Build redirect URL
    const url = new URL(details.redirectUri);
    url.searchParams.append('code', code);
    if (details.state) {
      url.searchParams.append('state', details.state);
    }

    return { redirectUri: url.toString() };
  }

  async exchangeCode(code: string, clientId: string, clientSecret?: string) {
    // clientSecret is accepted for OIDC compatibility; we don't validate it yet.
    void clientSecret;
    console.log(`[OIDC] Exchanging code: ${code} for client: ${clientId}`);
    // Find interaction by code
    // Note: Prisma JSON path filtering can be sensitive in some environments.
    // We'll fetch active interactions and filter manually to be 100% sure.
    const activeInteractions = await this.prisma.interaction.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
    });

    const interaction = activeInteractions.find(
      (i) => (i.details as any)?.code === code,
    );

    if (!interaction) {
      console.error(
        `[OIDC] Interaction not found for code: ${code}. Active interactions: ${activeInteractions.length}`,
      );
      throw new BadRequestException('Invalid authorization code');
    }

    const details = interaction.details as any;
    if (details.clientId !== clientId) {
      throw new BadRequestException('Client mismatch');
    }

    // Generate Tokens
    const userId = details.userId;
    const app = await this.prisma.application.findUnique({
      where: { clientId: details.clientId },
    });
    const tokens = await this.authService.generateTokens(userId, app);

    const idToken = await this.generateIdToken(userId, clientId, details.nonce);

    // Clean up interaction ONLY after everything is successful
    await this.prisma.interaction.delete({ where: { id: interaction.id } });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1h
      id_token: idToken,
    };
  }

  private async generateIdToken(
    userId: string,
    clientId: string,
    nonce?: string,
  ) {
    const user = await this.authService.validateUser(userId);

    // OIDC ID Token payload
    const payload = {
      sub: userId,
      aud: clientId,
      iss: 'zkey-auth',
      nonce: nonce,
      email: user?.primaryEmail,
      given_name: user?.firstName,
      family_name: user?.lastName,
      name: user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : undefined,
    };
    return this.jwtService.sign(payload);
  }
}
