const { PrismaClient } = require('./prisma/generated/client/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mjOwgnKZCuKShgFfpwSbTbSRyyxbdAwM@yamabiko.proxy.rlwy.net:23289/railway';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const apps = await prisma.application.findMany({
        select: {
            id: true,
            name: true,
            tenantId: true,
            integrations: true,
        }
    });

    console.log("Applications:", JSON.stringify(apps, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
