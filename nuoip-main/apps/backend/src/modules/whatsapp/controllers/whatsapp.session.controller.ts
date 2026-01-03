
import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { WhatsAppContactService } from '../services/whatsapp.contact.service';

@Controller('whatsapp/contacts')
export class WhatsAppSessionController {
    constructor(private readonly contactService: WhatsAppContactService) { }

    @Post(':id/session/open')
    async openSession(@Param('id') id: string, @Body() body: { userId?: string }) {
        return this.contactService.openSession(id, undefined, body?.userId);
    }

    @Post(':id/session/close')
    async closeSession(
        @Param('id') id: string,
        @Body() body: { annotation?: string; interactionType?: string; needsFollowUp?: boolean; followUpDate?: string; userId?: string }
    ) {
        return this.contactService.closeSession(id, body);
    }

    @Get(':id/session/summary-preview')
    async previewSessionSummary(@Param('id') id: string) {
        return this.contactService.previewSessionSummary(id);
    }

    @Post(':id/assign')
    async assignContact(@Param('id') id: string, @Body('userId') userId: string) {
        return this.contactService.assignContact(id, userId);
    }

    @Get(':id/sessions')
    async getSessions(@Param('id') id: string) {
        return this.contactService.getContactSessions(id);
    }
}
