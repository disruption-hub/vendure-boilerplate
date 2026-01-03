import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { lyraPaymentHandler } from './lyra.handler';
import { LyraController } from './lyra.controller';

@VendurePlugin({
    imports: [PluginCommonModule],
    controllers: [LyraController],
    configuration: (config) => {
        config.paymentOptions.paymentMethodHandlers.push(lyraPaymentHandler);
        return config;
    },
})
export class LyraPlugin { }
