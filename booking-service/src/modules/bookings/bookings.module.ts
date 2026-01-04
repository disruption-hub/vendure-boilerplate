import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsResolver } from '../../graphql/bookings.resolver';
import { PrismaModule } from '../prisma/prisma.module';

import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [PrismaModule, ScheduleModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsResolver],
})
export class BookingsModule { }
