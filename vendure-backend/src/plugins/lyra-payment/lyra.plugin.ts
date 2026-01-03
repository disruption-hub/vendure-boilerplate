import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { RawBodyMiddleware } from './raw-body.middleware';
import { lyraPaymentHandler } from './lyra.handler';
import { LyraController } from './lyra.controller';
import gql from 'graphql-tag';
import { LyraAdminResolver } from './lyra-admin.resolver';
import { lyraUnlockStuckOrdersTask } from './lyra.tasks';
import { LyraShopResolver } from './lyra-shop.resolver';

@VendurePlugin({
    imports: [PluginCommonModule],
    controllers: [LyraController],
    shopApiExtensions: {
        schema: gql`
            extend type Mutation {
                resetActiveLyraPayments: Boolean!
            }
        `,
        resolvers: [LyraShopResolver],
    },
    adminApiExtensions: {
        schema: gql`
            extend type Mutation {
                cancelActiveOrderByCustomerEmail(email: String!): Boolean!
            }
        `,
        resolvers: [LyraAdminResolver],
    },
    configuration: (config) => {
        config.paymentOptions.paymentMethodHandlers.push(lyraPaymentHandler);

        config.schedulerOptions = config.schedulerOptions ?? {};
        config.schedulerOptions.tasks = [...(config.schedulerOptions.tasks ?? []), lyraUnlockStuckOrdersTask];
        return config;
    },
})
export class LyraPlugin implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RawBodyMiddleware)
            .forRoutes({ path: 'payments/lyra-ipn', method: RequestMethod.POST });
    }
}
