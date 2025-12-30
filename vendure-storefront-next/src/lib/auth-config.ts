import { LogtoNextConfig, UserScope } from '@logto/next';

export const logtoConfig: LogtoNextConfig = {
    endpoint: process.env.LOGTO_ENDPOINT || 'https://logto-auth-production-c717.up.railway.app/',
    appId: process.env.LOGTO_APPID || '2osm5gpgcdxsr8mkjabzo',
    appSecret: process.env.LOGTO_APPSECRET || 'EOnjIESAbpAnsi4SnZPNRWtHbJWTqDHR',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://vendure-boilerplate-vendure-storefront-next.vercel.app',
    cookieSecret: process.env.LOGTO_COOKIE_SECRET || 'kUiGpKPTeHGDmqzXi6iYViDV6RbrwNWo',
    cookieSecure: process.env.NODE_ENV === 'production',
    scopes: [UserScope.Email, UserScope.Phone, UserScope.Profile, UserScope.CustomData],
};
