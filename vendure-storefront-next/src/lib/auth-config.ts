```typescript
import { LogtoNextConfig, UserScope } from '@logto/next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://vendure-boilerplate-vendure-storefront-next.vercel.app').replace(/\/$/, '');

const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || process.env.PRISMA_GENERATING === 'true';

if (!isBuild) {
    console.log('[Logto Config] Initializing with baseUrl:', baseUrl);
    if (!process.env.LOGTO_ENDPOINT) console.warn('[Logto Config] Missing LOGTO_ENDPOINT');
    if (!process.env.LOGTO_APPID) console.warn('[Logto Config] Missing LOGTO_APPID');
}

export const logtoConfig: LogtoNextConfig = {
    endpoint: process.env.LOGTO_ENDPOINT || 'https://logto-auth-production-c717.up.railway.app/',
    appId: process.env.LOGTO_APPID || '2osm5gpgcdxsr8mkjabzo',
    appSecret: process.env.LOGTO_APPSECRET || 'EOnjIESAbpAnsi4SnZPNRWtHbJWTqDHR',
    baseUrl,
    cookieSecret: process.env.LOGTO_COOKIE_SECRET || 'kUiGpKPTeHGDmqzXi6iYViDV6RbrwNWo',
    cookieSecure: process.env.NODE_ENV === 'production',
    scopes: [UserScope.Email, UserScope.Phone, UserScope.Profile, UserScope.CustomData],
};
