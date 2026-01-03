import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function main() {
    console.log('🔍 Debugging Session Agent Resolution...');

    // 1. Fetch recent CrmSessionSummaries
    const sessions = await prisma.crmSessionSummary.findMany({
        take: 5,
        orderBy: { date: 'desc' }
    });

    console.log(`Found ${sessions.length} recent sessions.`);

    for (const session of sessions) {
        console.log(`\n--- Session: ${session.id} ---`);
        console.log(`Summary: ${session.summary.substring(0, 50)}...`);
        console.log(`CreatedById: '${session.createdById}'`);

        if (!session.createdById) {
            console.log('❌ CreatedById is empty/null');
            continue;
        }

        // 2. Check if User exists
        const user = await prisma.user.findUnique({
            where: { id: session.createdById }
        });

        if (user) {
            console.log(`✅ User Found: ${user.name} (${user.email})`);
        } else {
            console.log(`❌ User NOT Found in DB for ID: ${session.createdById}`);
        }

        // 3. Check for activities that might look like transfers
        if (session.contactId) {
            const activities = await prisma.crmActivity.findMany({
                where: {
                    contactId: session.contactId,
                    createdAt: {
                        gte: session.date, // Start of session
                        lte: session.createdAt // End of session (approx)
                    }
                },
                orderBy: { createdAt: 'asc' }
            });
            console.log(`   Found ${activities.length} activities during session.`);
            activities.forEach(a => console.log(`    - [${a.type}] ${a.text}`));
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
