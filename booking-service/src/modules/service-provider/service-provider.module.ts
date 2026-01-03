import { Module } from '@nestjs/common';
import { ServiceProviderService } from './service-provider.service';
import { ServiceProviderController } from './service-provider.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ServiceProviderController],
    providers: [ServiceProviderService],
    exports: [ServiceProviderService],
})
export class ServiceProviderModule { }
