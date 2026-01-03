import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaService } from '../src/prisma/prisma.service';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaService();

async function clearInternalMessagesRodrigo() {
    try {
        console.log('🔍 Finding user "Rodrigo"...');
        const users = await prisma.user.findMany({
            where: { name: { contains: 'Rodrigo', mode: 'insensitive' } },
        });
        if (users.length === 0) {
            console.log('⚠️ No user found matching "Rodrigo"');
            return;
        }
        const userIds = users.map(u => u.id);
        console.log(`Found ${users.length} user(s): ${userIds.join(', ')}`);

        const unreadCount = await prisma.tenantUserChatMessage.count({
            where: {
                senderId: { in: userIds },
                readAt: null,
            },
        });
        console.log(`Unread internal messages FROM Rodrigo: ${unreadCount}`);
        if (unreadCount === 0) {
            console.log('✅ No unread internal messages to clear.');
            return;
        }

        const result = await prisma.tenantUserChatMessage.updateMany({
            where: {
                senderId: { in: userIds },
                readAt: null,
            },
            data: { readAt: new Date() },
        });
        console.log(`✅ Marked ${result.count} internal messages as read for Rodrigo.`);
    } catch (error) {
        console.error('Error clearing internal messages for Rodrigo:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearInternalMessagesRodrigo();
