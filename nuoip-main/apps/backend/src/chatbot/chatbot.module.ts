import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminModule } from '../admin/admin.module';
import { ChatbotStreamController } from './chatbot-stream.controller';
import { PaymentFlowService } from './payment-flow.service';
import { ChatbotFlowConfigService } from './chatbot-flow-config.service';

import { ChatbotThemeController } from './chatbot-theme.controller';
import { ChatbotThemeService } from './chatbot-theme.service';

import { HybridAdminGuard } from '../common/guards/hybrid-auth.guard';

@Module({
  imports: [PrismaModule, forwardRef(() => AdminModule)],
  controllers: [ChatbotStreamController, ChatbotThemeController],
  providers: [PaymentFlowService, ChatbotFlowConfigService, ChatbotThemeService, HybridAdminGuard],
  exports: [ChatbotFlowConfigService, PaymentFlowService, ChatbotThemeService],
})
export class ChatbotModule { }

