import { Module } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AdminModule } from '../admin/admin.module'

@Module({
  imports: [PrismaModule, AdminModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}

