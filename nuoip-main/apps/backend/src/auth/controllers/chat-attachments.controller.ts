import { Controller, Get, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ChatOtpService } from '../services/chat-otp.service';

@Controller('chat/attachments')
export class ChatAttachmentsController {
    constructor(private readonly chatOtpService: ChatOtpService) { }

    @Get(':id')
    async getAttachment(@Param('id') id: string, @Res() res: Response) {
        try {
            const attachment = await this.chatOtpService.getAttachmentById(id);

            if (!attachment || !attachment.data) {
                throw new HttpException('Attachment not found', HttpStatus.NOT_FOUND);
            }

            // Convert base64 back to buffer
            const buffer = Buffer.from(attachment.data, 'base64');

            // Set appropriate headers
            res.setHeader('Content-Type', attachment.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

            // Send the binary data
            res.send(buffer);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('[ChatAttachmentsController] Error retrieving attachment:', error);
            throw new HttpException('Failed to retrieve attachment', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
