import { PrismaClient } from '@prisma/generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mjOwgnKZCuKShgFfpwSbTbSRyyxbdAwM@yamabiko.proxy.rlwy.net:23289/railway';

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
