import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatbotThemeService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.chatbotTheme.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findActive(tenantId: string) {
        return this.prisma.chatbotTheme.findFirst({
            where: {
                tenantId,
                isActive: true,
            },
        });
    }

    async create(tenantId: string, data: { name: string; colors: any; isActive?: boolean }) {
        // If setting as active, deactivate others
        if (data.isActive) {
            await this.prisma.chatbotTheme.updateMany({
                where: { tenantId },
                data: { isActive: false },
            });
        }

        return this.prisma.chatbotTheme.create({
            data: {
                tenantId,
                name: data.name,
                colors: data.colors,
                isActive: data.isActive || false,
            },
        });
    }

    async update(id: string, tenantId: string, data: { name?: string; colors?: any }) {
        return this.prisma.chatbotTheme.update({
            where: { id, tenantId }, // Ensure tenant owns it
            data,
        });
    }

    async setActive(id: string, tenantId: string) {
        // Transaction to deactivate others and activate this one
        return this.prisma.$transaction(async (tx) => {
            await tx.chatbotTheme.updateMany({
                where: { tenantId },
                data: { isActive: false },
            });

            return tx.chatbotTheme.update({
                where: { id, tenantId },
                data: { isActive: true },
            });
        });
    }

    async remove(id: string, tenantId: string) {
        return this.prisma.chatbotTheme.delete({
            where: { id, tenantId },
        });
    }
}
