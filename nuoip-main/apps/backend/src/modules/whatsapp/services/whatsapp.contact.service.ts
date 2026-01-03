
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WhatsAppContactSessionStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { WhatsAppSummaryService } from './whatsapp.summary.service';

@Injectable()
export class WhatsAppContactService {
    private readonly logger = new Logger(WhatsAppContactService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly summaryService: WhatsAppSummaryService
    ) { }

    private async resolveContactId(id: string): Promise<string> {
        const direct = await this.prisma.whatsAppContact.findUnique({ where: { id }, select: { id: true } });
        if (direct) return direct.id;

        const linked = await this.prisma.whatsAppContact.findFirst({ where: { chatbotContactId: id }, select: { id: true } });
        if (linked) return linked.id;

        throw new Error(`Contact ${id} not found`);
    }

    async findOne(id: string) {
        return this.prisma.whatsAppContact.findUnique({
            where: { id },
            include: { users: true }
        });
    }

    async openSession(inputInfo: string, startedAt?: Date, userId?: string) {
        const id = await this.resolveContactId(inputInfo);

        // Log "Session Started" activity for visualization
        const contact = await this.prisma.whatsAppContact.findUnique({
            where: { id },
            select: { tenantId: true, userId: true, sessionStatus: true }
        });

        if (contact && contact.sessionStatus === 'OPEN') {
            this.logger.log(`[OpenSession] Session already open for contact ${id}, skipping activity creation`);
            return this.prisma.whatsAppContact.findUnique({ where: { id } });
        }

        if (contact) {
            await this.prisma.crmActivity.create({
                data: {
                    id: crypto.randomUUID(),
                    tenantId: contact.tenantId,
                    contactId: id,
                    type: 'note',
                    text: 'Session started',
                    detail: 'Session opened',
                    metadata: { type: 'session_start' },
                    createdById: userId || 'system',
                    createdAt: startedAt || new Date()
                }
            });
        }

        // 🔧 Use updateMany for safety
        await this.prisma.whatsAppContact.updateMany({
            where: { id },
            data: {
                sessionStatus: 'OPEN',
                sessionStartedAt: startedAt || new Date(),
            }
        });

        return this.prisma.whatsAppContact.findUnique({ where: { id } });
    }

