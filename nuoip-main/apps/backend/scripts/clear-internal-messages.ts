import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaService } from '../src/prisma/prisma.service';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaService();

async function clearInternalMessages() {
    try {
        console.log('🔍 Finding user "Alberto Saco"...');
        const users = await prisma.user.findMany({
            where: { name: { contains: 'Alberto', mode: 'insensitive' } },
        });
        if (users.length === 0) {
            console.log('⚠️ No user found matching "Alberto"');
            return;
        }
        const userIds = users.map(u => u.id);
        console.log(`Found ${users.length} user(s): ${userIds.join(', ')}`);

        // Count unread messages sent by Alberto (senderId in userIds, readAt is null)
        const unreadCount = await prisma.tenantUserChatMessage.count({
            where: {
                senderId: { in: userIds },
                readAt: null,
            },
        });
        console.log(`Unread internal messages FROM Alberto Saco: ${unreadCount}`);
        if (unreadCount === 0) {
            console.log('✅ No unread internal messages to clear.');
            return;
        }

        // Update them to set readAt = now()
        const result = await prisma.tenantUserChatMessage.updateMany({
            where: {
                senderId: { in: userIds },
                readAt: null,
            },
            data: { readAt: new Date() },
        });
        console.log(`✅ Marked ${result.count} internal messages as read.`);
    } catch (error) {
        console.error('Error clearing internal messages:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearInternalMessages();
