import { PaymentMethodHandler, LanguageCode, CreatePaymentResult, SettlePaymentResult, CreatePaymentErrorResult, Logger } from '@vendure/core';
import axios from 'axios';

const loggerCtx = 'LyraPaymentHandler';

export const lyraPaymentHandler = new PaymentMethodHandler({
    code: 'lyra-payment',
    description: [{ languageCode: LanguageCode.en, value: 'Lyra / PayZen' }],
    args: {
        username: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Site ID (Username)' }],
            description: [{ languageCode: LanguageCode.en, value: 'Your Lyra Site ID' }]
        },
        password: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Test/Prod Password' }],
            description: [{ languageCode: LanguageCode.en, value: 'Your Lyra API password' }]
        },
        publicKey: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Public Key' }],
            description: [{ languageCode: LanguageCode.en, value: 'Your Lyra public key for frontend' }]
        },
        hmacKey: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'HMAC Key' }],
            description: [{ languageCode: LanguageCode.en, value: 'Your Lyra HMAC key for webhook verification' }]
        },
        endpoint: {
            type: 'string',
            defaultValue: 'https://api.micuentaweb.pe/api-payment/V4/',
            label: [{ languageCode: LanguageCode.en, value: 'API Endpoint' }],
            description: [{ languageCode: LanguageCode.en, value: 'Lyra API endpoint URL' }]
        },
    },

    createPayment: async (ctx, order, amount, args, metadata): Promise<CreatePaymentResult | CreatePaymentErrorResult> => {
        const username = args.username || process.env.LYRA_SITE_ID;
        const password = args.password || process.env.LYRA_PASSWORD;
        const publicKey = args.publicKey || process.env.LYRA_PUBLIC_KEY;
        const endpoint = args.endpoint || process.env.LYRA_ENDPOINT || 'https://api.micuentaweb.pe/api-payment/V4/';

        if (!username || !password) {
            Logger.error('Lyra credentials not configured', loggerCtx);
            return {
                amount: order.totalWithTax,
                state: 'Declined' as const,
                errorMessage: 'Lyra credentials not configured',
            };
        }

        try {
            Logger.info(`Creating Lyra payment for order ${order.code} (amount: ${amount})`, loggerCtx);

            // Encode credentials for Basic Auth
            const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

            // Payload for Lyra V4 API
            const payload = {
                amount: amount, // Vendure and Lyra both use minor units (cents)
                currency: order.currencyCode,
                orderId: order.code,
                customer: {
                    email: order.customer?.emailAddress,
                    reference: order.customer?.id.toString(),
                },
                paymentConfig: {
                    actionType: 'AUTHORIZE',
                    singleAmount: amount,
                },
                // Custom data to track the order in Lyra's back office
                metadata: {
                    vendureOrderId: order.code,
                }
            };

            const response = await axios.post(
                `${endpoint}Charge/CreatePayment`,
                payload,
                {
                    headers: {
                        'Authorization': `Basic ${basicAuth}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            Logger.debug(`Lyra API response: ${JSON.stringify(response.data)}`, loggerCtx);

            const answer = response.data.answer;

            if (response.data.status === 'SUCCESS') {
                Logger.info(`Lyra payment created successfully: ${answer.uuid}`, loggerCtx);
                return {
                    amount: order.totalWithTax,
                    state: 'Authorized' as const,
                    transactionId: answer.uuid,
                    // CRITICAL: Data nested in 'public' is visible to the Shop API (Frontend)
                    metadata: {
                        public: {
                            formToken: answer.formToken,
                            publicKey: publicKey,
                        }
                    },
                };
            }

            Logger.warn(`Lyra payment creation failed: ${response.data.status} - ${answer?.errorMessage || 'No error message'}`, loggerCtx);
            return {
                amount: order.totalWithTax,
                state: 'Declined' as const,
                errorMessage: answer?.errorMessage || 'Lyra payment creation failed',
            };

        } catch (e: any) {
            // Handle Axios errors safely
            const errorMsg = e.response?.data?.answer?.errorMessage || e.message;
            Logger.error(`Lyra API error: ${errorMsg}`, loggerCtx, e.stack);
            return {
                amount: order.totalWithTax,
                state: 'Declined' as const,
                errorMessage: errorMsg,
            };
        }
    },

    settlePayment: async (ctx, order, payment, args): Promise<SettlePaymentResult> => {
        // Settlement is typically handled by the IPN (Webhook), so we just return success here
        return { success: true };
    },
});
