import { PrismaClient } from './generated/prisma/client';

declare global {
    var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({} as any);

if (process.env.APP_ENV !== 'production') {
    global.prisma = prisma;
}
