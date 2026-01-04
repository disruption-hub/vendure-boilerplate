import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import type { Request } from 'express';
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
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      path: '/graphql',
      playground: true,
      introspection: true,
      context: ({ req }: { req: Request }) => ({ req }),
    }),
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
export class AppModule {}
