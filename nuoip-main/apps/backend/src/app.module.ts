import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { PrismaModule } from './prisma/prisma.module'
import { AdminModule } from './admin/admin.module'
import { PaymentsModule } from './payments/payments.module'
import { CrmModule } from './crm/crm.module'
import { ChatbotModule } from './chatbot/chatbot.module'
import { CatalogCategoriesModule } from './catalog/categories/categories.module'
import { InventoryModule } from './catalog/inventory/inventory.module'
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module'
import { SocketModule } from './modules/socket/socket.module'
import { QueueModule } from './modules/queue/queue.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      ignoreEnvVars: false,
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    PaymentsModule,
    CrmModule,
    ChatbotModule,
    CatalogCategoriesModule,
    InventoryModule,
    WhatsAppModule,
    SocketModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
