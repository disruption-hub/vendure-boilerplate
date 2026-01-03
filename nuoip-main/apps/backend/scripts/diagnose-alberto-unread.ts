import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function diagnoseAlbertoUnread() {
    try {
        console.log('🔍 Diagnosing Alberto Saco unread count (looking for 33)...\n')

        // 1. Check WhatsAppContact records
        const waContacts = await prisma.whatsAppContact.findMany({
            where: {
                OR: [
                    { name: { contains: 'Alberto', mode: 'insensitive' } },
                    { jid: { contains: '51981281297' } }
                ]
            }
        })

        console.log('--- WhatsAppContact Records ---')
        waContacts.forEach(c => {
            console.log(`ID: ${c.id}`)
            console.log(`Name: ${c.name}`)
            console.log(`JID: ${c.jid}`)
            console.log(`UnreadCount: ${c.unreadCount}`)
            console.log('-------------------------------')
        })

        // 2. Check ChatbotContact records
        const cbContacts = await prisma.chatbotContact.findMany({
            where: {
                OR: [
                    { displayName: { contains: 'Alberto', mode: 'insensitive' } },
                    { phone: { contains: '981281297' } }
                ]
            }
        })

        console.log('\n--- ChatbotContact Records ---')
        cbContacts.forEach(c => {
            console.log(`ID: ${c.id}`)
            console.log(`Name: ${c.displayName}`)
            console.log(`Phone: ${c.phone}`)
            console.log(`UnreadCount: ${c.unreadCount}`) // Check if this field exists/is used
            console.log('-------------------------------')
        })

        // 3. Check Message Counts (Fallback calculation)
        // The frontend fallback counts messages where role='assistant' (incoming) and readAt is null
        // Note: In backend, incoming messages usually have fromMe=false. 
        // The frontend logic `msg?.role === 'assistant'` implies incoming if using standard chat roles.

        const jid = '51981281297@s.whatsapp.net'

        const incomingMessages = await prisma.whatsAppMessage.count({
            where: {
                remoteJid: jid,
                fromMe: false
            }
        })

        const unreadMessages = await prisma.whatsAppMessage.count({
            where: {
                remoteJid: jid,
                fromMe: false,
                // Assuming there might be a read status or we just count all incoming if not tracked
            }
        })

        console.log('\n--- Message Counts ---')
        console.log(`JID: ${jid}`)
        console.log(`Total Incoming (fromMe=false): ${incomingMessages}`)

        // Check if there's any other JID that might be related
        const allMessagesCount = await prisma.whatsAppMessage.groupBy({
            by: ['remoteJid'],
            where: {
                fromMe: false
            },
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 5
        })

        console.log('\n--- Top 5 JIDs by Incoming Message Count ---')
        allMessagesCount.forEach(group => {
            console.log(`JID: ${group.remoteJid}, Count: ${group._count.id}`)
        })

        // 4. Search for the number 33
        console.log('\n--- Hunting for 33 ---')

        const wa33 = await prisma.whatsAppContact.findMany({
            where: { unreadCount: 33 }
        })
        console.log(`WhatsAppContacts with 33 unread: ${wa33.length}`)
        wa33.forEach(c => console.log(`  - ${c.name} (${c.jid})`))

        // Check Tenant ID
        console.log('\n--- Tenant IDs ---')
        const waContactsWithTenant = await prisma.whatsAppContact.findMany({
            where: {
                OR: [
                    { name: { contains: 'Alberto', mode: 'insensitive' } },
                    { jid: { contains: '51981281297' } }
                ]
            },
            select: {
                id: true,
                name: true,
                tenantId: true,
                unreadCount: true
            }
        })

        waContactsWithTenant.forEach(c => {
            console.log(`ID: ${c.id}`)
            console.log(`Name: ${c.name}`)
            console.log(`TenantID: ${c.tenantId}`)
            console.log(`UnreadCount: ${c.unreadCount}`)
            console.log('-------------------------------')
        })

        // Check ChatbotContact metadata
        console.log('\n--- ChatbotContact Metadata ---')
        const cbWithMeta = await prisma.chatbotContact.findMany({
            where: {
                OR: [
                    { displayName: { contains: 'Alberto', mode: 'insensitive' } },
                    { phone: { contains: '981281297' } }
                ]
            }
        })

        cbWithMeta.forEach(c => {
            console.log(`ID: ${c.id}`)
            console.log(`Name: ${c.displayName}`)
            console.log(`Metadata: ${JSON.stringify(c.metadata, null, 2)}`)
            console.log('-------------------------------')
        })

        // 5. Check Internal Messages (TenantUserChatMessage table)
        console.log('\n--- Internal Messages (TenantUserChatMessage table) ---')

        // Find User "Alberto Saco"
        const users = await prisma.user.findMany({
            where: {
                name: { contains: 'Alberto', mode: 'insensitive' }
            }
        })

        console.log(`Found ${users.length} Users matching "Alberto"`)
        users.forEach(u => {
            console.log(`User ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`)
        })

        if (users.length > 0) {
            const userIds = users.map(u => u.id)

            // Count unread messages SENT BY Alberto (where Alberto is sender and readAt is null)
            // Or unread messages RECEIVED BY Alberto?
            // Usually unread count is for messages RECEIVED by the current user from someone else.
            // But if the UI shows "Alberto Saco" with 33 unread, it means there are 33 messages FROM Alberto Saco that are unread.

            const unreadFromAlberto = await prisma.tenantUserChatMessage.count({
                where: {
                    senderId: { in: userIds },
                    readAt: null
                }
            })

            console.log(`Unread internal messages FROM Alberto Saco: ${unreadFromAlberto}`)

            if (unreadFromAlberto > 0) {
                console.log('  -> This matches the "33" unread count hypothesis!')
            }
        }

        // 6. Check Internal Messages (Message table)
        console.log('\n--- Internal Messages (Message table) ---')

        // Find conversations for Alberto
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { contactId: { in: waContacts.map(c => c.id) } },
                    { contactId: { in: cbContacts.map(c => c.id) } },
                    // Also check by user ID if possible, but we need to find the user first
                ]
            },
            include: {
                messages: {
                    where: {
                        readAt: null,
                        role: 'assistant' // Assuming incoming messages are 'assistant' or 'user'? 
                        // Actually, usually 'user' is the contact, 'assistant' is the bot/agent.
                        // Unread messages are usually from the contact ('user').
                    }
                }
            }
        })

        console.log(`Found ${conversations.length} conversations`)
        conversations.forEach(c => {
            console.log(`Conversation ID: ${c.id}`)
            console.log(`Contact ID: ${c.contactId}`)
            console.log(`Unread Messages Count: ${c.messages.length}`)
            console.log('-------------------------------')
        })

        // Check if any conversation has exactly 33 messages
        const conv33 = await prisma.message.groupBy({
            by: ['conversationId'],
            where: {
                readAt: null,
                role: 'user' // Messages from the contact
            },
            _count: { id: true },
            having: {
                id: { _count: { equals: 33 } }
            }
        })

        console.log(`Conversations with exactly 33 unread messages: ${conv33.length}`)
        conv33.forEach(c => console.log(`  - Conversation: ${c.conversationId}`))

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

diagnoseAlbertoUnread()
