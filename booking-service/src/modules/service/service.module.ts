import { Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ServiceResolver } from '../../graphql/service.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceController],
  providers: [ServiceService, ServiceResolver],
  exports: [ServiceService],
})
export class ServiceModule { }
