import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function resetUnreadCounts() {
    try {
        console.log('🔍 Finding all contacts with unread messages...\n')

        // Find all contacts with unread messages
        const contactsWithUnread = await prisma.whatsAppContact.findMany({
            where: {
                unreadCount: { gt: 0 }
            },
            select: {
                id: true,
                jid: true,
                name: true,
                unreadCount: true
            }
        })

        if (contactsWithUnread.length === 0) {
            console.log('✅ No contacts found with unread messages')
            return
        }

        console.log(`Found ${contactsWithUnread.length} contacts with unread messages:`)
        contactsWithUnread.forEach(c => {
            console.log(`  - ${c.name || c.jid}: ${c.unreadCount} unread`)
        })

        console.log(`\n🔄 Resetting unread count for ${contactsWithUnread.length} contacts...`)

        const result = await prisma.whatsAppContact.updateMany({
            where: {
                id: { in: contactsWithUnread.map(c => c.id) }
            },
            data: {
                unreadCount: 0
            }
        })

        console.log(`✅ Updated ${result.count} contacts - unread counts reset to 0`)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetUnreadCounts()
