import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OAuthService {
    private readonly DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3003';

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
            throw new BadRequestException('Invalid redirect_uri');
        }

        return app;
    }

    async startInteraction(clientId: string, redirectUri: string, scope: string, state?: string, nonce?: string) {
        await this.validateClient(clientId, redirectUri);

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins to login
        console.log(`[OIDC] Starting interaction for client ${clientId}, redirect: ${redirectUri}`);
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

        return `${this.DASHBOARD_URL}/auth/login?interactionId=${interaction.id}`;
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
            throw new BadRequestException('Interaction expired');
        }

        const app = await this.prisma.application.findUnique({
            where: { clientId: details.clientId },
            include: { tenant: true },
        });

        return {
            clientName: app?.name,
            tenantName: app?.tenant.name,
            logo: app?.tenant.slug, // potentially fetch real logo URL
            scopes: details.scope,
        };
    }

    async verifyCredentials(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { primaryEmail: email },
        });

        if (!user || !user.passwordHash) {
            return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return null;
        }

        return user;
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
        console.log(`[OIDC] Finishing interaction ${interactionId} with code ${code} for user ${userId}`);

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
        console.log(`[OIDC] Exchanging code: ${code} for client: ${clientId}`);
        // Find interaction by code
        // Note: Prisma JSON path filtering can be sensitive in some environments.
        // We'll fetch active interactions and filter manually to be 100% sure.
        const activeInteractions = await this.prisma.interaction.findMany({
            where: {
                expiresAt: { gt: new Date() }
            }
        });

        const interaction = activeInteractions.find(i => (i.details as any)?.code === code);

        if (!interaction) {
            console.error(`[OIDC] Interaction not found for code: ${code}. Active interactions: ${activeInteractions.length}`);
            throw new BadRequestException('Invalid authorization code');
        }

        const details = interaction.details as any;
        if (details.clientId !== clientId) {
            throw new BadRequestException('Client mismatch');
        }

        // Generate Tokens
        const userId = details.userId;
        const tokens = await this.authService.generateTokens(userId);

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

    private async generateIdToken(userId: string, clientId: string, nonce?: string) {
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
            name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
        };
        return this.jwtService.sign(payload);
    }
}
