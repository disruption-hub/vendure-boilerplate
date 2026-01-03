import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
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

            this.logger.log(`[Lyra Debug] Payload Inspection:
            krHash: ${krHash}
            krAnswer Type: ${typeof krAnswer}
            krAnswer Length: ${krAnswer?.length}
            krAnswer Start: ${String(krAnswer).substring(0, 50)}...`);

            const data = JSON.parse(krAnswer);

            // 2. Retrieve Lyra HMAC key from Vendure Config
            const methods = await this.paymentMethodService.findAll(ctx);
            const lyraMethod = methods.items.find(m => m.handler.code === 'lyra-payment');

            if (!lyraMethod) {
                this.logger.error('Lyra payment method not found');
                return res.status(500).send('Configuration Error');
            }

            // Determine if we're in test mode
            const rawTestMode = lyraMethod.handler.args.find(a => a.name === 'testMode')?.value;
            const testMode = parseBoolean(rawTestMode, true);
            const hmacKeyField = testMode ? 'testHmacKey' : 'prodHmacKey';
            const configuredHmacKey = lyraMethod.handler.args.find(a => a.name === hmacKeyField)?.value;
            const envHmacKey = process.env[testMode ? 'LYRA_TEST_HMAC_KEY' : 'LYRA_PROD_HMAC_KEY'];
            const hmacKey = (!configuredHmacKey || isMaskedSecret(configuredHmacKey) ? envHmacKey : configuredHmacKey)?.trim?.() ?? configuredHmacKey;

            this.logger.log(`[Lyra Debug] IPN Context: testMode=${testMode}, usingKeyFrom=${configuredHmacKey ? 'Config' : envHmacKey ? 'Env' : 'None'}`);

            if (!hmacKey) {
                this.logger.error(`Lyra HMAC key not configured for ${testMode ? 'TEST' : 'PRODUCTION'} mode`);
                return res.status(500).send('Configuration Error');
            }

            // 3. Verify HMAC-SHA256 Signature
            const providedHash = String(krHash).trim();
            const normalizedProvided = providedHash.replace(/=+$/g, '');

            // Helper to compute and check hash
            const checkSignature = (key: string | Buffer, internalLabel: string): boolean => {
                const computedHex = crypto.createHmac('sha256', key).update(krAnswer, 'utf8').digest('hex');
                const computedBase64 = crypto.createHmac('sha256', key).update(krAnswer, 'utf8').digest('base64');
                const computedBase64Url = computedBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

                const match = normalizedProvided.toLowerCase() === computedHex.toLowerCase() ||
                    normalizedProvided === computedBase64 ||
                    normalizedProvided === computedBase64Url;

                if (match) {
                    this.logger.log(`[Lyra Debug] Signature MATCHED using ${internalLabel} key strategy.`);
                } else {
                    this.logger.debug(`[Lyra Debug] Signature mismatch for ${internalLabel}. Computed: ${computedHex}`);
                }
                return match;
            };

            // Try treating key as standard UTF-8 string (default)
            let isValid = checkSignature(hmacKey, 'UTF-8 String');

            // If failed, and key looks like Base64, try decoding it
            if (!isValid) {
                try {
                    const keyBuffer = Buffer.from(hmacKey, 'base64');
                    // Simple heuristic: if it decodes to something reasonable, try it
                    if (keyBuffer.length > 0) {
                        isValid = checkSignature(keyBuffer, 'Base64 Buffer');
                    }
                } catch (e) {
                    // ignore
                }
            }

            if (!isValid) {
                // Log the failure for the UTF-8 case (most common)
                const computedHex = crypto.createHmac('sha256', hmacKey).update(krAnswer, 'utf8').digest('hex');
                this.logger.error(`Invalid signature. Computed(UTF8): ${computedHex}, Provided: ${normalizedProvided}. Key(masked): ${hmacKey.substring(0, 4)}...`);
                return res.status(403).send('Invalid Signature');
            }

            this.logger.log(`Valid signature for order ${data.orderDetails?.orderId}`);

            // 4. Update Order Status
            const orderCode = data?.orderDetails?.orderId;
            if (!orderCode) {
                this.logger.error('Missing orderDetails.orderId in webhook payload');
                return res.status(400).send('Missing order id');
            }

            const order = await this.orderService.findOneByCode(ctx, orderCode);

            if (!order) {
                this.logger.error(`Order not found: ${orderCode}`);
                return res.status(404).send('Order not found');
            }

            const transactionUuid = data?.transactions?.[0]?.uuid;
            if (!transactionUuid) {
                this.logger.error('Missing transactions[0].uuid in webhook payload');
                return res.status(400).send('Missing transaction id');
            }

            const payment = order.payments.find(p => p.transactionId === transactionUuid);

            if (!payment) {
                this.logger.warn(`Payment not found for transaction ${transactionUuid}`);
                return res.status(200).send('OK');
            }

            if (data.orderStatus === 'PAID') {
                this.logger.log(`Settling payment ${payment.id} for order ${order.code}`);
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
