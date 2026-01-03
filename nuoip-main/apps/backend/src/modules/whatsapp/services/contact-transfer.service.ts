import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BroadcastService } from '../../socket/services/broadcast.service';

@Injectable()
export class ContactTransferService {
    private readonly logger = new Logger(ContactTransferService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly broadcastService: BroadcastService,
    ) { }

    /**
     * Create a new transfer request for a contact
     */
    async createTransferRequest(
        contactId: string,
        toUserId: string,
        message?: string
    ) {
        this.logger.log(`[createTransferRequest] contactId=${contactId}, toUserId=${toUserId}`);

        // Get the contact and verify it exists
        const contact = await this.prisma.whatsAppContact.findUnique({
            where: { id: contactId },
            include: {
                users: true,
            }
        });

        if (!contact) {
            throw new NotFoundException('Contact not found');
        }

        // Verify the contact has an open session with a different user
        if (contact.sessionStatus !== 'OPEN') {
            throw new BadRequestException('Contact does not have an open session');
        }

        if (contact.userId === toUserId) {
            throw new BadRequestException('You already own this contact');
        }

        if (!contact.userId) {
            throw new BadRequestException('Contact is not assigned to anyone');
        }

        // Check for existing pending request
        const existingRequest = await this.prisma.contactTransferRequest.findFirst({
            where: {
                contactId,
                status: 'PENDING',
            }
        });

        if (existingRequest) {
            throw new BadRequestException('A transfer request is already pending for this contact');
        }

        // Find supervisors (admins or super_admins in the same tenant)
        const supervisors = await this.prisma.user.findMany({
            where: {
                tenantId: contact.tenantId,
                role: { in: ['super_admin', 'admin'] },
            },
            select: { id: true, name: true, email: true }
        });

        // Create the transfer request
        const request = await this.prisma.contactTransferRequest.create({
            data: {
                contactId,
                fromUserId: contact.userId,
                toUserId,
                requestedById: toUserId,
                message,
            },
            include: {
                contact: { select: { name: true, phoneNumber: true, jid: true } },
                fromUser: { select: { id: true, name: true, email: true } },
                toUser: { select: { id: true, name: true, email: true } },
            }
        });

        this.logger.log(`[createTransferRequest] Created request ${request.id}`);

        // Notify supervisors via real-time broadcast
        for (const supervisor of supervisors) {
            await this.broadcastService.broadcast(`private-user.${supervisor.id}`, 'transfer-request:new', {
                requestId: request.id,
                contactName: contact.name || contact.phoneNumber || contact.jid,
                fromUser: request.fromUser,
                toUser: request.toUser,
                message: request.message,
                createdAt: request.createdAt,
            });
        }

        return request;
    }

