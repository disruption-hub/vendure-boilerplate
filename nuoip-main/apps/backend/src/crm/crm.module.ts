import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CrmController } from './crm.controller'
import { CrmCustomersController } from './crm-customers.controller'
import { CrmService } from './crm.service'
import { AuthModule } from '../auth/auth.module'
import { AdminModule } from '../admin/admin.module'

@Module({
  imports: [ConfigModule, AuthModule, AdminModule],
  controllers: [CrmController, CrmCustomersController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule { }

