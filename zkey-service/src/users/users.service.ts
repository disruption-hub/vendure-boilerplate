import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { VendureSyncService } from './vendure-sync.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private vendureSync: VendureSyncService,
  ) { }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { primaryEmail: { contains: search, mode: 'insensitive' as any } },
          { firstName: { contains: search, mode: 'insensitive' as any } },
          { lastName: { contains: search, mode: 'insensitive' as any } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          primaryEmail: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          emailVerified: true,
          walletAddress: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => ({ ...user, isVerified: user.emailVerified })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        primaryEmail: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { ...user, isVerified: user.emailVerified };
  }

  async create(
    data: {
      primaryEmail: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
      walletAddress?: string;
      password: string;
    },
    tenantId: string,
  ) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { primaryEmail: data.primaryEmail, tenantId },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        primaryEmail: data.primaryEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        walletAddress: data.walletAddress,
        role: data.role || 'user',
        passwordHash,
        tenantId,
        emailVerified: false,
      },
      select: {
        id: true,
        primaryEmail: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    this.logger.log(`[UsersService] Created user in ZKey: ID=${user.id}, Wallet=${user.walletAddress}`);

    // Proactive sync to Vendure
    await this.vendureSync.syncUser(user);

    return { ...user, isVerified: user.emailVerified };
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
      walletAddress?: string;
    },
    tenantId: string,
  ) {
    // Verify user exists and belongs to tenant
    await this.findOne(id, tenantId);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        walletAddress: data.walletAddress,
        role: data.role,
      },
      select: {
        id: true,
        primaryEmail: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        walletAddress: true,
        updatedAt: true,
      },
    });

    this.logger.log(`[UsersService] Updated user in ZKey: ID=${user.id}, Wallet=${user.walletAddress}`);

    // Proactive sync to Vendure
    await this.vendureSync.syncUser(user);

    return { ...user, isVerified: user.emailVerified };
  }

  async remove(id: string, tenantId: string) {
    // Verify user exists and belongs to tenant
    await this.findOne(id, tenantId);

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'User deleted successfully' };
  }
}
