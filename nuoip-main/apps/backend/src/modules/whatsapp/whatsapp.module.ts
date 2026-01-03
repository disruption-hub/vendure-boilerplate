import { Module, forwardRef } from '@nestjs/common'
import { QueueModule } from '../queue/queue.module'
import { SocketModule } from '../socket/socket.module'
import { PrismaModule } from '../../prisma/prisma.module'
import { WhatsAppConnectionService } from './services/whatsapp.connection.service'
import { WhatsAppMessageService } from './services/whatsapp.message.service'
import { WhatsAppSessionService } from './services/whatsapp.session.service'
import { WhatsAppContactService } from './services/whatsapp.contact.service';
import { IncomingMessageProcessor } from './processors/incoming-message.processor'
// import { OutgoingMessageProcessor } from './processors/outgoing-message.processor'
import { WhatsAppSessionController } from './controllers/whatsapp.session.controller';
import { AdminWhatsAppController } from './controllers/admin-whatsapp.controller';
import { ContactTransferController } from './controllers/contact-transfer.controller';
import { WhatsAppSummaryService } from './services/whatsapp.summary.service';
import { ContactTransferService } from './services/contact-transfer.service';
import { AdminModule } from '../../admin/admin.module';

@Module({
    imports: [
        QueueModule,
        SocketModule,
        PrismaModule,
        forwardRef(() => AdminModule), // For SystemSettingsService
    ],
    providers: [
        WhatsAppConnectionService,
        WhatsAppMessageService,
        WhatsAppSessionService,
        WhatsAppContactService,
        WhatsAppSummaryService,
        ContactTransferService,
        IncomingMessageProcessor,
        // OutgoingMessageProcessor, // Disabled
    ],
    controllers: [
        WhatsAppSessionController,
        AdminWhatsAppController,
        ContactTransferController
    ],
    exports: [
        WhatsAppConnectionService,
        WhatsAppSessionService,
        WhatsAppMessageService,
        WhatsAppContactService,
        WhatsAppSummaryService
    ],
})
export class WhatsAppModule { }
