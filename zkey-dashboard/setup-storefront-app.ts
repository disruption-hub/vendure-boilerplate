import { prisma } from '../src/lib/prisma';

async function setupStorefrontApp() {
    try {
        // First, ensure we have a tenant
        let tenant = await prisma.tenant.findFirst();

        if (!tenant) {
            console.log('Creating default tenant...');
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Default Tenant',
                    slug: 'default',
                },
            });
            console.log('✅ Tenant created:', tenant.name);
        } else {
            console.log('✅ Using existing tenant:', tenant.name);
        }

        // Check if storefront app already exists
        const existingApp = await prisma.application.findFirst({
            where: {
                name: 'Vendure Storefront',
            },
        });

        if (existingApp) {
            console.log('✅ Application already exists!');
            console.log('\n📋 Application Details:');
            console.log('   Name:', existingApp.name);
            console.log('   Client ID:', existingApp.clientId);
            console.log('   Redirect URIs:', existingApp.redirectUris);
            console.log('\n💡 Add this to vendure-storefront-next/.env.local:');
            console.log(`   NEXT_PUBLIC_ZKEY_CLIENT_ID=${existingApp.clientId}`);
            return;
        }

        // Create the application
        console.log('Creating Vendure Storefront application...');
        const app = await prisma.application.create({
            data: {
                name: 'Vendure Storefront',
                tenantId: tenant.id,
                clientId: `storefront-${Date.now()}`,
                redirectUris: [
                    'http://localhost:3001/auth/callback',
                    'http://localhost:3000/auth/callback',
                ],
                postLogoutRedirectUris: [
                    'http://localhost:3001',
                    'http://localhost:3000',
                ],
                corsOrigins: [
                    'http://localhost:3001',
                    'http://localhost:3000',
                ],
                authMethods: {
                    password: true,
                    otp: true,
                    wallet: true,
                },
            },
        });

        console.log('\n✅ Application created successfully!');
        console.log('\n📋 Application Details:');
        console.log('   Name:', app.name);
        console.log('   Client ID:', app.clientId);
        console.log('   Redirect URIs:', app.redirectUris);
        console.log('   Post Logout URIs:', app.postLogoutRedirectUris);
        console.log('\n💡 Next Steps:');
        console.log('   1. Create vendure-storefront-next/.env.local with:');
        console.log(`      NEXT_PUBLIC_ZKEY_CLIENT_ID=${app.clientId}`);
        console.log(`      NEXT_PUBLIC_ZKEY_URL=http://localhost:3002`);
        console.log(`      NEXT_PUBLIC_APP_URL=http://localhost:3001`);
        console.log('   2. Restart the storefront');
        console.log('   3. Try signing in again!');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

setupStorefrontApp();
