import { Module } from '@nestjs/common';
import { VenueNetworkService } from './venue-network.service';
import { VenueNetworkResolver } from './venue-network.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [VenueNetworkService, VenueNetworkResolver],
    exports: [VenueNetworkService],
})
export class VenueNetworkModule { }