    /**
     * Get pending transfer requests (for supervisors)
     */
    async getPendingRequests(tenantId: string) {
        const requests = await this.prisma.contactTransferRequest.findMany({
            where: {
                status: 'PENDING',
                contact: {
                    tenantId,
                }
            },
            include: {
                contact: { select: { id: true, name: true, phoneNumber: true, jid: true, tenantId: true } },
                fromUser: { select: { id: true, name: true, email: true } },
                toUser: { select: { id: true, name: true, email: true } },
                requestedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' }
        });

        return requests;
    }

    /**
     * Approve a transfer request
     */
    async approveRequest(requestId: string, supervisorId: string, notes?: string) {
        this.logger.log(`[approveRequest] requestId=${requestId}, supervisorId=${supervisorId}`);

        const request = await this.prisma.contactTransferRequest.findUnique({
            where: { id: requestId },
            include: {
                contact: true,
            }
        });

        if (!request) {
            throw new NotFoundException('Transfer request not found');
        }

        if (request.status !== 'PENDING') {
            throw new BadRequestException(`Request is not pending (status: ${request.status})`);
        }

        // Update request and transfer contact ownership in a transaction
        const [updatedRequest] = await this.prisma.$transaction([
            // Update the request
            this.prisma.contactTransferRequest.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED',
                    supervisorId,
                    supervisorNotes: notes,
                    resolvedAt: new Date(),
                },
                include: {
                    contact: { select: { id: true, name: true, phoneNumber: true } },
                    toUser: { select: { id: true, name: true, email: true } },
                }
            }),
            // Transfer contact ownership
            this.prisma.whatsAppContact.update({
                where: { id: request.contactId },
                data: {
                    userId: request.toUserId,
                }
            })
        ]);

        this.logger.log(`[approveRequest] Approved and transferred contact to ${request.toUserId}`);

        // Notify the requester
        await this.broadcastService.broadcast(`private-user.${request.toUserId}`, 'transfer-request:approved', {
            requestId: updatedRequest.id,
            contactId: request.contactId,
            contactName: updatedRequest.contact.name || updatedRequest.contact.phoneNumber,
            notes,
        });

        // Notify the previous owner
        if (request.fromUserId) {
            await this.broadcastService.broadcast(`private-user.${request.fromUserId}`, 'transfer-request:transferred', {
                requestId: updatedRequest.id,
                contactId: request.contactId,
                contactName: updatedRequest.contact.name || updatedRequest.contact.phoneNumber,
                transferredTo: updatedRequest.toUser,
            });
        }

        return updatedRequest;
    }

    /**
     * Deny a transfer request
     */
    async denyRequest(requestId: string, supervisorId: string, notes?: string) {
        this.logger.log(`[denyRequest] requestId=${requestId}, supervisorId=${supervisorId}`);

        const request = await this.prisma.contactTransferRequest.findUnique({
            where: { id: requestId },
            include: {
                contact: true,
            }
        });

        if (!request) {
            throw new NotFoundException('Transfer request not found');
        }

        if (request.status !== 'PENDING') {
            throw new BadRequestException(`Request is not pending (status: ${request.status})`);
        }

        const updatedRequest = await this.prisma.contactTransferRequest.update({
            where: { id: requestId },
            data: {
                status: 'DENIED',
                supervisorId,
                supervisorNotes: notes,
                resolvedAt: new Date(),
            },
            include: {
                contact: { select: { id: true, name: true, phoneNumber: true } },
            }
        });

        this.logger.log(`[denyRequest] Denied request ${requestId}`);

        // Notify the requester
        await this.broadcastService.broadcast(`private-user.${request.toUserId}`, 'transfer-request:denied', {
            requestId: updatedRequest.id,
            contactId: request.contactId,
            contactName: updatedRequest.contact.name || updatedRequest.contact.phoneNumber,
            notes,
        });

        return updatedRequest;
    }

    /**
     * Cancel own transfer request
     */
    async cancelRequest(requestId: string, userId: string) {
        this.logger.log(`[cancelRequest] requestId=${requestId}, userId=${userId}`);

        const request = await this.prisma.contactTransferRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            throw new NotFoundException('Transfer request not found');
        }

        if (request.requestedById !== userId) {
            throw new ForbiddenException('You can only cancel your own requests');
        }

        if (request.status !== 'PENDING') {
            throw new BadRequestException(`Request is not pending (status: ${request.status})`);
        }

        const updatedRequest = await this.prisma.contactTransferRequest.update({
            where: { id: requestId },
            data: {
                status: 'CANCELLED',
                resolvedAt: new Date(),
            }
        });

        this.logger.log(`[cancelRequest] Cancelled request ${requestId}`);

        return updatedRequest;
    }

    /**
     * Check if current user has a pending request for a contact
     */
    async getRequestStatus(contactId: string, userId: string) {
        const pendingRequest = await this.prisma.contactTransferRequest.findFirst({
            where: {
                contactId,
                toUserId: userId,
                status: 'PENDING',
            }
        });

        return {
            hasPendingRequest: !!pendingRequest,
            request: pendingRequest,
        };
    }

    /**
     * Check if a contact is locked for a user (different owner + open session)
     */
    async isContactLockedForUser(contactId: string, userId: string) {
        const contact = await this.prisma.whatsAppContact.findUnique({
            where: { id: contactId },
            select: {
                id: true,
                userId: true,
                sessionStatus: true,
                users: { select: { id: true, name: true, email: true } }
            }
        });

        if (!contact) {
            return { isLocked: false, reason: 'Contact not found' };
        }

        const isLocked = contact.sessionStatus === 'OPEN' &&
            contact.userId !== null &&
            contact.userId !== userId;

        return {
            isLocked,
            reason: isLocked ? 'Contact has an open session with another operator' : null,
            currentOwner: isLocked ? contact.users : null,
        };
    }
}
