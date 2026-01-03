
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import { WhatsAppMessageService } from '../services/whatsapp.message.service'

@Processor('whatsapp-incoming')
export class IncomingMessageProcessor extends WorkerHost {
    private readonly logger = new Logger(IncomingMessageProcessor.name)

    constructor(private readonly messageService: WhatsAppMessageService) {
        super()
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { sessionId, tenantId, message } = job.data

        try {
            this.logger.debug(`Processing incoming message job ${job.id} for session ${sessionId}`)
            await this.messageService.processIncomingMessage(sessionId, tenantId, message)
            return { success: true }
        } catch (error) {
            this.logger.error(`Failed to process incoming message job ${job.id}`, error)
            throw error // BullMQ will retry based on config
        }
    }
}
