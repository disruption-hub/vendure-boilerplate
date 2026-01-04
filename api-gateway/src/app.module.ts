import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { stitchSchemas } from '@graphql-tools/stitch';
import { schemaFromExecutor } from '@graphql-tools/wrap';
import { print } from 'graphql';

function createRemoteExecutor(url: string) {
  return async ({ document, variables, context }: any) => {
    console.log('[RemoteExecutor] Executing against:', url);
    console.log('[RemoteExecutor] Context keys:', context ? Object.keys(context) : 'undefined');

    const query = print(document);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (context?.req?.headers) {
      if (context.req.headers['authorization']) {
        headers['Authorization'] = context.req.headers['authorization'];
      }
      if (context.req.headers['vendure-auth-token']) {
        headers['vendure-auth-token'] = context.req.headers['vendure-auth-token'];
      }
    }

    const fetchResult = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });
    return fetchResult.json();
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DashboardModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const normalizeUrl = (url: string, suffix: string) => {
          if (!url) return url;
          // If the URL already ends with the suffix, or has a path after the domain, trust it
          // Otherwise, if it's just a domain/origin, append the suffix
          const urlObj = new URL(url);
          if (urlObj.pathname === '/' || urlObj.pathname === '') {
            return `${url.replace(/\/$/, '')}${suffix}`;
          }
          return url;
        };

        const rawVendureUrl = configService.get<string>('VENDURE_SHOP_API_URL') || 'http://localhost:3000/shop-api';
        const rawBookingUrl = configService.get<string>('BOOKING_SERVICE_URL') || 'http://localhost:3005/graphql';

        const vendureUrl = normalizeUrl(rawVendureUrl, '/shop-api');
        const bookingUrl = normalizeUrl(rawBookingUrl, '/graphql');

        console.log('[AppModule] Vendure URL (normalized):', vendureUrl);
        console.log('[AppModule] Booking URL (normalized):', bookingUrl);

        const vendureExecutor = createRemoteExecutor(vendureUrl);
        const bookingExecutor = createRemoteExecutor(bookingUrl);

        return {
          schema: stitchSchemas({
            subschemas: [
              {
                schema: await schemaFromExecutor(vendureExecutor),
                executor: vendureExecutor,
              },
              {
                schema: await schemaFromExecutor(bookingExecutor),
                executor: bookingExecutor,
              },
            ],
          }),
          playground: true,
          introspection: true,
          context: ({ req }) => ({ req }),
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
