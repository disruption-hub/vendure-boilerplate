import { Module } from '@nestjs/common';
import { VenueService } from './venue.service';
import { VenueController } from './venue.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VenueResolver, SpaceResolver } from '../../graphql/venue.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [VenueController],
  providers: [VenueService, VenueResolver, SpaceResolver],
  exports: [VenueService],
})
export class VenueModule { }
