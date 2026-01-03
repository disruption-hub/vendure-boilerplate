import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFiles,
    BadRequestException,
    Headers,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatOtpService } from '../services/chat-otp.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

@Controller('chat/upload')
export class ChatUploadController {
    constructor(private readonly chatOtpService: ChatOtpService) { }

    @Post()
    @UseInterceptors(FilesInterceptor('files'))
    async uploadFiles(
        @UploadedFiles() files: any[],
        @Headers('authorization') authorization?: string,
    ) {
        if (!authorization) {
            throw new BadRequestException('Unauthorized');
        }

        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }

        const uploadedFiles = [];

        for (const file of files) {
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                throw new BadRequestException(
                    `File ${file.originalname} exceeds maximum size of 10MB`,
                );
            }

            // Validate file type
            if (!ALLOWED_TYPES.includes(file.mimetype)) {
                throw new BadRequestException(
                    `File type ${file.mimetype} is not allowed`,
                );
            }

            // Convert to base64
            const base64 = file.buffer.toString('base64');

            // Save to database via service
            const attachment = await this.chatOtpService.createAttachment({
                filename: file.originalname,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                data: base64,
            });

            uploadedFiles.push({
                id: attachment.id,
                filename: attachment.filename,
                originalName: attachment.originalName,
                mimeType: attachment.mimeType,
                size: attachment.size,
                url: `/api/chat/attachments/${attachment.id}`,
            });
        }

        return {
            success: true,
            files: uploadedFiles,
        };
    }
}
