
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WhatsAppSession } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class WhatsAppSessionService {
    constructor(private readonly prisma: PrismaService) { }

    async findAllActive(): Promise<Partial<WhatsAppSession>[]> {
        return this.prisma.whatsAppSession.findMany({
            where: {
                NOT: {
                    sessionId: { startsWith: 'deleted-' },
                },
            },
        });
    }

    async findOne(sessionId: string): Promise<WhatsAppSession | null> {
        return this.prisma.whatsAppSession.findUnique({
            where: { sessionId },
        });
    }

    async create(sessionId: string, tenantId: string, name?: string) {
        return this.prisma.whatsAppSession.upsert({
            where: { sessionId },
            update: {
                status: 'CONNECTING',
                name: name || undefined,
                lastSync: new Date(),
            },
            create: {
                id: randomUUID(),
                sessionId,
                tenantId,
                name: name || `Session ${new Date().toLocaleString()}`,
                status: 'CONNECTING',
                creds: {},
                isActive: false,
                browserActive: false,
                lastSync: new Date(),
                updatedAt: new Date(),
            },
        });
    }

    async updateStatus(sessionId: string, status: string, errorMessage?: string | null, info?: { phoneNumber?: string; name?: string }) {
        if (status === 'CONNECTED') {
            return this.prisma.whatsAppSession.update({
                where: { sessionId },
                data: {
                    status: 'CONNECTED',
                    isActive: true,
                    lastConnected: new Date(),
                    errorMessage: null,
                    phoneNumber: info?.phoneNumber,
                    name: info?.name
                }
            })
        } else {
            return this.prisma.whatsAppSession.update({
                where: { sessionId },
                data: {
                    // Allow CONNECTING and QR_REQUIRED, otherwise force DISCONNECTED
                    // This fixes the bug where CONNECTING was being cast to DISCONNECTED, causing the worker to ignore the session
                    status: (status === 'QR_REQUIRED' || status === 'CONNECTING') ? status : 'DISCONNECTED',
                    errorMessage: errorMessage,
                    isActive: false
                }
            })
        }
    }
}
