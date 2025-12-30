export const logtoConfig = {
    endpoint: process.env.LOGTO_ENDPOINT || 'https://logto-auth-production-c717.up.railway.app/',
    appId: process.env.LOGTO_APPID || '2osm5gpgcdxsr8mkjabzo',
    appSecret: process.env.LOGTO_APPSECRET || 'EOnjIESAbpAnsi4SnZPNRWtHbJWTqDHR',
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
    cookieSecret: process.env.LOGTO_COOKIE_SECRET || 'ZJLRmApSHs1WeDd3ZFaLsvrEfj8y1qnt',
    cookieSecure: process.env.NODE_ENV === 'production',
};
