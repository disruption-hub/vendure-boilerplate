import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    LanguageCode,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, EmailPluginDevModeOptions, EmailPluginOptions } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { StripePlugin } from '@vendure/payments-plugin/package/stripe';
import 'dotenv/config';
import path from 'path';
import { ZKeyPlugin } from './plugins/zkey/zkey.plugin';
import { ProxyTrustPlugin } from './plugins/proxy-trust.plugin';
import { LyraPlugin } from './plugins/lyra-payment/lyra.plugin';

const isDev: Boolean = process.env.APP_ENV === 'dev';

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class SendgridEmailSender {
    async send(email: any) {
        await sgMail.send({
            to: email.recipient,
            from: email.from,
            subject: email.subject,
            html: email.body
        });
    }
}

const isSendgridValid = process.env.SENDGRID_API_KEY?.startsWith('SG.');

const emailPluginOptions = isDev || !isSendgridValid ? {
    devMode: true,
    outputPath: path.join(__dirname, '../static/email/test-emails'),
    route: 'mailbox'
} : {
    emailSender: new SendgridEmailSender(),
    transport: {
        type: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY
    }
};

export const config: VendureConfig = {
    apiOptions: {
        // hostname: process.env.PUBLIC_DOMAIN,
        port: +(process.env.PORT || 3000),
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(isDev ? {
            adminApiPlayground: {
                settings: { 'request.credentials': 'include' },
            },
            adminApiDebug: true,
            shopApiPlayground: {
                settings: { 'request.credentials': 'include' },
            },
            shopApiDebug: true,
        } : {}),
        cors: {
            origin: [
                'http://localhost:3001',
                ...(process.env.STOREFRONT_URL ? [process.env.STOREFRONT_URL] : [])
            ],
            credentials: true,
        },
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        shopAuthenticationStrategy: [
        ],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET,
            // Cross-site cookie support for Vercel/Railway
            ...(isDev ? {} : {
                sameSite: 'none',
                secure: true,
            }),
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA,
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
        // Allow a no-op transition (Created -> Created) so a payment method can create a payment session
        // (e.g. generate a formToken) without implying authorization/settlement.
        customPaymentProcess: [
            {
                transitions: {
                    Created: {
                        to: ['Created'],
                    },
                },
            } as any,
        ],
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {
        Customer: [
            {
                name: 'walletAddress',
                type: 'string',
                unique: true,
                nullable: true,
                public: true,
                label: [{ languageCode: LanguageCode.en, value: 'Wallet Address' }],
            },
            {
                name: 'zkeyInternalId',
                type: 'string',
                unique: true,
                nullable: true,
                public: true,
                label: [{ languageCode: LanguageCode.en, value: 'ZKey Internal ID' }],
            },
        ]
    },
    plugins: [
        ProxyTrustPlugin,
        ZKeyPlugin,
        LyraPlugin,
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: process.env.ASSET_VOLUME_PATH || path.resolve(process.cwd(), 'static/assets'),
            // For local dev, the correct value for assetUrlPrefix should
            // be guessed correctly, but for production it will usually need
            // to be set manually to match your production url.
            assetUrlPrefix: isDev ? undefined : (process.env.PUBLIC_DOMAIN?.startsWith('http')
                ? `${process.env.PUBLIC_DOMAIN}/assets/`
                : `https://${process.env.PUBLIC_DOMAIN}/assets/`),
        }),
        StripePlugin.init({
            storeCustomersInStripe: true,
            paymentIntentCreateParams: (injector, ctx, order) => {
                return {
                    description: `Order #${order.code} for ${order.customer?.emailAddress}`
                };
            }
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            ...emailPluginOptions,
            handlers: defaultEmailHandlers,
            templatePath: path.join(__dirname, '../static/email/templates'),
            globalTemplateVars: {
                fromAddress: process.env.EMAIL_FROM_ADDRESS || '"example" <noreply@example.com>',
                verifyEmailAddressUrl: `${process.env.STOREFRONT_URL}/verify`,
                passwordResetUrl: `${process.env.STOREFRONT_URL}/password-reset`,
                changeEmailAddressUrl: `${process.env.STOREFRONT_URL}/verify-email-address-change`
            },
        } as EmailPluginOptions | EmailPluginDevModeOptions),
        AdminUiPlugin.init({
            route: 'admin',
            // Avoid clashing with zkey-service (which uses 3002 in this repo)
            port: 3004,
            adminUiConfig: {
                apiHost: isDev ? undefined : `https://${process.env.PUBLIC_DOMAIN}`,
                apiPort: isDev ? +(process.env.PORT || 3000) : undefined,
            },
        }),
    ],
};
