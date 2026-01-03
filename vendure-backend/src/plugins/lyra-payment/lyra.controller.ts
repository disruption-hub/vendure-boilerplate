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
            this.logger.log('Received Lyra IPN webhook');

            // 1. Parse Lyra Data
            let krAnswer: string;
            let krHash: string;

            const rawBody = (req as any).rawBody;

            if (Buffer.isBuffer(rawBody)) {
                this.logger.log(`[Lyra] Processing rawBody Buffer (length: ${rawBody.length})`);
                const rawStr = rawBody.toString('utf8');
                const params = new URLSearchParams(rawStr);
                krAnswer = params.get('kr-answer') || '';
                krHash = params.get('kr-hash') || '';
            } else if (Buffer.isBuffer(body)) {
                this.logger.log(`[Lyra] Processing request body Buffer (length: ${body.length})`);
                const rawStr = body.toString('utf8');
                const params = new URLSearchParams(rawStr);
                krAnswer = params.get('kr-answer') || '';
                krHash = params.get('kr-hash') || '';
            } else {
                krAnswer = typeof body['kr-answer'] === 'string' ? body['kr-answer'] : JSON.stringify(body['kr-answer']);
                krHash = body['kr-hash'];
                this.logger.warn(`[Lyra] Processing parsed ${typeof body} IPN (no raw buffer found - signature may fail)`);
            }

            if (!krAnswer || !krHash) {
                this.logger.error('Missing kr-answer or kr-hash in webhook payload');
                return res.status(400).send('Missing required fields');
            }

            this.logger.log(`[Lyra] Payload for HMAC (length: ${krAnswer.length}): ${krAnswer.substring(0, 50)}...`);
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

            const configuredTestKey = lyraMethod.handler.args.find(a => a.name === 'testHmacKey')?.value;
            const envTestKey = process.env.LYRA_TEST_HMAC_KEY;
            const testKey = (!configuredTestKey || isMaskedSecret(configuredTestKey) ? envTestKey : configuredTestKey)?.trim?.() ?? configuredTestKey;

            const configuredProdKey = lyraMethod.handler.args.find(a => a.name === 'prodHmacKey')?.value;
            const envProdKey = process.env.LYRA_PROD_HMAC_KEY;
            const prodKey = (!configuredProdKey || isMaskedSecret(configuredProdKey) ? envProdKey : configuredProdKey)?.trim?.() ?? configuredProdKey;

            const keysToTry: { label: string, key: string }[] = [];
            if (testKey) keysToTry.push({ label: 'TEST', key: testKey });
            if (prodKey) keysToTry.push({ label: 'PRODUCTION', key: prodKey });

            if (keysToTry.length === 0) {
                this.logger.error('No Lyra HMAC keys configured');
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

                return normalizedProvided.toLowerCase() === computedHex.toLowerCase() ||
                    normalizedProvided === computedBase64 ||
                    normalizedProvided === computedBase64Url;
            };

            let isValid = false;
            let matchedKey = '';

            for (const { label, key } of keysToTry) {
                // Try UTF-8
                if (checkSignature(key, `${label} (UTF-8)`)) {
                    isValid = true;
                    matchedKey = `${label} (UTF-8)`;
                    break;
                }
                // Try Base64
                try {
                    const keyBuffer = Buffer.from(key, 'base64');
                    if (keyBuffer.length > 0 && checkSignature(keyBuffer, `${label} (Base64)`)) {
                        isValid = true;
                        matchedKey = `${label} (Base64)`;
                        break;
                    }
                } catch (e) { }
            }

            if (!isValid) {
                // Log failure detail for debugging
                const keyToLog = testMode ? testKey : prodKey;
                const computedHex = keyToLog ? crypto.createHmac('sha256', keyToLog).update(krAnswer, 'utf8').digest('hex') : 'N/A';
                this.logger.error(`[Lyra] Invalid signature. Computed: ${computedHex.substring(0, 16)}..., Provided: ${normalizedProvided.substring(0, 16)}...`);
                return res.status(403).send('Invalid Signature');
            } else {
                this.logger.log(`[Lyra] Signature MATCHED using ${matchedKey} key.`);
            }

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

                if (payment) {
                    this.logger.log(`Found 'Created' payment ${payment.id} for order ${order.code}. Updating transactionId to ${transactionUuid}.`);
                    payment.transactionId = transactionUuid;
                    await this.connection.getRepository(ctx, 'Payment').save(payment);
                }
            }

            if (!payment) {
                this.logger.warn(`Payment not found for transaction ${transactionUuid} and no 'Created' payment found.`);
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
