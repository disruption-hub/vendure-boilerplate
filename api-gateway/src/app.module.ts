import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
      useFactory: async () => {
        const vendureExecutor = createRemoteExecutor('http://localhost:3000/shop-api');
        const bookingExecutor = createRemoteExecutor('http://localhost:3005/graphql');

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
