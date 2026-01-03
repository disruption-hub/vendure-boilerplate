
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger, Inject, forwardRef } from '@nestjs/common'
import { WhatsAppConnectionService } from '../services/whatsapp.connection.service'

@Processor('whatsapp-outgoing')
export class OutgoingMessageProcessor extends WorkerHost {
    private readonly logger = new Logger(OutgoingMessageProcessor.name)

    constructor(
        // Use forwardRef if necessary, relying on intra-module injection
        private readonly connectionService: WhatsAppConnectionService
    ) {
        super()
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { sessionId, jid, text } = job.data

        try {
            this.logger.debug(`Processing outgoing message job ${job.id} for session ${sessionId} to ${jid}`)
            await this.connectionService.sendMessage(sessionId, jid, text)
            return { success: true }
        } catch (error) {
            this.logger.error(`Failed to process outgoing message job ${job.id}`, error)
            throw error
        }
    }
}
