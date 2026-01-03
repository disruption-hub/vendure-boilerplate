
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            primaryEmail: true,
            phoneNumber: true,
            emailVerified: true,
            phoneVerified: true,
            createdAt: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
