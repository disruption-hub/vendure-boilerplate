import { Controller, Post, Get, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ContactTransferService } from '../services/contact-transfer.service';

@Controller('whatsapp')
export class ContactTransferController {
    constructor(private readonly transferService: ContactTransferService) { }

    /**
     * Create a transfer request for a contact
     */
    @Post('contacts/:contactId/transfer/request')
    async createTransferRequest(
        @Param('contactId') contactId: string,
        @Body() body: { userId: string; message?: string }
    ) {
        return this.transferService.createTransferRequest(
            contactId,
            body.userId,
            body.message
        );
    }

    /**
     * Get pending transfer requests (for supervisors)
     */
    @Get('transfer-requests/pending')
    async getPendingRequests(@Query('tenantId') tenantId: string) {
        return this.transferService.getPendingRequests(tenantId);
    }

    /**
     * Approve a transfer request
     */
    @Post('transfer-requests/:requestId/approve')
    async approveRequest(
        @Param('requestId') requestId: string,
        @Body() body: { supervisorId: string; notes?: string }
    ) {
        return this.transferService.approveRequest(
            requestId,
            body.supervisorId,
            body.notes
        );
    }

    /**
     * Deny a transfer request
     */
    @Post('transfer-requests/:requestId/deny')
    async denyRequest(
        @Param('requestId') requestId: string,
        @Body() body: { supervisorId: string; notes?: string }
    ) {
        return this.transferService.denyRequest(
            requestId,
            body.supervisorId,
            body.notes
        );
    }

    /**
     * Cancel own transfer request
     */
    @Delete('transfer-requests/:requestId')
    async cancelRequest(
        @Param('requestId') requestId: string,
        @Body() body: { userId: string }
    ) {
        return this.transferService.cancelRequest(requestId, body.userId);
    }

    /**
     * Check if user has pending request for a contact
     */
    @Get('contacts/:contactId/transfer-status')
    async getTransferStatus(
        @Param('contactId') contactId: string,
        @Query('userId') userId: string
    ) {
        return this.transferService.getRequestStatus(contactId, userId);
    }

    /**
     * Check if contact is locked for user (different owner + open session)
     */
    @Get('contacts/:contactId/lock-status')
    async getLockStatus(
        @Param('contactId') contactId: string,
        @Query('userId') userId: string
    ) {
        return this.transferService.isContactLockedForUser(contactId, userId);
    }
}
