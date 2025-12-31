import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as StellarSdk from 'stellar-sdk';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) { }

  async register(email: string, firstName: string, lastName: string, phone: string) {
    // Check for existing user (only by email and phone since names aren't unique identifiers)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ primaryEmail: email }, { phoneNumber: phone }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists.');
    }

    const autoPassword = uuidv4();
    const passwordHash = await bcrypt.hash(autoPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        primaryEmail: email,
        firstName,
        lastName,
        phoneNumber: phone,
        passwordHash,
        emailVerified: false,
        phoneVerified: false,
      } as any,
    });

    return {
      userId: user.id,
      ...(await this.generateTokens(user.id)),
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { primaryEmail: email },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
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
        phoneVerified: true,
        avatar: true,
      },
    });
  }

  // --- OTP Logic ---

  async requestOtp(
    identifier: string,
    type: 'email' | 'phone',
    clientIdOrInteractionId: string,
  ) {
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

    // Check if user exists with this identifier
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ primaryEmail: identifier }, { phoneNumber: identifier }],
      },
    });

    if (!user) {
      throw new NotFoundException(`User with identifier ${identifier} not found. Please register first.`);
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
        },
      },
    });

    const otpMessage = `Your ZKey verification code is: ${code}. It expires in 5 minutes.`;

    if (type === 'email') {
      const apiKey = application.brevoApiKey || application.tenant.brevoApiKey;
      const senderEmail =
        application.brevoSenderEmail || application.tenant.brevoSenderEmail;
      const senderName =
        application.brevoSenderName || application.tenant.brevoSenderName;

      if (!apiKey || !senderEmail) {
        this.logger.error(
          `Brevo credentials missing for app ${application.name} or tenant ${application.tenant.name}`,
        );
        return {
          success: true,
          message: 'OTP logged to console (Provider credentials missing)',
        };
      }

      await this.notificationsService.sendEmail({
        to: identifier,
        subject: 'Your Verification Code',
        text: otpMessage,
        apiKey,
        senderEmail,
        senderName: senderName || 'ZKey Auth',
      });
    } else {
      const apiKey =
        application.labsmobileApiKey || application.tenant.labsmobileApiKey;
      const user =
        application.labsmobileUser || application.tenant.labsmobileUser;
      const url = application.labsmobileUrl || application.tenant.labsmobileUrl;
      const senderId =
        application.labsmobileSenderId || application.tenant.labsmobileSenderId;

      if (!apiKey || !user) {
        this.logger.error(
          `LabsMobile credentials missing for app ${application.name} or tenant ${application.tenant.name}`,
        );
        return {
          success: true,
          message: 'OTP logged to console (Provider credentials missing)',
        };
      }

      await this.notificationsService.sendSms({
        to: identifier,
        text: otpMessage,
        apiKey,
        user,
        url: url || undefined,
        senderId: senderId || undefined,
      });
    }

    return { success: true, message: 'OTP sent successfully' };
  }

  async verifyOtp(identifier: string, code: string) {
    const interaction = await this.prisma.interaction.findFirst({
      where: {
        expiresAt: { gt: new Date() },
        details: {
          path: ['type'],
          equals: 'otp',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Manual check since Prisma JSON filtering can be tricky depending on version/setup
    if (
      !interaction ||
      (interaction.details as Record<string, any>).code !== code ||
      (interaction.details as Record<string, any>).identifier !== identifier
    ) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark interaction as used (delete it)
    await this.prisma.interaction.delete({ where: { id: interaction.id } });

    // Find or create user
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ primaryEmail: identifier }, { phoneNumber: identifier }],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          primaryEmail: identifier.includes('@') ? identifier : null,
          phoneNumber: identifier.includes('@') ? null : identifier,
          emailVerified: identifier.includes('@'),
          phoneVerified: !identifier.includes('@'),
        },
      });
    }

    return this.generateTokens(user.id);
  }

  // --- Wallet Logic ---

  async getWalletNonce(address: string) {
    const nonce = uuidv4();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

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
    const interaction = await this.prisma.interaction.findFirst({
      where: {
        expiresAt: { gt: new Date() },
        details: {
          path: ['type'],
          equals: 'wallet_challenge',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      !interaction ||
      (interaction.details as Record<string, any>).address !== address
    ) {
      throw new Error('Challenge expired or not found');
    }

    const nonce = (interaction.details as Record<string, any>).nonce as string;

    // Verify signature
    try {
      const keypair = StellarSdk.Keypair.fromPublicKey(address);
      const isValid = keypair.verify(
        Buffer.from(nonce),
        Buffer.from(signature, 'base64'),
      );
      if (!isValid) throw new Error('Invalid signature');
    } catch (error) {
      throw new Error(
        `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Mark interaction as used
    await this.prisma.interaction.delete({ where: { id: interaction.id } });

    // Find or create user with this identity
    let user = await this.prisma.user.findFirst({
      where: {
        identities: {
          some: {
            provider: 'stellar',
            providerId: address,
          },
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          identities: {
            create: {
              provider: 'stellar',
              providerId: address,
              profileResult: { address },
            },
          },
        },
      });
    }

    return this.generateTokens(user.id);
  }

  async generateTokens(userId: string) {
    const accessToken = this.jwtService.sign({ sub: userId });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '7d' },
    );

    // Store refresh token hash
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        scopes: [],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
