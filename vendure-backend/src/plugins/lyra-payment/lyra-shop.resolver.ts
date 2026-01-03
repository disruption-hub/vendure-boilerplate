import { Resolver, Mutation } from '@nestjs/graphql';
import {
    RequestContext,
    ActiveOrderService,
    TransactionalConnection,
    Order,
    Payment,
    Allow,
    Permission,
    Ctx
} from '@vendure/core';

@Resolver()
export class LyraShopResolver {
    constructor(
        private connection: TransactionalConnection,
        private activeOrderService: ActiveOrderService
    ) { }

    @Mutation()
    @Allow(Permission.Owner)
    async resetActiveLyraPayments(@Ctx() ctx: RequestContext): Promise<boolean> {
        const order = await this.activeOrderService.getActiveOrder(ctx, undefined);
        if (!order) {
            return false;
        }

        // Load payments for the order
        const orderWithPayments = await this.connection.getRepository(ctx, Order).findOne({
            where: { id: order.id },
            relations: ['payments'],
        });

        if (!orderWithPayments || !orderWithPayments.payments) {
            return false;
        }

        const activeLyraPayments = orderWithPayments.payments.filter(
            p => p.method === 'lyra-payment' && p.state === 'Created'
        );

        if (activeLyraPayments.length === 0) {
            return true;
        }

        const paymentRepo = this.connection.getRepository(ctx, Payment);

        for (const payment of activeLyraPayments) {
            payment.state = 'Declined';
            payment.errorMessage = 'Reset by new payment initialization';
            await paymentRepo.save(payment);
        }

        return true;
    }
}
