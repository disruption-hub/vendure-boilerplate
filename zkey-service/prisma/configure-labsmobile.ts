import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mjOwgnKZCuKShgFfpwSbTbSRyyxbdAwM@yamabiko.proxy.rlwy.net:23289/railway';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const application = await prisma.application.findFirst();

    if (!application) {
        console.error('No application found in the database. Please create one first.');
        return;
    }

    const updatedApplication = await prisma.application.update({
        where: { id: application.id },
        data: {
            labsmobileApiKey: 'BqVcFI39Ca2J8wKlT2l9vaESEZLu28It',
            labsmobileUrl: 'https://api.labsmobile.com/json/send',
            labsmobileUser: 'alberto@matmax.world',
            labsmobileSenderId: 'ZKey',
        },
    });

    console.log('LabsMobile configured for application:', updatedApplication.name);

    // Also update the tenant if it exists and has no credentials
    if (application.tenantId) {
        await prisma.tenant.update({
            where: { id: application.tenantId },
            data: {
                labsmobileApiKey: 'BqVcFI39Ca2J8wKlT2l9vaESEZLu28It',
                labsmobileUrl: 'https://api.labsmobile.com/json/send',
                labsmobileUser: 'alberto@matmax.world',
                labsmobileSenderId: 'ZKey',
            },
        });
        console.log('LabsMobile configured for tenant.');
    }

    await prisma.$disconnect();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
