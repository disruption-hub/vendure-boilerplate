import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentMethodService, RequestContext, Ctx, OrderService, TransactionalConnection } from '@vendure/core';
import * as crypto from 'crypto';

@Controller('payments')
export class LyraController {
    private readonly logger = new Logger(LyraController.name);

    constructor(
        private paymentMethodService: PaymentMethodService,
        private orderService: OrderService,
        private connection: TransactionalConnection
    ) { }

    @Post('lyra-ipn')
    async handleLyraWebhook(@Ctx() ctx: RequestContext, @Body() body: any, @Res() res: Response) {
        try {
            this.logger.log('Received Lyra IPN webhook');

            // 1. Parse Lyra Data
            const krAnswer = body['kr-answer']; // JSON String
            const krHash = body['kr-hash'];

            if (!krAnswer || !krHash) {
                this.logger.error('Missing kr-answer or kr-hash in webhook payload');
                return res.status(400).send('Missing required fields');
            }

            const data = JSON.parse(krAnswer);

            // 2. Retrieve your Lyra Password from Vendure Config
            const methods = await this.paymentMethodService.findAll(ctx);
            const lyraMethod = methods.items.find(m => m.handler.code === 'lyra-payment');

            if (!lyraMethod) {
                this.logger.error('Lyra payment method not found');
                return res.status(500).send('Configuration Error');
            }

            const password = lyraMethod.handler.args.find(a => a.name === 'password')?.value;

            if (!password) {
                this.logger.error('Lyra password not configured');
                return res.status(500).send('Configuration Error');
            }

            // 3. Verify HMAC-SHA256 Signature
            const calculatedHash = crypto
                .createHmac('sha256', password)
                .update(krAnswer)
                .digest('hex');

            if (calculatedHash !== krHash) {
                this.logger.error('Invalid signature - possible spoofing attempt');
                return res.status(403).send('Invalid Signature');
            }

            this.logger.log(`Valid signature for order ${data.orderDetails?.orderId}`);

            // 4. Update Order Status
            if (data.orderStatus === 'PAID') {
                const order = await this.orderService.findOneByCode(ctx, data.orderDetails.orderId);

                if (!order) {
                    this.logger.error(`Order not found: ${data.orderDetails.orderId}`);
                    return res.status(404).send('Order not found');
                }

                const payment = order.payments.find(p => p.transactionId === data.transactions[0].uuid);

                if (payment) {
                    this.logger.log(`Settling payment ${payment.id} for order ${order.code}`);
                    await this.orderService.settlePayment(ctx, payment.id);
                } else {
                    this.logger.warn(`Payment not found for transaction ${data.transactions[0].uuid}`);
                }
            }

            return res.status(200).send('OK');
        } catch (e: any) {
            this.logger.error(`Error processing IPN: ${e.message}`, e.stack);
            return res.status(500).send('Error processing IPN');
        }
    }
}
