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

            this.logger.log(`[Lyra-Lab] Webhook v6 - Buffer Size: ${rawBody?.length || 0}`);
            this.logger.log(`[Lyra-Lab] Content-Type: ${req.headers['content-type']}`);
            this.logger.log(`[Lyra-Lab] Buffer Sample: ${rawStr.substring(0, 150)}...`);

            let krAnswerVariant1 = ''; // From Body/Params (Decoded)
            let krAnswerLiteral = '';  // Raw escaped/encoded substring
            let krHash = '';

            // 1. Extract Hash and Parsed Answer
            if (req.query['kr-hash']) {
                krHash = String(req.query['kr-hash']);
                krAnswerVariant1 = String(req.query['kr-answer'] || '');
            } else if (body && body['kr-hash']) {
                krHash = String(body['kr-hash']);
                krAnswerVariant1 = typeof body['kr-answer'] === 'string' ? body['kr-answer'] : JSON.stringify(body['kr-answer']);
            }

            // 2. Surgical Buffer Extraction
            if (rawStr) {
                const formMatch = rawStr.match(/(?:^|[&?])kr-answer=([^&]+)/);
                const jsonMatch = rawStr.match(/"kr-answer"\s*:\s*"((?:[^"\\]|\\.)*)"/);

                if (formMatch) {
                    krAnswerLiteral = decodeURIComponent(formMatch[1]);
                    this.logger.log(`[Lyra-Lab] Extracted from Form (len: ${krAnswerLiteral.length})`);
                } else if (jsonMatch) {
                    krAnswerLiteral = jsonMatch[1];
                    this.logger.log(`[Lyra-Lab] Extracted from JSON (len: ${krAnswerLiteral.length})`);
                }
            }

            const hashToMatch = String(krHash || '').trim().replace(/=+$/g, '');
            if (!hashToMatch) {
                this.logger.error('[Lyra-Lab] NO HASH FOUND.');
                return res.status(400).send('Missing Hash');
            }

            // 3. Key Discovery (Include Passwords!)
            const methods = await this.paymentMethodService.findAll(ctx);
            const lyraHandler = methods.items.find(m => m.handler.code === 'lyra-payment');
            const h = (name: string) => lyraHandler?.handler.args.find(a => a.name === name)?.value || '';

            const testHmac = (process.env.LYRA_TEST_HMAC_KEY || h('testHmacKey')).trim();
            const prodHmac = (process.env.LYRA_PROD_HMAC_KEY || h('prodHmacKey')).trim();
            const testPass = (process.env.LYRA_TEST_PASSWORD || h('testPassword')).trim();
            const prodPass = (process.env.LYRA_PROD_PASSWORD || h('prodPassword')).trim();

            const keys: { label: string, val: string }[] = [];
            if (testHmac) keys.push({ label: 'TEST-HMAC', val: testHmac });
            if (testPass) keys.push({ label: 'TEST-PASS', val: testPass });
            if (prodHmac) keys.push({ label: 'PROD-HMAC', val: prodHmac });
            if (prodPass) keys.push({ label: 'PROD-PASS', val: prodPass });

            // 4. THE ULTIMATE SWEEP v6
            const payloads = [
                { label: 'Parsed', val: krAnswerVariant1 },
                { label: 'Literal-Buffer', val: krAnswerLiteral }
            ];

            let winningMatch = '';
            for (const keyObj of keys) {
                const keyVariants = [{ label: 'UTF8', key: keyObj.val }, { label: 'Base64', key: Buffer.from(keyObj.val, 'base64') }];
                for (const kv of keyVariants) {
                    for (const pv of payloads) {
                        if (!pv.val) continue;
                        // Try both raw and unescaped
                        const variants = [pv.val];
                        try {
                            const unescaped = JSON.parse(`"${pv.val}"`);
                            if (unescaped !== pv.val) variants.push(unescaped);
                        } catch (e) { }

                        for (const v of variants) {
                            const hmac = crypto.createHmac('sha256', kv.key).update(v, 'utf8').digest('hex');
                            if (hmac === hashToMatch) {
                                winningMatch = `SUCCESS: Key=${keyObj.label}(${kv.label}) Payload=${pv.label}${v !== pv.val ? '+Unescaped' : ''}`;
                                break;
                            }
                        }
                        if (winningMatch) break;
                    }
                    if (winningMatch) break;
                }
                if (winningMatch) break;
            }

            if (winningMatch) {
                this.logger.log(`[Lyra-Lab] ${winningMatch}`);
            } else {
                this.logger.error(`[Lyra-Lab] ALL VARIANTS FAILED. Provided: ${hashToMatch.substring(0, 16)}...`);
                this.logger.error(`[Lyra-Lab] Literal Sample: ${krAnswerLiteral.substring(0, 80)}...`);
            }

            const data = JSON.parse(winningMatch.includes('Unescaped') ? JSON.parse(`"${krAnswerLiteral}"`) : (krAnswerLiteral || krAnswerVariant1));

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
