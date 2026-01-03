import { Module, forwardRef } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ChatbotModule } from '../chatbot/chatbot.module'
import { WhatsAppModule } from '../modules/whatsapp/whatsapp.module'
import { AdminTenantsController } from './tenants.controller'
import { AdminTenantsService } from './tenants.service'
import { AdminUsersController } from './users.controller'
import { AdminUsersService } from './users.service'
import { AdminTenantRequestsController } from './tenant-requests.controller'
import { AdminTenantRequestsService } from './tenant-requests.service'
import { AdminSystemController } from './system.controller'
import { AdminSystemService } from './system.service'
import { AdminCommunicationsController } from './communications.controller'
import { AdminCommunicationsService } from './communications.service'
import { AdminWhatsAppController } from './whatsapp.controller'
import { AdminWhatsAppService } from './whatsapp.service'
import { AdminMemoryController } from './memory.controller'
import { AdminMemoryService } from './memory.service'
import { AdminSystemSettingsController } from './system-settings.controller'
import { AdminSystemSettingsService } from './system-settings.service'
import { AdminPaymentsController } from './payments.controller'
import { AdminPaymentsService } from './payments.service'
import { AdminPaymentLinksController } from './payment-links.controller'
import { AdminPaymentLinksService } from './payment-links.service'
import { AdminPaymentReportsController } from './payment-reports.controller'
import { AdminPaymentReportsService } from './payment-reports.service'
import { AdminScheduleController } from './schedule.controller'
import { AdminScheduleService } from './schedule.service'
import { AdminDepartmentsController } from './departments.controller'
import { AdminDepartmentsService } from './departments.service'
import { CalibrationController } from './calibration.controller'
import { ChatbotFlowController } from './chatbot-flow.controller'
import { PublicTenantAssetsController } from './public-tenant-assets.controller'
import { DeliveryController } from './controllers/delivery.controller'
import { AdminDeliveryService } from './delivery.service'

@Module({
  imports: [ConfigModule, forwardRef(() => ChatbotModule), forwardRef(() => WhatsAppModule)],
  controllers: [
    AdminTenantsController,
    AdminUsersController,
    AdminTenantRequestsController,
    AdminSystemController,
    AdminSystemSettingsController,
    AdminCommunicationsController,
    AdminWhatsAppController,
    AdminMemoryController,
    AdminPaymentsController,
    AdminPaymentLinksController,
    AdminPaymentReportsController,
    AdminScheduleController,
    AdminDepartmentsController,
    CalibrationController,
    ChatbotFlowController,
    PublicTenantAssetsController,
    DeliveryController,
  ],
  providers: [
    AdminTenantsService,
    AdminUsersService,
    AdminTenantRequestsService,
    AdminSystemService,
    AdminSystemSettingsService,
    AdminCommunicationsService,
    AdminWhatsAppService,
    AdminMemoryService,
    AdminPaymentsService,
    AdminPaymentLinksService,
    AdminPaymentReportsService,
    AdminScheduleService,
    AdminDepartmentsService,
    AdminDeliveryService,
  ],
  exports: [AdminTenantsService, AdminSystemSettingsService],
})
export class AdminModule { }
