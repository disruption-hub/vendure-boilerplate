import { Logger, Order, OrderService, ScheduledTask, TransactionalConnection } from '@vendure/core';

export const lyraUnlockStuckOrdersTask = new ScheduledTask({
    id: 'lyra-unlock-stuck-orders',
    description: 'Move abandoned ArrangingPayment orders back to AddingItems so carts remain editable',
    schedule: cron => cron.every(15).minutes(),
    params: {
        minAgeMinutes: 30,
        maxBatch: 100,
    },
    execute: async ({ injector, scheduledContext, params }) => {
        const connection = injector.get(TransactionalConnection);
        const orderService = injector.get(OrderService);

        const minAgeMinutes = Number((params as any)?.minAgeMinutes ?? 30);
        const maxBatch = Number((params as any)?.maxBatch ?? 100);
        const cutoff = new Date(Date.now() - Math.max(1, minAgeMinutes) * 60_000);

        const orderRepo = connection.getRepository(scheduledContext, Order);
        const stuckOrders = await orderRepo
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.payments', 'payment')
            .where('order.active = :active', { active: true })
            .andWhere('order.state = :state', { state: 'ArrangingPayment' })
            .andWhere('order.updatedAt < :cutoff', { cutoff })
            .orderBy('order.updatedAt', 'ASC')
            .take(Math.max(1, maxBatch))
            .getMany();

        let unlocked = 0;
        let cancelled = 0;

        for (const order of stuckOrders) {
            const payments: any[] = (order as any).payments ?? [];
            const hasPaidOrAuthorized = payments.some(p => p?.state === 'Authorized' || p?.state === 'Settled');
            if (hasPaidOrAuthorized) continue;

            const unlockResult = await orderService.transitionToState(scheduledContext, order.id, 'AddingItems' as any);
            if ((unlockResult as any)?.__typename === 'OrderStateTransitionError') {
                const cancelResult = await orderService.transitionToState(scheduledContext, order.id, 'Cancelled' as any);
                if ((cancelResult as any)?.__typename === 'OrderStateTransitionError') {
                    const err = cancelResult as any;
                    Logger.warn(
                        `[Lyra] Failed to unlock/cancel stuck order ${order.code}: ${err.errorCode ?? ''} ${err.message ?? ''}`,
                        'Lyra',
                    );
                } else {
                    cancelled++;
                    Logger.warn(`[Lyra] Cancelled stuck order ${order.code} (was ArrangingPayment)`, 'Lyra');
                }
            } else {
                unlocked++;
                Logger.info(`[Lyra] Unlocked stuck order ${order.code}: ArrangingPayment -> AddingItems`, 'Lyra');
            }
        }

        return {
            scanned: stuckOrders.length,
            unlocked,
            cancelled,
            cutoff,
        };
    },
});