    async previewSessionSummary(inputInfo: string) {
        try {
            const id = await this.resolveContactId(inputInfo);
            this.logger.log(`[PreviewSessionSummary] Generating for resolved contact ${id} (input: ${inputInfo})`);
            const contact = await this.prisma.whatsAppContact.findUnique({
                where: { id },
                select: { tenantId: true, name: true, userId: true, sessionId: true, sessionStartedAt: true, jid: true }
            });

            if (!contact) {
                this.logger.error(`[PreviewSessionSummary] Contact ${id} not found`);
                throw new Error('Contact not found');
            }

            // Log full contact data for debugging
            this.logger.log(`[PreviewSessionSummary] Contact data: ${JSON.stringify({
                tenantId: contact.tenantId,
                name: contact.name,
                jid: contact.jid,
                sessionId: contact.sessionId,
                sessionStartedAt: contact.sessionStartedAt
            })}`);

            // Determine time range for AI context
            const endTime = new Date();
            // Default to 7 days ago if no session start time, OR ensure at least 24h context if session started recently
            let startTime = contact.sessionStartedAt || new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);

            // If session started less than 24h ago, force 24h lookback to capture context triggering the session
            if (endTime.getTime() - startTime.getTime() < 24 * 60 * 60 * 1000) {
                startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
            }

            this.logger.log(`[PreviewSessionSummary] Time range: ${startTime.toISOString()} - ${endTime.toISOString()}`);

            // Query by remoteJid only - sessionId matching is unreliable due to session rotations
            // The remoteJid (phone number / group ID) is the most reliable identifier
            const whereClause: any = {
                timestamp: { gte: startTime, lte: endTime }
            };

            // Add sessionId for proper scoping to the tenant's WhatsApp session
            if (contact.sessionId) {
                whereClause.sessionId = contact.sessionId;
            }

            if (contact.jid) {
                whereClause.remoteJid = contact.jid;
                this.logger.log(`[PreviewSessionSummary] Querying messages with sessionId: ${contact.sessionId}, remoteJid: ${contact.jid}`);
            } else {
                // Fallback: try to match by phone number pattern
                const phoneMatch = contact.name?.replace(/\D/g, '');
                if (phoneMatch && phoneMatch.length >= 8) {
                    whereClause.remoteJid = { contains: phoneMatch };
                    this.logger.log(`[PreviewSessionSummary] Querying messages with phone pattern: ${phoneMatch}`);
                } else {
                    this.logger.warn('[PreviewSessionSummary] No jid or phone number to query messages');
                    return {
                        summary: 'No se encontraron mensajes para generar resumen.',
                        topics: [],
                        interactionType: 'Otro',
                        sentiment: 'neutral'
                    };
                }
            }

            let messages = await this.prisma.whatsAppMessage.findMany({
                where: whereClause,
                orderBy: { timestamp: 'asc' },
                take: 200  // Limit to last 200 messages for performance
            });

            // If no messages found with sessionId, try without sessionId constraint
            if (messages.length === 0 && contact.sessionId) {
                this.logger.log('[PreviewSessionSummary] No messages with sessionId, trying without sessionId constraint');
                delete whereClause.sessionId;
                messages = await this.prisma.whatsAppMessage.findMany({
                    where: whereClause,
                    orderBy: { timestamp: 'asc' },
                    take: 200
                });
            }

            this.logger.log(`[PreviewSessionSummary] Found ${messages.length} messages.`);

            if (messages.length === 0) {
                this.logger.warn('[PreviewSessionSummary] No messages found for context.');
            }

            const conversationText = messages.map(m => `${m.fromMe ? 'Agent' : 'Customer'}: ${m.content}`).join('\n');

            // Generate AI Summary
            let aiResult = null;
            if (conversationText) {
                aiResult = await this.summaryService.generateSummary(conversationText);
            } else {
                this.logger.warn('[PreviewSessionSummary] Empty conversation text, skipping AI.');
            }

            return {
                summary: aiResult?.summary || 'Sin resumen generado.',
                topics: aiResult?.topics || [],
                interactionType: aiResult?.interactionType || 'Otro',
                sentiment: aiResult?.sentiment || 'neutral'
            };

        } catch (error) {
            this.logger.error(`[PreviewSessionSummary] Failed: ${error.message}`, error.stack);
            throw new HttpException(`Failed to generate summary: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async closeSession(inputInfo: string, data?: {
        annotation?: string
        interactionType?: string
        needsFollowUp?: boolean
        followUpDate?: string
        userId?: string
    }) {
        try {
            const id = await this.resolveContactId(inputInfo);
            const contact = await this.prisma.whatsAppContact.findUnique({
                where: { id },
                select: { id: true, tenantId: true, name: true, userId: true, sessionId: true, sessionStartedAt: true, jid: true }
            });

            if (!contact) {
                this.logger.error(`[CloseSession] Contact ${id} (resolved from ${inputInfo}) not found in DB`);
                throw new Error('Contact not found');
            }

            // Determine time range for AI context
            const endTime = new Date();
            let startTime = contact.sessionStartedAt || new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);

            // If session started less than 24h ago, force 24h lookback to capture context triggering the session
            if (endTime.getTime() - startTime.getTime() < 24 * 60 * 60 * 1000) {
                startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
            }

            // Query by remoteJid only - sessionId matching is unreliable due to session rotations
            const whereClause: any = {
                timestamp: { gte: startTime, lte: endTime }
            };

            if (contact.jid) {
                whereClause.remoteJid = contact.jid;
            } else {
                const phoneMatch = contact.name?.replace(/\D/g, '');
                if (phoneMatch && phoneMatch.length >= 8) {
                    whereClause.remoteJid = { contains: phoneMatch };
                }
            }

            const messages = await this.prisma.whatsAppMessage.findMany({
                where: whereClause,
                orderBy: { timestamp: 'asc' },
                take: 200
            }).catch(e => {
                this.logger.warn(`Failed to fetch messages for summary: ${e.message}`);
                return [];
            });

            const conversationText = messages.map(m => `${m.fromMe ? 'Agent' : 'Customer'}: ${m.content}`).join('\n');

            // Generate AI Summary
            let aiResult = null;
            if (conversationText) {
                aiResult = await this.summaryService.generateSummary(conversationText);
            }

            // Prepare Summary Data
            const summaryText = aiResult?.summary || data?.annotation || 'Sesión finalizada (Sin resumen)';
            const topics = aiResult?.topics?.length ? aiResult.topics : (data?.interactionType ? [data.interactionType] : []);
            const interactionType = aiResult?.interactionType || data?.interactionType;
            const sentiment = aiResult?.sentiment;

            await this.prisma.crmSessionSummary.create({
                data: {
                    id: crypto.randomUUID(),
                    tenantId: contact.tenantId,
                    contactId: id,
                    clientName: contact.name,
                    date: endTime,
                    duration: contact.sessionStartedAt ?
                        Math.round((endTime.getTime() - contact.sessionStartedAt.getTime()) / 60000).toString() + ' min'
                        : undefined,
                    summary: summaryText,
                    topics: topics,
                    sentiment: sentiment,
                    aiInsights: sentiment ? `Sentiment: ${sentiment}` : null,
                    followUpDate: data?.followUpDate ? new Date(data.followUpDate) : null,
                    createdById: data?.userId || contact.userId || 'system',
                    updatedAt: new Date(),
                }
            });

            // 🔧 Use updateMany for safety
            await this.prisma.whatsAppContact.updateMany({
                where: { id },
                data: {
                    sessionStatus: 'CLOSED',
                    lastSessionClosedAt: new Date(),
                }
            });

            return this.prisma.whatsAppContact.findUnique({ where: { id } });
        } catch (error) {
            this.logger.error(`Failed to close session for contact input ${inputInfo}`, error);
            throw new HttpException(`Failed to close session: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async assignContact(inputInfo: string, userId: string) {
        const id = await this.resolveContactId(inputInfo);
        const contact = await this.prisma.whatsAppContact.findUnique({
            where: { id },
            select: { userId: true, tenantId: true }
        });

        const oldUserId = contact?.userId;

        // 🔧 Use updateMany for safety
        await this.prisma.whatsAppContact.updateMany({
            where: { id },
            data: { userId }
        });

        // Log transfer if ownership changed
        if (oldUserId && oldUserId !== userId) {
            await this.prisma.crmActivity.create({
                data: {
                    id: crypto.randomUUID(),
                    tenantId: contact.tenantId,
                    contactId: id,
                    type: 'note',
                    text: 'Session transferred',
                    detail: 'Agent assignment changed',
                    metadata: { type: 'transfer', from: oldUserId, to: userId },
                    createdById: 'system',
                    createdAt: new Date()
                }
            });
        }
    }

    async getContactSessions(inputInfo: string) {
        const contactId = await this.resolveContactId(inputInfo);
        const sessions = await this.prisma.crmSessionSummary.findMany({
            where: { contactId },
            orderBy: { date: 'desc' }
        });

        const activities = await this.prisma.crmActivity.findMany({
            where: {
                contactId,
                type: 'note',
                createdAt: {
                    gte: sessions.length > 0 ? sessions[sessions.length - 1].date : undefined
                }
            },
            select: { id: true, metadata: true, createdAt: true }
        });

        // Collect all user IDs
        const userIds = new Set<string>();
        sessions.forEach(s => s.createdById && userIds.add(s.createdById));

        activities.forEach(a => {
            const meta = a.metadata as any;
            if (meta?.type === 'transfer') {
                if (meta.from) userIds.add(meta.from);
                if (meta.to) userIds.add(meta.to);
            }
        });

        const users = await this.prisma.user.findMany({
            where: { id: { in: [...userIds] } },
            select: { id: true, name: true, email: true }
        });

        const userMap = new Map(users.map(u => [u.id, u]));
        const resolveName = (id: string) => userMap.get(id)?.name || userMap.get(id)?.email || 'Unknown';

        return sessions.map(session => {
            // Find transfers within this session's window
            const sessionTransfers = activities
                .filter(a => {
                    const meta = a.metadata as any;
                    return meta?.type === 'transfer' &&
                        a.createdAt >= session.date &&
                        a.createdAt <= session.createdAt;
                })
                .map(a => {
                    const meta = a.metadata as any;
                    return {
                        date: a.createdAt,
                        from: resolveName(meta.from),
                        to: resolveName(meta.to)
                    };
                });

            return {
                ...session,
                agentName: resolveName(session.createdById),
                transfers: sessionTransfers
            };
        });
    }
}
