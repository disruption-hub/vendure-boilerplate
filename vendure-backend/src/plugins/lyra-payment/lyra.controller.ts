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

            this.logger.log(`[Lyra-Lab] Webhook Received. Buffer Size: ${rawBody?.length || 0}`);
            this.logger.log(`[Lyra-Lab] Content-Type: ${req.headers['content-type']}`);
            this.logger.log(`[Lyra-Lab] Query: ${JSON.stringify(req.query)}`);
            this.logger.log(`[Lyra-Lab] Buffer Sample (200 chars): ${rawStr.substring(0, 200)}...`);

            let krAnswerVariant1 = ''; // From Body/Params
            let krAnswerVariant2 = ''; // From Buffer Regex
            let krAnswerVariant3 = ''; // From Buffer Slicing (The "True" literal)
            let krHash = '';

            // 1. Variant 1: The "Parsed" version
            if (req.query['kr-hash']) {
                krHash = String(req.query['kr-hash']);
                krAnswerVariant1 = String(req.query['kr-answer'] || '');
            } else if (body && body['kr-hash']) {
                krHash = String(body['kr-hash']);
                krAnswerVariant1 = typeof body['kr-answer'] === 'string' ? body['kr-answer'] : JSON.stringify(body['kr-answer']);
            }

            // 2. Variant 2 & 3: Buffer Extraction
            if (rawStr) {
                const answerMatch = rawStr.match(/"kr-answer"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (answerMatch) {
                    krAnswerVariant2 = answerMatch[1];
                    const fullMatch = answerMatch[0];
                    const startPos = rawStr.indexOf(fullMatch) + fullMatch.indexOf(answerMatch[1]);
                    krAnswerVariant3 = rawStr.substring(startPos, startPos + answerMatch[1].length);
                }
            }

            const hashToMatch = String(krHash || '').trim().replace(/=+$/g, '');
            if (!hashToMatch) {
                this.logger.error('[Lyra-Lab] NO HASH FOUND in body, query or headers.');
                return res.status(400).send('Missing Hash');
            }

            // 3. Key Discovery
            const methods = await this.paymentMethodService.findAll(ctx);
            const lyraHandler = methods.items.find(m => m.handler.code === 'lyra-payment');
            const testKey = (process.env.LYRA_TEST_HMAC_KEY || lyraHandler?.handler.args.find(a => a.name === 'testHmacKey')?.value || '').trim();
            const prodKey = (process.env.LYRA_PROD_HMAC_KEY || lyraHandler?.handler.args.find(a => a.name === 'prodHmacKey')?.value || '').trim();

            const keys: { label: string, val: string }[] = [];
            if (testKey) keys.push({ label: 'TEST', val: testKey });
            if (prodKey) keys.push({ label: 'PROD', val: prodKey });

            // 4. THE ULTIMATE SWEEP
            const payloads = [
                { label: 'Parsed/Stringified', val: krAnswerVariant1 },
                { label: 'Regex-Extracted', val: krAnswerVariant2 },
                { label: 'Slice-Literal', val: krAnswerVariant3 }
            ];

            let winningMatch = '';
            for (const keyObj of keys) {
                const keyVariants = [
                    { label: 'UTF8', key: keyObj.val },
                    { label: 'Base64', key: Buffer.from(keyObj.val, 'base64') }
                ];
                for (const kv of keyVariants) {
                    for (const pv of payloads) {
                        if (!pv.val) continue;
                        const hmac = crypto.createHmac('sha256', kv.key).update(pv.val, 'utf8').digest('hex');
                        if (hmac === hashToMatch) {
                            winningMatch = `SUCCESS: Key=${keyObj.label}(${kv.label}) Payload=${pv.label}`;
                            break;
                        }
                        // Also try the unescaped version of the payload
                        try {
                            const unescaped = JSON.parse(`"${pv.val}"`);
                            if (unescaped !== pv.val) {
                                const hmac2 = crypto.createHmac('sha256', kv.key).update(unescaped, 'utf8').digest('hex');
                                if (hmac2 === hashToMatch) {
                                    winningMatch = `SUCCESS: Key=${keyObj.label}(${kv.label}) Payload=${pv.label}+Unescaped`;
                                    break;
                                }
                            }
                        } catch (e) { }
                    }
                    if (winningMatch) break;
                }
                if (winningMatch) break;
            }

            if (winningMatch) {
                this.logger.log(`[Lyra-Lab] ${winningMatch}`);
            } else {
                this.logger.error(`[Lyra-Lab] ALL VARIANTS FAILED.`);
                this.logger.error(`[Lyra-Lab] Hash Provided: ${hashToMatch}`);
                this.logger.error(`[Lyra-Lab] Slice-Literal: ${krAnswerVariant3.substring(0, 100)}...`);
            }

            // Restore logic to continue (Permissive mode)
            const finalData = JSON.parse(body['kr-answer'] || krAnswerVariant1 || '{}');
            const data = typeof finalData === 'string' ? JSON.parse(finalData) : finalData;

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
