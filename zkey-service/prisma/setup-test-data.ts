import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mjOwgnKZCuKShgFfpwSbTbSRyyxbdAwM@yamabiko.proxy.rlwy.net:23289/railway';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log('--- Initializing ZKey Service Data ---');

    try {
        // Create Default Tenant
        const tenant = await prisma.tenant.upsert({
            where: { slug: 'default' },
            update: {},
            create: {
                name: 'Default Tenant',
                slug: 'default',
            },
        });
        console.log(`Tenant created/found: ${tenant.id}`);

        // Create Vendure Storefront Application
        const app = await prisma.application.upsert({
            where: { clientId: 'default-client-id' },
            update: {
                redirectUris: [
                    'http://localhost:3001/auth/callback',
                    'https://vendure-storefront-next.vercel.app/auth/callback'
                ],
                corsOrigins: [
                    'http://localhost:3001',
                    'https://vendure-storefront-next.vercel.app'
                ],
            },
            create: {
                name: 'Default Storefront',
                clientId: 'default-client-id',
                tenantId: tenant.id,
                redirectUris: [
                    'http://localhost:3001/auth/callback',
                    'https://vendure-storefront-next.vercel.app/auth/callback'
                ],
                corsOrigins: [
                    'http://localhost:3001',
                    'https://vendure-storefront-next.vercel.app'
                ],
                authMethods: { password: true, otp: true, wallet: true },
            },
        });
        console.log(`Application created/found: ${app.clientId}`);

        console.log('--- Setup Complete ---');
    } catch (error) {
        console.error('Setup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
