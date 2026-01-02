const { PrismaClient } = require('./prisma/generated/client/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mjOwgnKZCuKShgFfpwSbTbSRyyxbdAwM@yamabiko.proxy.rlwy.net:23289/railway';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            primaryEmail: true,
            tenantId: true
        },
        take: 5
    });

    const tenants = await prisma.tenant.findMany({
        take: 5
    });

    console.log("Users:", JSON.stringify(users, null, 2));
    console.log("Tenants:", JSON.stringify(tenants, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
