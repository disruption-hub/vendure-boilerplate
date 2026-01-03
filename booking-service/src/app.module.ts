import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SyncModule } from './modules/sync/sync.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { VenueModule } from './modules/venue/venue.module';
import { ServiceModule } from './modules/service/service.module';
import { ServiceProviderModule } from './modules/service-provider/service-provider.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { PassModule } from './modules/pass/pass.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SyncModule,
    BookingsModule,
    VenueModule,
    ServiceModule,
    ServiceProviderModule,
    ScheduleModule,
    PassModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
