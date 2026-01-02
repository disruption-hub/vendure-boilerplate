'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';
import { deleteZKeyUserInVendure, syncZKeyUserInVendure, type VendureAdminConfig } from '@/lib/vendure-admin';

async function getVendureConfigForTenant(tenantId?: string | null): Promise<VendureAdminConfig | undefined> {
    if (!tenantId) return undefined;
    const apps = await prisma.application.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        select: { integrations: true },
        take: 25,
    });

    for (const app of apps) {
        const vendure = (app.integrations as any)?.vendure;
        if (vendure?.enabled) {
            return {
                adminApiUrl: vendure.adminApiUrl || undefined,
                authTokenHeader: vendure.authTokenHeader || undefined,
                adminApiToken: vendure.adminApiToken || undefined,
                superadminUsername: vendure.superadminUsername || undefined,
                superadminPassword: vendure.superadminPassword || undefined,
            };
        }
    }

    return undefined;
}

export async function getUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { deletedAt: null };

    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { primaryEmail: { contains: search, mode: 'insensitive' } },
            { walletAddress: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { tenant: true },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        data: users,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getTenants() {
    return prisma.tenant.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });
}

export async function createUser(data: {
    primaryEmail: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    walletAddress?: string;
    role?: string;
    tenantId?: string;
    password: string;
}) {
    // Allow reuse if the existing record is soft-deleted (we restore it)
    const where: any = {
        OR: [
            { primaryEmail: data.primaryEmail },
            ...(data.phoneNumber ? [{ phoneNumber: data.phoneNumber }] : []),
            ...(data.walletAddress ? [{ walletAddress: data.walletAddress }] : []),
        ],
        ...(data.tenantId ? { tenantId: data.tenantId } : {}),
    };

    const collision = await prisma.user.findFirst({ where, select: { id: true, deletedAt: true } });
    if (collision && !collision.deletedAt) {
        throw new Error('A user with this email, phone, or wallet already exists.');
    }

    const isRestoring = !!collision?.deletedAt;

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = collision?.deletedAt
        ? await prisma.user.update({
            where: { id: collision.id },
            data: {
                deletedAt: null,
                primaryEmail: data.primaryEmail,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                walletAddress: data.walletAddress || null,
                role: data.role || 'user',
                tenantId: data.tenantId,
                passwordHash,
                emailVerified: false,
                phoneVerified: false,
            },
        })
        : await prisma.user.create({
            data: {
                primaryEmail: data.primaryEmail,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                walletAddress: data.walletAddress || null,
                role: data.role || 'user',
                tenantId: data.tenantId,
                passwordHash,
                emailVerified: false,
                phoneVerified: false,
            },
        });

    try {
        const vendureConfig = await getVendureConfigForTenant(user.tenantId);
        if (vendureConfig) {
            await syncZKeyUserInVendure({
                id: user.id,
                email: user.primaryEmail || data.primaryEmail,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                walletAddress: user.walletAddress,
            }, vendureConfig);
        }
    } catch (e) {
        if (!isRestoring) {
            await prisma.user.delete({ where: { id: user.id } });
        }
        throw e;
    }

    revalidatePath('/users');
    return user;
}

export async function updateUser(id: string, data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    walletAddress?: string;
    role?: string;
}) {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new Error('User not found');
    if (!existing.primaryEmail) throw new Error('User is missing primaryEmail');

    const next = {
        firstName: data.firstName ?? existing.firstName,
        lastName: data.lastName ?? existing.lastName,
        phoneNumber: data.phoneNumber ?? existing.phoneNumber,
        walletAddress: data.walletAddress !== undefined ? (data.walletAddress || null) : existing.walletAddress,
        role: data.role ?? existing.role,
    };

    const vendureConfig = await getVendureConfigForTenant(existing.tenantId);
    if (vendureConfig) {
        await syncZKeyUserInVendure({
            id: existing.id,
            email: existing.primaryEmail,
            firstName: next.firstName,
            lastName: next.lastName,
            phoneNumber: next.phoneNumber,
            walletAddress: next.walletAddress,
        }, vendureConfig);
    }

    const user = await prisma.user.update({
        where: { id },
        data: {
            firstName: next.firstName,
            lastName: next.lastName,
            phoneNumber: next.phoneNumber,
            walletAddress: next.walletAddress,
            role: next.role,
        },
    });

    revalidatePath('/users');
    return user;
}

export async function deleteUser(id: string) {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new Error('User not found');

    const vendureConfig = await getVendureConfigForTenant(existing.tenantId);
    if (vendureConfig) {
        await deleteZKeyUserInVendure(existing.id, existing.primaryEmail || '', vendureConfig);
    }

    const user = await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    revalidatePath('/users');
    return user;
}

export async function verifyUser(id: string) {
    const userToVerify = await prisma.user.findUnique({ where: { id } });
    if (!userToVerify) throw new Error('User not found');

    if (userToVerify.deletedAt) {
        throw new Error('Cannot verify a deleted user');
    }

    if (userToVerify.emailVerified && userToVerify.phoneVerified) {
        return; // Already verified
    }

    // Block duplicates among active users
    const or: any[] = [];
    if (userToVerify.primaryEmail) or.push({ primaryEmail: userToVerify.primaryEmail });
    if (userToVerify.phoneNumber) or.push({ phoneNumber: userToVerify.phoneNumber });
    if (or.length) {
        const collision = await prisma.user.findFirst({
            where: {
                id: { not: id },
                tenantId: userToVerify.tenantId,
                deletedAt: null,
                OR: or,
            },
            select: { id: true },
        });
        if (collision) {
            throw new Error('Another user with this email or phone already exists in this tenant.');
        }
    }

    const user = await prisma.user.update({
        where: { id },
        data: {
            emailVerified: true,
            phoneVerified: !!userToVerify.phoneNumber // Verify phone if present
        },
    });

    revalidatePath('/users');
    return user;
}
