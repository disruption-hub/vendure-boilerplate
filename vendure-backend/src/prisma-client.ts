import { PrismaClient } from '../generated/prisma';

declare global {
    var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.APP_ENV !== 'production') {
    global.prisma = prisma;
}
