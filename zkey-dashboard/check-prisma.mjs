
import { PrismaClient } from './prisma/generated/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mjOwgnKZCuKShgFfpwSbTbSRyyxbdAwM@yamabiko.proxy.rlwy.net:23289/railway';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log('Querying tenants...');
        const tenants = await prisma.tenant.findMany();
        console.log('Tenants found:', tenants.length);
        if (tenants.length > 0) {
            console.log('First tenant:', tenants[0]);
        }
    } catch (err) {
        console.error('Error querying tenants with Prisma:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
