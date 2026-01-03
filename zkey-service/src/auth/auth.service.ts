import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import * as StellarSdk from 'stellar-sdk';
import { NotificationsService } from '../notifications/notifications.service';
import { VendureSyncService } from '../users/vendure-sync.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private vendureSync: VendureSyncService,
  ) { }

  async register(
    email: string,
    firstName: string,
    lastName: string,
    phone: string,
    walletAddress?: string,
    signature?: string,
    tenantId?: string,
    clientIdOrInteractionId?: string,
  ) {
    let resolvedTenantId = tenantId?.trim() || null;

    if (!resolvedTenantId && clientIdOrInteractionId) {
      let clientId = clientIdOrInteractionId;

      const interaction = await this.prisma.interaction.findUnique({
        where: { id: clientIdOrInteractionId },
      });

      if (interaction && (interaction.details as any).clientId) {
        clientId = (interaction.details as any).clientId;
      }

      const application = await this.prisma.application.findUnique({
        where: { clientId },
      });

      resolvedTenantId = application?.tenantId || null;
    }

    if (!resolvedTenantId) {
      throw new BadRequestException(
        'tenantId (or interactionId/clientId) is required',
      );
    }

    const cleanEmail = email?.trim() || null;
    const cleanPhone = phone?.trim() || null;
    const cleanWallet = walletAddress?.trim() || null;

    let restoreUserId: string | null = null;

    if (cleanEmail) {
      const existing = await this.prisma.user.findFirst({
        where: { primaryEmail: cleanEmail, tenantId: resolvedTenantId },
        select: { id: true, deletedAt: true },
      });
      if (existing) {
        if (existing.deletedAt) restoreUserId = existing.id;
        else throw new ConflictException('This email is already registered. Please try another email or log in.');
      }
    }

    if (cleanPhone) {
      const existing = await this.prisma.user.findFirst({
        where: { phoneNumber: cleanPhone, tenantId: resolvedTenantId },
        select: { id: true, deletedAt: true },
      });
      if (existing) {
        if (existing.deletedAt) {
          if (restoreUserId && restoreUserId !== existing.id) {
            throw new ConflictException(
              'A different deleted user already exists with this phone number.',
            );
          }
          restoreUserId = existing.id;
        }
        else
          throw new ConflictException(
            'This phone number is already registered. Please try another phone number or log in.',
          );
      }
    }

    if (cleanWallet) {
      // 1. Verify Ownership if signature provided
      if (signature) {
        await this.verifyWalletSignature(cleanWallet, signature);
      } else {
        // Skip signature check only if it's explicitly allowed (e.g. legacy or trusted internal)
        // For public register, we should really enforce it.
        this.logger.warn(`User ${cleanEmail} registering with wallet ${cleanWallet} without signature.`);
      }

      const existingIdentity = await this.prisma.userIdentity.findUnique({
        where: {
          provider_providerId: {
            provider: 'stellar',
            providerId: cleanWallet,
          },
        },
        select: { id: true, userId: true },
      });
      if (existingIdentity) {
        const owner = await this.prisma.user.findUnique({
          where: { id: existingIdentity.userId },
          select: { id: true, deletedAt: true, tenantId: true },
        });
        if (
          owner &&
          owner.tenantId === resolvedTenantId &&
          owner.deletedAt
        ) {
          if (restoreUserId && restoreUserId !== owner.id) {
            throw new ConflictException(
              'A different deleted user already exists with this wallet address.',
            );
          }
          restoreUserId = owner.id;
        } else {
          throw new ConflictException(
            'This wallet address is already registered. Please try another wallet address or log in.',
          );
        }
      }

      const existingWallet = await this.prisma.user.findFirst({
        where: { walletAddress: cleanWallet },
        select: { id: true, deletedAt: true, tenantId: true },
      });
      if (existingWallet) {
        if (
          existingWallet.tenantId === resolvedTenantId &&
          existingWallet.deletedAt
        ) {
          if (restoreUserId && restoreUserId !== existingWallet.id) {
            throw new ConflictException(
              'A different deleted user already exists with this wallet address.',
            );
          }
          restoreUserId = existingWallet.id;
        } else {
          throw new ConflictException(
            'This wallet address is already registered. Please try another wallet address or log in.',
          );
        }
      }
    }

    const autoPassword = uuidv4();
    const passwordHash = await bcrypt.hash(autoPassword, 10);

    const user = restoreUserId
      ? await this.prisma.user.update({
        where: { id: restoreUserId },
        data: {
          deletedAt: null,
          primaryEmail: cleanEmail,
          firstName,
          lastName,
          phoneNumber: cleanPhone,
          walletAddress: cleanWallet,
          passwordHash,
          emailVerified: false,
          phoneVerified: false,
          tenantId: resolvedTenantId,
        },
      })
      : await this.prisma.user.create({
        data: {
          primaryEmail: cleanEmail,
          firstName,
          lastName,
          phoneNumber: cleanPhone,
          walletAddress: cleanWallet,
          passwordHash,
          emailVerified: false,
          phoneVerified: false,
          tenantId: resolvedTenantId,

          ...(cleanWallet
            ? {
              identities: {
                create: {
                  provider: 'stellar',
                  providerId: cleanWallet,
                },
              },
            }
            : {}),
        } as any,
      });

    if (restoreUserId && cleanWallet) {
      const identity = await this.prisma.userIdentity.findUnique({
        where: {
          provider_providerId: { provider: 'stellar', providerId: cleanWallet },
        },
        select: { id: true, userId: true },
      });
      if (!identity) {
        await this.prisma.userIdentity.create({
          data: {
            userId: user.id,
            provider: 'stellar',
            providerId: cleanWallet,
          },
        });
      }
    }

    try {
      if (this.vendureSync) {
        await this.vendureSync.syncUser(user);
      }
    } catch (error) {
      this.logger.error(`Failed to sync registered user to Vendure: ${error}`);
    }

    return {
      userId: user.id,
      ...(await this.generateTokens(user.id)),
    };
  }

  async login(
    email: string,
    password: string,
    tenantId?: string,
    clientIdOrInteractionId?: string,
  ) {
    let resolvedTenantId = tenantId?.trim() || null;

    if (!resolvedTenantId && clientIdOrInteractionId) {
      let clientId = clientIdOrInteractionId;

      const interaction = await this.prisma.interaction.findUnique({
        where: { id: clientIdOrInteractionId },
      });

      if (interaction && (interaction.details as any).clientId) {
        clientId = (interaction.details as any).clientId;
      }

      const application = await this.prisma.application.findUnique({
        where: { clientId },
      });

      resolvedTenantId = application?.tenantId || null;
    }

    if (!resolvedTenantId) {
      throw new BadRequestException(
        'tenantId (or interactionId/clientId) is required',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { primaryEmail: email, tenantId: resolvedTenantId, deletedAt: null },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Require either email or phone to be verified before allowing login
    if (!user.emailVerified && !user.phoneVerified) {
      throw new UnauthorizedException(
        'Please verify your email or phone number before logging in. Check your inbox for the verification code.',
      );
    }

    return await this.generateTokens(user.id);
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        primaryEmail: true,
        emailVerified: true,
        phoneNumber: true,
        phone: true,
        phoneVerified: true,
        walletAddress: true,
        avatar: true,
        tenantId: true,
      },
    });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; walletAddress?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName !== undefined ? data.firstName : user.firstName,
        lastName: data.lastName !== undefined ? data.lastName : user.lastName,
        phone: data.phone !== undefined ? data.phone : user.phone,
        phoneNumber: data.phone !== undefined ? data.phone : user.phoneNumber, // Sync both fields
        walletAddress: data.walletAddress !== undefined ? data.walletAddress : user.walletAddress,
      },
    });

    this.logger.log(`[AuthService] Profile updated for user ${userId}. Triggering Vendure sync...`);

    // Sync to Vendure
    try {
      if (this.vendureSync) {
        await this.vendureSync.syncUser(updatedUser);
      }
    } catch (error) {
      this.logger.error(`Failed to sync updated profile to Vendure: ${error.message}`);
    }

    return this.validateUser(userId);
  }

  // --- OTP Logic ---

  async requestOtp(
    identifier: string,
    type: 'email' | 'phone',
    clientIdOrInteractionId: string,
  ) {
    if (type !== 'email' && type !== 'phone') {
      throw new BadRequestException('Invalid OTP type. Must be "email" or "phone".');
    }

    let clientId = clientIdOrInteractionId;

    // Try to find if it's an interactionId first
    const interaction = await this.prisma.interaction.findUnique({
      where: { id: clientIdOrInteractionId },
    });

    if (interaction && (interaction.details as any).clientId) {
      clientId = (interaction.details as any).clientId;
    }

    const application = await this.prisma.application.findUnique({
      where: { clientId },
      include: { tenant: true },
    });

    if (!application) {
      throw new Error(`Application not found for ID: ${clientId}`);
    }

    // Check if user exists with this identifier in the application's tenant
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: application.tenantId,
        OR: [
          { primaryEmail: identifier },
          { phoneNumber: identifier },
          { phone: identifier },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.interaction.create({
      data: {
        expiresAt,
        details: {
          type: 'otp',
          identifier,
          method: type,
          code,
          clientId,
        },
      },
    });

    const otpMessage = `Your ${application.name} verification code is: ${code}. It expires in 5 minutes.`;

    const appIntegrations = (application.integrations as any) || {};
    const tenantIntegrations = (application.tenant.integrations as any) || {};

    if (type === 'email') {
      const apiKey =
        appIntegrations.brevoApiKey || tenantIntegrations.brevoApiKey;
      const senderEmail =
        appIntegrations.brevoSenderEmail || tenantIntegrations.brevoSenderEmail;
      const senderName =
        appIntegrations.brevoSenderName || tenantIntegrations.brevoSenderName;

      if (!apiKey || !senderEmail) {
        this.logger.error(
          `Brevo credentials missing for app ${application.name} or tenant ${application.tenant.name}`,
        );
        return {
          success: true,
          message: `OTP: ${code} (Provider credentials missing)`,
        };
      }

      await this.notificationsService.sendEmail({
        to: identifier,
        subject: `${application.name} Verification Code`,
        text: otpMessage,
        apiKey,
        senderEmail,
        senderName: senderName || 'ZKey',
      });
    } else {
      const labsmobileUser =
        appIntegrations.labsmobileUser || tenantIntegrations.labsmobileUser;
      const labsmobileApiKey =
        appIntegrations.labsmobileApiKey || tenantIntegrations.labsmobileApiKey;
      const labsmobileSenderId =
        appIntegrations.labsmobileSenderId || tenantIntegrations.labsmobileSenderId;

      if (!labsmobileUser || !labsmobileApiKey) {
        this.logger.error(
          `LabsMobile credentials missing for app ${application.name} or tenant ${application.tenant.name}`,
        );
        return {
          success: true,
          message: `OTP: ${code} (Provider credentials missing)`,
        };
      }

      await this.notificationsService.sendSms({
        to: identifier,
        text: otpMessage,
        user: labsmobileUser,
        apiKey: labsmobileApiKey,
        senderId: labsmobileSenderId,
      });
    }

    return { success: true };
  }

  async verifyOtp(identifier: string, code: string) {
    // Find interaction specifically for this identifier and code
    // This prevents race conditions where we might pick up someone else's OTP or an old one
    const interaction = await this.prisma.interaction.findFirst({
      where: {
        expiresAt: { gt: new Date() },
        details: {
          path: ['type'],
          equals: 'otp',
        },
        AND: [
          {
            details: {
              path: ['identifier'],
              equals: identifier,
            },
          },
          {
            details: {
              path: ['code'],
              equals: code,
            },
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!interaction) {
      throw new Error('Invalid or expired code');
    }

    const clientId = (interaction.details as any).clientId;
    const app = clientId
      ? await this.prisma.application.findUnique({
        where: { clientId },
        include: { tenant: true },
      })
      : null;
    const method = (interaction.details as any).method; // 'email' or 'phone'

    // 1. Check for an EXISTING VERIFIED user first.
    // If one exists, we prioritize them and do NOT verify any pending users.
    const verifiedUser = await this.prisma.user.findFirst({
      where: {
        tenantId: app?.tenantId,
        deletedAt: null,
        OR: [
          { primaryEmail: identifier, emailVerified: true },
          { phoneNumber: identifier, phoneVerified: true },
        ],
      },
    });

    if (verifiedUser) {
      return this.generateTokens(verifiedUser.id, app);
    }

    // 2. Find pending user to verify (pick most recent)
    let user = await this.prisma.user.findFirst({
      where: {
        tenantId: app?.tenantId,
        deletedAt: null,
        OR: [{ primaryEmail: identifier }, { phoneNumber: identifier }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!user) {
      if (!app)
        throw new Error('Cannot create user without application context');

      const deleted = await this.prisma.user.findFirst({
        where: {
          tenantId: app.tenantId,
          deletedAt: { not: null },
          OR: [{ primaryEmail: identifier }, { phoneNumber: identifier }],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (deleted) {
        user = await this.prisma.user.update({
          where: { id: deleted.id },
          data: {
            deletedAt: null,
            emailVerified: method === 'email' ? true : deleted.emailVerified,
            phoneVerified: method === 'phone' ? true : deleted.phoneVerified,
          },
        });
      } else {
        // Implicit registration
        user = await this.prisma.user.create({
          data: {
            primaryEmail: method === 'email' ? identifier : null,
            phoneNumber: method === 'phone' ? identifier : null,
            emailVerified: method === 'email',
            phoneVerified: method === 'phone',
            firstName: 'New',
            lastName: 'User',
            tenantId: app.tenantId,
          },
        });
      }
    } else {
      // Mark pending user as verified
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: method === 'email' ? true : user.emailVerified,
          phoneVerified: method === 'phone' ? true : user.phoneVerified,
        },
      });
    }

    // Sync verification status to Vendure
    try {
      if (this.vendureSync) {
        await this.vendureSync.syncUser(user);
      }
    } catch (error) {
      this.logger.error(`Failed to sync verified user to Vendure: ${error}`);
    }

    return this.generateTokens(user.id, app);
  }

  // --- Wallet Logic ---

  async getWalletNonce(address: string) {
    const nonce = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.interaction.create({
      data: {
        expiresAt,
        details: {
          type: 'wallet_challenge',
          address,
          nonce,
        },
      },
    });

    return { nonce };
  }

  async loginWithWallet(address: string, signature: string) {
    await this.verifyWalletSignature(address, signature);

    // Require an existing user for wallet login (no implicit registration)
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { walletAddress: address },
          {
            identities: {
              some: {
                provider: 'stellar',
                providerId: address,
              },
            },
          },
        ],
      },
      select: { id: true, walletAddress: true, tenantId: true },
    });

    if (!user) {
      throw new NotFoundException(
        'No user is registered for this wallet address. Please register first.',
      );
    }

    if (!user.tenantId) {
      throw new BadRequestException(
        'This wallet user is missing tenant assignment. Please register through a client/tenant flow.',
      );
    }

    // Backfill walletAddress for legacy users registered via identities only
    if (!user.walletAddress) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { walletAddress: address },
      });

      // Fetch updated user for sync
      const updatedUser = await this.prisma.user.findUnique({ where: { id: user.id } });
      try {
        if (this.vendureSync && updatedUser) {
          await this.vendureSync.syncUser(updatedUser);
        }
      } catch (error) {
        this.logger.error(`Failed to sync wallet backfill to Vendure: ${error}`);
      }
    }

    // Fetch full user to check verification status
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true, phoneVerified: true },
    });

    // Require either email or phone to be verified before allowing wallet login
    if (fullUser && !fullUser.emailVerified && !fullUser.phoneVerified) {
      throw new UnauthorizedException(
        'Please verify your email or phone number before logging in. Check your inbox for the verification code.',
      );
    }

    return this.generateTokens(user.id);
  }

  private async verifyWalletSignature(address: string, signature: string) {
    const interaction = await this.prisma.interaction.findFirst({
      where: {
        expiresAt: { gt: new Date() },
        AND: [
          {
            details: {
              path: ['type'],
              equals: 'wallet_challenge',
            },
          },
          {
            details: {
              path: ['address'],
              equals: address,
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!interaction) {
      throw new BadRequestException(
        'Challenge not found for this address. Please request a new nonce.'
      );
    }

    if ((interaction.details as Record<string, any>).address !== address) {
      throw new BadRequestException(
        'Challenge address mismatch. Please request a new nonce.'
      );
    }

    const nonce = (interaction.details as Record<string, any>).nonce as string;

    // Verify signature
    try {
      const keypair = StellarSdk.Keypair.fromPublicKey(address);
      const SIGN_MESSAGE_PREFIX = 'Stellar Signed Message:\n';
      const messageHash = createHash('sha256')
        .update(SIGN_MESSAGE_PREFIX + nonce)
        .digest();
      const isValid = keypair.verify(
        messageHash,
        Buffer.from(signature, 'base64'),
      );
      if (!isValid) throw new UnauthorizedException('Invalid wallet signature');
    } catch (error) {
      throw new UnauthorizedException(
        `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Let the challenge expire naturally instead of deleting it
    // This allows retries if registration/login fails after signature verification
  }

  async unlinkWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, walletAddress: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const walletAddress = user.walletAddress;
    if (!walletAddress) {
      return { success: true };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { walletAddress: null },
    });

    this.logger.log(`Unlinked wallet for user ${userId}. Profile: ${JSON.stringify({
      email: updatedUser.primaryEmail,
      wallet: updatedUser.walletAddress,
      vendureId: updatedUser.vendureId
    })}`);

    await this.prisma.userIdentity.deleteMany({
      where: {
        provider: 'stellar',
        providerId: walletAddress,
      },
    });

    try {
      if (this.vendureSync) {
        this.logger.log(`Triggering Vendure sync for user ${userId} after wallet unlink...`);
        await this.vendureSync.syncUser(updatedUser);
      } else {
        this.logger.warn(`VendureSyncService not available in AuthService`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync wallet unlink to Vendure: ${error}`);
      // Non-blocking error
    }

    return { success: true };
  }

  async generateTokens(userId: string, app?: any) {
    const accessToken = this.jwtService.sign({ sub: userId });

    const ttlDays = app?.refreshTokenTtl || 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    // 1. Create UserSession (SSO session)
    // For now, we create a new session for each login, but we could reuse if preferred.
    const session = await this.prisma.userSession.create({
      data: {
        userId,
        tenantId:
          app?.tenantId ||
          ((await this.prisma.user.findUnique({ where: { id: userId } }))
            ?.tenantId as string),
        sid: uuidv4(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h session
      },
    });

    // 2. Generate refresh token (linked to sid)
    const refreshToken = this.jwtService.sign(
      { sub: userId, clientId: app?.clientId, sid: session.sid },
      { expiresIn: `${ttlDays}d` },
    );

    // 3. Store refresh token hash
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        clientId: app?.clientId || null,
        sessionId: session.id,
        tokenHash,
        scopes: [],
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { sub: userId, clientId } = payload;

    // Find token in DB
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId, clientId },
    });

    let matchedToken = null;
    for (const token of storedTokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken || matchedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    const app = clientId
      ? await this.prisma.application.findUnique({ where: { clientId } })
      : null;

    // Handle rotation or cleanup
    const shouldRotate = app ? app.rotateRefreshToken : false;

    if (shouldRotate) {
      // Rotation logic: issue new tokens and delete old one
      await this.prisma.refreshToken.delete({ where: { id: matchedToken.id } });
      return this.generateTokens(userId, app);
    } else {
      // No rotation: just issue new access token
      const accessToken = this.jwtService.sign({ sub: userId });
      return {
        accessToken,
        refreshToken, // Return same refresh token
      };
    }
  }
}
