import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mjOwgnKZCuKShgFfpwSbTbSRyyxbdAwM@yamabiko.proxy.rlwy.net:23289/railway';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const clientId = 'default-client-id';
    console.log(`Searching for application with clientId: ${clientId}`);

    const app = await prisma.application.findUnique({
        where: { clientId },
        include: { tenant: true },
    });

    if (!app) {
        console.error('Application not found!');
    } else {
        console.log('Application found:', app.name);
        console.log('Tenant:', app.tenant.name);
        console.log('Tenant Dashboard URLs:', JSON.stringify(app.tenant.dashboardUrls, null, 2));

        // Simulate logic
        const dashboardUrls = (app.tenant as any).dashboardUrls || {};
        const env = process.env.NODE_ENV || 'development';
        console.log('Simulated NODE_ENV:', env);

        const dashboardUrl = dashboardUrls[env] || dashboardUrls['production'] || 'FALLBACK_ENV_VAR';
        console.log('Resolved Dashboard URL:', dashboardUrl);
    }

    await prisma.$disconnect();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
