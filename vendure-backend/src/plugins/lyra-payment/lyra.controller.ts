import { Controller, Post, Body, Res, Req, Logger } from '@nestjs/common';
import type { Response, Request } from 'express';
import { PaymentMethodService, RequestContext, Ctx, OrderService, TransactionalConnection } from '@vendure/core';
import * as crypto from 'crypto';

function parseBoolean(value: unknown, defaultValue: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (v === 'true') return true;
        if (v === 'false') return false;
    }
    if (typeof value === 'number') return value !== 0;
    return defaultValue;
}

function isMaskedSecret(value: unknown): boolean {
    return typeof value === 'string' && value.includes('*');
}

@Controller('payments')
export class LyraController {
    private readonly logger = new Logger(LyraController.name);

    constructor(
        private paymentMethodService: PaymentMethodService,
        private orderService: OrderService,
        private connection: TransactionalConnection
    ) { }

    @Post('lyra-ipn')
    async handleLyraWebhook(@Ctx() ctx: RequestContext, @Body() body: any, @Req() req: Request, @Res() res: Response) {
        try {
            const rawBody = (req as any).rawBody;
            const rawStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : '';

            let krAnswer: string | undefined;
            let krHash: string | undefined;

            // 1. Extract fields from either JSON or Form-encoded body
            if (rawStr.startsWith('{')) {
                // JSON format
                const data = JSON.parse(rawStr);
                krAnswer = typeof data['kr-answer'] === 'string' ? data['kr-answer'] : JSON.stringify(data['kr-answer']);
                krHash = data['kr-hash'];
            } else {
                // Form-encoded format (Standard for most Lyra IPNs)
                // We use the already-parsed 'body' object from our early middleware
                krAnswer = typeof body['kr-answer'] === 'string' ? body['kr-answer'] : JSON.stringify(body['kr-answer']);
                krHash = body['kr-hash'];
            }

            if (!krAnswer || !krHash) {
                this.logger.error('Missing kr-answer or kr-hash in Lyra webhook payload');
                return res.status(400).send('Missing required fields');
            }

            // 2. Retrieve Lyra Credentials (using API Password for signature as confirmed by Lab)
            const methods = await this.paymentMethodService.findAll(ctx);
            const lyraHandler = methods.items.find(m => m.handler.code === 'lyra-payment');
            const h = (name: string) => lyraHandler?.handler.args.find(a => a.name === name)?.value || '';

            const testMode = parseBoolean(h('testMode'), true);
            const apiPassword = testMode
                ? (process.env.LYRA_TEST_PASSWORD || h('testPassword'))
                : (process.env.LYRA_PROD_PASSWORD || h('prodPassword'));

            if (!apiPassword) {
                this.logger.error('Lyra API Password not configured - cannot verify signature');
                return res.status(500).send('Configuration Error');
            }

            // 3. Verify Signature
            // Laboratory results confirmed: Signature is HMAC-SHA256(Key=Password, Message=DecodedAnswer)
            const providedHash = String(krHash).trim().replace(/=+$/g, '');
            const computedHash = crypto.createHmac('sha256', apiPassword.trim())
                .update(krAnswer, 'utf8')
                .digest('hex');

            if (computedHash !== providedHash) {
                this.logger.error(`[Lyra] Invalid signature. Provided: ${providedHash.substring(0, 16)}..., Computed: ${computedHash.substring(0, 16)}...`);
                // STRICT MODE RE-ENABLED
                return res.status(403).send('Invalid signature');
            }

            this.logger.log(`[Lyra] Signature MATCHED using ${testMode ? 'TEST' : 'PROD'} API Password`);
            const data = JSON.parse(krAnswer);

            // 4. Update Order Status
            const orderCode = data?.orderDetails?.orderId;
            if (!orderCode) {
                this.logger.error('Missing orderDetails.orderId in webhook payload');
                return res.status(400).send('Missing order id');
            }

            const order = await this.orderService.findOneByCode(ctx, orderCode, ['payments']);

            if (!order) {
                this.logger.error(`Order not found: ${orderCode}`);
                return res.status(404).send('Order not found');
            }

            const transactionUuid = data?.transactions?.[0]?.uuid;
            if (!transactionUuid) {
                this.logger.error('Missing transactions[0].uuid in webhook payload');
                return res.status(400).send('Missing transaction id');
            }

            let payment = order.payments?.find(p => p.transactionId === transactionUuid);

            if (!payment) {
                // Fallback: If the payment was created but has no transaction ID yet (common with Lyra form tokens),
                // find the 'Created' payment for this order.
                payment = order.payments?.find(p => p.state === 'Created');
            }

            if (!payment) {
                this.logger.warn(`Payment not found for transaction ${transactionUuid} and no 'Created' payment found.`);
                return res.status(200).send('OK');
            }

            // 4. Enrich Metadata
            const mainTransaction = data?.transactions?.[0];
            const cardDetails = mainTransaction?.transactionDetails?.cardDetails;

            payment.metadata = {
                ...(payment.metadata || {}),
                lyra: {
                    orderStatus: data.orderStatus,
                    detailedStatus: mainTransaction?.detailedStatus,
                    effectiveBrand: cardDetails?.effectiveBrand,
                    pan: cardDetails?.pan,
                    expiryMonth: cardDetails?.expiryMonth,
                    expiryYear: cardDetails?.expiryYear,
                    errorCode: mainTransaction?.errorCode || data.errorCode,
                    errorMessage: mainTransaction?.errorMessage || data.errorMessage,
                    transactionUuid: mainTransaction?.uuid,
                }
            };

            payment.transactionId = transactionUuid;
            await this.connection.getRepository(ctx, 'Payment').save(payment as any);

            if (data.orderStatus === 'PAID') {
                this.logger.log(`Settling payment ${payment.id} for order ${order.code} (${cardDetails?.effectiveBrand || 'unknown card'})`);
                await this.orderService.settlePayment(ctx, payment.id);
            } else {
                // For refused/cancelled/unpaid states, mark the payment declined so the order is not treated as paid.
                this.logger.warn(`Lyra orderStatus=${data.orderStatus} for order ${order.code}. Transitioning payment ${payment.id} to Declined.`);
                const result = await this.orderService.transitionPaymentToState(ctx, payment.id, 'Declined' as any);
                if ((result as any).__typename && (result as any).__typename !== 'Payment') {
                    this.logger.warn(`Failed to transition payment to Declined: ${(result as any).message ?? (result as any).errorCode ?? 'unknown error'}`);
                }

                // Try to allow the customer to modify the cart again.
                const orderTransitionResult = await this.orderService.transitionToState(ctx, order.id, 'AddingItems' as any);
                if ((orderTransitionResult as any).__typename === 'OrderStateTransitionError') {
                    const err = orderTransitionResult as any;
                    this.logger.warn(`Failed to transition order ${order.code} back to AddingItems: ${err.errorCode ?? ''} ${err.message ?? ''}`);
                }
            }

            return res.status(200).send('OK');
        } catch (e: any) {
            this.logger.error(`Error processing IPN: ${e.message}`, e.stack);
            return res.status(500).send('Error processing IPN');
        }
    }
}
