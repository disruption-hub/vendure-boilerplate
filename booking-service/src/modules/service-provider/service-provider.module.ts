import { Module } from '@nestjs/common';
import { ServiceProviderService } from './service-provider.service';
import { ServiceProviderController } from './service-provider.controller';
import { ServiceProviderResolver } from './service-provider.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceProviderController],
  providers: [ServiceProviderService, ServiceProviderResolver],
  exports: [ServiceProviderService],
})
export class ServiceProviderModule { }
