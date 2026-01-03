import { PaymentMethodHandler, LanguageCode, CreatePaymentResult, SettlePaymentResult, CreatePaymentErrorResult, Logger } from '@vendure/core';
import axios from 'axios';

const loggerCtx = 'LyraPaymentHandler';

function normalizePublicUrl(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const v = value.trim();
    if (!v) return undefined;
    if (v.startsWith('http://') || v.startsWith('https://')) return v.replace(/\/$/, '');
    return `https://${v}`.replace(/\/$/, '');
}

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
        const rawEndpoint = args.endpoint || process.env.LYRA_ENDPOINT || 'https://api.micuentaweb.pe/api-payment/V4/';
        const endpoint = rawEndpoint.endsWith('/') ? rawEndpoint : `${rawEndpoint}/`;

        // Ensure the JS library domain matches the API domain. A mismatch can cause the formToken
        // to be treated as invalid/expired by the Krypton client.
        const defaultLyraScriptBaseUrl = 'https://static.lyra.com/static/js/krypton-client/V4.0';
        let derivedScriptBaseUrl: string | undefined;
        try {
            const endpointUrl = new URL(endpoint);
            const staticHost = endpointUrl.host.startsWith('api.')
                ? endpointUrl.host.replace(/^api\./, 'static.')
                : endpointUrl.host;
            derivedScriptBaseUrl = `${endpointUrl.protocol}//${staticHost}/static/js/krypton-client/V4.0`;
        } catch {
            // ignore
        }

        // Allow env var override, otherwise use handler config; if it looks like the generic Lyra URL
        // but endpoint is regional (e.g. micuentaweb), prefer the derived one.
        const configuredScriptBaseUrl = (process.env.LYRA_SCRIPT_BASE_URL || args.scriptBaseUrl || '').trim();
        const scriptBaseUrl =
            (configuredScriptBaseUrl && configuredScriptBaseUrl !== defaultLyraScriptBaseUrl)
                ? configuredScriptBaseUrl
                : (derivedScriptBaseUrl || configuredScriptBaseUrl || defaultLyraScriptBaseUrl);

        const ipnTargetUrl =
            normalizePublicUrl(process.env.LYRA_IPN_URL) ||
            (() => {
                const base = normalizePublicUrl(process.env.PUBLIC_DOMAIN);
                return base ? `${base}/payments/lyra-ipn` : undefined;
            })();

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
            const normalizedHandlerAmount =
                typeof amount === 'number'
                    ? Math.round(amount)
                    : Number.parseInt(String(amount), 10);

            const normalizedOrderTotal = Math.round(order.totalWithTax);

            const normalizedAmount =
                Number.isFinite(normalizedHandlerAmount) && normalizedHandlerAmount > 0
                    ? normalizedHandlerAmount
                    : normalizedOrderTotal;

            if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
                Logger.warn(
                    `Lyra payment rejected due to invalid amount: handler=${String(amount)} order.totalWithTax=${String(order.totalWithTax)}`,
                    loggerCtx,
                );
                return {
                    amount: order.totalWithTax,
                    state: 'Declined' as const,
                    errorMessage: `Invalid amount: ${String(amount)}`,
                };
            }

            Logger.info(`Creating Lyra payment for order ${order.code} (amount: ${amount})`, loggerCtx);

            // Encode credentials for Basic Auth
            const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

            // Payload for Lyra V4 API
            const payload = {
                amount: normalizedAmount, // Vendure and Lyra both use minor units (cents)
                currency: order.currencyCode,
                orderId: order.code,
                customer: {
                    email: order.customer?.emailAddress,
                    reference: order.customer?.id.toString(),
                },
                ...(ipnTargetUrl ? { ipnTargetUrl } : {}),
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
                    // Creating the payment only generates a formToken. The actual authorization/settlement
                    // happens after the customer submits the embedded form and Lyra calls the IPN.
                    state: 'Created' as const,
                    transactionId: answer.uuid,
                    // CRITICAL: Data nested in 'public' is visible to the Shop API (Frontend)
                    metadata: {
                        public: {
                            formToken: answer.formToken,
                            publicKey: publicKey,
                            scriptBaseUrl:
                                scriptBaseUrl,
                        },
                        // Data nested in 'private' is NOT exposed to the Shop API.
                        // Keep any diagnostic/server response details here.
                        private: {
                            lyra: {
                                status: response.data.status,
                                answer,
                            },
                        },
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
