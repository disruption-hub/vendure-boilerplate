import { PaymentMethodHandler, LanguageCode, CreatePaymentResult, SettlePaymentResult, CreatePaymentErrorResult, Logger } from '@vendure/core';
import axios from 'axios';

const loggerCtx = 'LyraPaymentHandler';

export const lyraPaymentHandler = new PaymentMethodHandler({
    code: 'lyra-payment',
    description: [{ languageCode: LanguageCode.en, value: 'Lyra / PayZen' }],
    args: {
        testMode: {
            type: 'boolean',
            defaultValue: true,
            label: [{ languageCode: LanguageCode.en, value: 'Test Mode' }],
            description: [{ languageCode: LanguageCode.en, value: 'Enable test mode (use test credentials)' }]
        },
        // Test credentials
        testUsername: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Test Site ID' }],
            description: [{ languageCode: LanguageCode.en, value: 'Test environment Site ID' }]
        },
        testPassword: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Test Password' }],
            description: [{ languageCode: LanguageCode.en, value: 'Test environment API password' }]
        },
        testPublicKey: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Test Public Key' }],
            description: [{ languageCode: LanguageCode.en, value: 'Test environment public key' }]
        },
        testHmacKey: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Test HMAC Key' }],
            description: [{ languageCode: LanguageCode.en, value: 'Test environment HMAC key' }]
        },
        // Production credentials
        prodUsername: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Production Site ID' }],
            description: [{ languageCode: LanguageCode.en, value: 'Production environment Site ID' }]
        },
        prodPassword: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Production Password' }],
            description: [{ languageCode: LanguageCode.en, value: 'Production environment API password' }]
        },
        prodPublicKey: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Production Public Key' }],
            description: [{ languageCode: LanguageCode.en, value: 'Production environment public key' }]
        },
        prodHmacKey: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Production HMAC Key' }],
            description: [{ languageCode: LanguageCode.en, value: 'Production environment HMAC key' }]
        },
        endpoint: {
            type: 'string',
            defaultValue: 'https://api.micuentaweb.pe/api-payment/V4/',
            label: [{ languageCode: LanguageCode.en, value: 'API Endpoint' }],
            description: [{ languageCode: LanguageCode.en, value: 'Lyra API endpoint URL' }]
        },
        scriptBaseUrl: {
            type: 'string',
            defaultValue: 'https://static.lyra.com/static/js/krypton-client/V4.0',
            label: [{ languageCode: LanguageCode.en, value: 'Script Base URL (optional)' }],
            description: [{ languageCode: LanguageCode.en, value: 'Base URL for loading Lyra JavaScript library' }]
        },
    },

    createPayment: async (ctx, order, amount, args, metadata): Promise<CreatePaymentResult | CreatePaymentErrorResult> => {
        // Determine which credentials to use based on test mode
        const isTestMode = args.testMode ?? true;
        const username = isTestMode
            ? (args.testUsername || process.env.LYRA_TEST_SITE_ID)
            : (args.prodUsername || process.env.LYRA_PROD_SITE_ID);
        const password = isTestMode
            ? (args.testPassword || process.env.LYRA_TEST_PASSWORD)
            : (args.prodPassword || process.env.LYRA_PROD_PASSWORD);
        const publicKey = isTestMode
            ? (args.testPublicKey || process.env.LYRA_TEST_PUBLIC_KEY)
            : (args.prodPublicKey || process.env.LYRA_PROD_PUBLIC_KEY);
        const endpoint = args.endpoint || process.env.LYRA_ENDPOINT || 'https://api.micuentaweb.pe/api-payment/V4/';

        Logger.info(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for Lyra payment`, loggerCtx);

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

            const apiUrl = `${endpoint}Charge/CreatePayment`;
            Logger.debug(`Lyra API URL: ${apiUrl}`, loggerCtx);
            Logger.debug(`Lyra API Payload: ${JSON.stringify(payload, null, 2)}`, loggerCtx);
            Logger.debug(`Using username: ${username}`, loggerCtx);

            const response = await axios.post(
                apiUrl,
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
                            scriptBaseUrl: args.scriptBaseUrl || process.env.LYRA_SCRIPT_BASE_URL || 'https://static.lyra.com/static/js/krypton-client/V4.0',
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
