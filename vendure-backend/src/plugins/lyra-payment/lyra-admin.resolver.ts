import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
    Allow,
    Ctx,
    Customer,
    Logger,
    Order,
    OrderService,
    Permission,
    RequestContext,
    TransactionalConnection,
} from '@vendure/core';

@Resolver()
export class LyraAdminResolver {
    constructor(
        private connection: TransactionalConnection,
        private orderService: OrderService,
    ) {}

    @Allow(Permission.UpdateOrder)
    @Mutation()
    async cancelActiveOrderByCustomerEmail(
        @Ctx() ctx: RequestContext,
        @Args() args: { email: string },
    ): Promise<boolean> {
        const email = String(args.email || '').trim().toLowerCase();
        if (!email) return true;

        const customerRepo = this.connection.getRepository(ctx, Customer);
        const customer = await customerRepo.findOne({ where: { emailAddress: email } });
        if (!customer) {
            Logger.warn(`[Lyra] cancelActiveOrderByCustomerEmail: customer not found for ${email}`, 'Lyra');
            return true;
        }

        const orderRepo = this.connection.getRepository(ctx, Order);
        const order = await orderRepo.findOne({
            where: {
                active: true,
                customer: { id: customer.id } as any,
                channel: { id: ctx.channelId } as any,
            } as any,
        });

        if (!order) {
            Logger.info(`[Lyra] cancelActiveOrderByCustomerEmail: no active order for ${email}`, 'Lyra');
            return true;
        }

        Logger.warn(`[Lyra] Cancelling active order ${order.code} (${order.id}) for ${email}`, 'Lyra');
        const result = await this.orderService.transitionToState(ctx, order.id, 'Cancelled' as any);
        if ((result as any)?.__typename === 'OrderStateTransitionError') {
            const err = result as any;
            throw new Error(`Failed to cancel active order ${order.code}: ${err.errorCode ?? ''} ${err.message ?? ''}`);
        }

        return true;
    }
}
