import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('admin/whatsapp')
export class AdminWhatsAppController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('sessions')
    async getSessions(@Query('sessionId') sessionId?: string) {
        try {
            if (sessionId) {
                // Get specific session
                const session = await this.prisma.whatsAppSession.findUnique({
                    where: { sessionId },
                    select: {
                        id: true,
                        sessionId: true,
                        tenantId: true,
                        name: true,
                        phoneNumber: true,
                        status: true,
                        isActive: true,
                        browserActive: true,
                        lastSync: true,
                        lastConnected: true,
                        errorMessage: true,
                        metadata: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                });

                return session ? { sessions: [session] } : { sessions: [] };
            }

            // Get all sessions
            const sessions = await this.prisma.whatsAppSession.findMany({
                select: {
                    id: true,
                    sessionId: true,
                    tenantId: true,
                    name: true,
                    phoneNumber: true,
                    status: true,
                    isActive: true,
                    browserActive: true,
                    lastSync: true,
                    lastConnected: true,
                    errorMessage: true,
                    metadata: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return { sessions };
        } catch (error) {
            console.error('[AdminWhatsAppController] Failed to fetch sessions:', error);
            throw error;
        }
    }
}
