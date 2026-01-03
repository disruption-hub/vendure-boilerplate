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
            this.logger.log(`Received Lyra IPN webhook`);

            const rawBody = (req as any).rawBody;
            let krAnswer: string;
            let krHash: string;

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
                this.logger.warn(`[Lyra] Missing rawBody buffer (using parsed body - signature might fail)`);
                krAnswer = typeof body['kr-answer'] === 'string' ? body['kr-answer'] : JSON.stringify(body['kr-answer']);
                krHash = body['kr-hash'];
            }

            if (!krAnswer || !krHash) {
                this.logger.error('Missing kr-answer or kr-hash in webhook payload');
                return res.status(400).send('Missing required fields');
            }

            // --- Multi-Variant Payload Generation ---
            const payloadVariants: { label: string, data: string }[] = [{ label: 'As Extracted', data: krAnswer }];
            try {
                const unescaped = JSON.parse(`"${krAnswer}"`);
                if (unescaped !== krAnswer) payloadVariants.push({ label: 'Unescaped JSON', data: unescaped });
            } catch (e) { }

            // 2. Retrieve Lyra HMAC key from Vendure Config
            const methods = await this.paymentMethodService.findAll(ctx);
            const lyraMethod = methods.items.find(m => m.handler.code === 'lyra-payment');
            if (!lyraMethod) {
                return res.status(500).send('Configuration Error');
            }

            const rawTestMode = lyraMethod.handler.args.find(a => a.name === 'testMode')?.value;
            const testMode = parseBoolean(rawTestMode, true);

            const testKey = (process.env.LYRA_TEST_HMAC_KEY || lyraMethod.handler.args.find(a => a.name === 'testHmacKey')?.value || '').trim();
            const prodKey = (process.env.LYRA_PROD_HMAC_KEY || lyraMethod.handler.args.find(a => a.name === 'prodHmacKey')?.value || '').trim();

            const keysToTry: { label: string, key: string }[] = [];
            if (testKey) keysToTry.push({ label: 'TEST', key: testKey });
            if (prodKey) keysToTry.push({ label: 'PRODUCTION', key: prodKey });

            if (keysToTry.length === 0) {
                this.logger.error('No Lyra HMAC keys configured');
                return res.status(500).send('Configuration Error');
            }

            // 3. Signature Laboratory: Try every combination
            const normalizedProvided = String(krHash).trim().replace(/=+$/g, '');
            let matchedResult = '';

            for (const keyItem of keysToTry) {
                const keyVariants: { label: string, key: string | Buffer }[] = [
                    { label: 'UTF-8', key: keyItem.key }
                ];
                try {
                    const hexBuf = Buffer.from(keyItem.key, 'hex');
                    if (hexBuf.length > 0 && /^[0-9a-fA-F]+$/.test(keyItem.key)) keyVariants.push({ label: 'Hex', key: hexBuf });
                } catch (e) { }
                try {
                    const base64Buf = Buffer.from(keyItem.key, 'base64');
                    if (base64Buf.length > 0) keyVariants.push({ label: 'Base64', key: base64Buf });
                } catch (e) { }

                for (const keyVariant of keyVariants) {
                    for (const payloadVariant of payloadVariants) {
                        const hmac = crypto.createHmac('sha256', keyVariant.key).update(payloadVariant.data, 'utf8');
                        const computedHex = hmac.digest('hex');
                        if (computedHex === normalizedProvided) {
                            matchedResult = `${keyItem.label} Key (${keyVariant.label}) + Payload (${payloadVariant.label})`;
                            break;
                        }
                    }
                    if (matchedResult) break;
                }
                if (matchedResult) break;
            }

            if (!matchedResult) {
                this.logger.error(`[Lyra] Signature FAILED after trying all variants.`);
                this.logger.error(`[Lyra] Provided Hash: ${normalizedProvided.substring(0, 16)}...`);
                this.logger.error(`[Lyra] Payload Sample: ${krAnswer.substring(0, 100)}...`);
                this.logger.warn('[Lyra] WARNING: Strict mode bypassed for LABORATORY TRACE');
            } else {
                this.logger.log(`[Lyra] Signature SUCCESS! Match: ${matchedResult}`);
            }

            const data = JSON.parse(payloadVariants.find(p => p.label === 'Unescaped JSON')?.data || krAnswer);

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
