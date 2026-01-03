import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkWhatsAppMessages() {
    console.log('=== Checking WhatsApp Messages in Database ===\n')

    // Get all WhatsApp messages
    const messages = await prisma.whatsAppMessage.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20,
        select: {
            id: true,
            sessionId: true,
            messageId: true,
            remoteJid: true,
            fromMe: true,
            content: true,
            timestamp: true,
            status: true,
            createdAt: true,
        },
    })

    console.log(`Found ${messages.length} WhatsApp messages in database\n`)

    if (messages.length > 0) {
        console.log('Recent messages:')
        messages.forEach((msg, i) => {
            console.log(`\n${i + 1}. Message ID: ${msg.messageId}`)
            console.log(`   Remote JID: ${msg.remoteJid}`)
            console.log(`   From Me: ${msg.fromMe}`)
            console.log(`   Content: ${msg.content?.substring(0, 50) || 'N/A'}`)
            console.log(`   Timestamp: ${msg.timestamp}`)
            console.log(`   Created At: ${msg.createdAt}`)
            console.log(`   Status: ${msg.status}`)
        })
    } else {
        console.log('❌ NO MESSAGES FOUND IN DATABASE')
    }

    console.log('\n=== Checking WhatsApp Contacts ===\n')

    // Get all WhatsApp contacts
    const contacts = await prisma.whatsAppContact.findMany({
        orderBy: { lastMessageAt: 'desc' },
        take: 10,
        select: {
            id: true,
            sessionId: true,
            jid: true,
            name: true,
            phoneNumber: true,
            lastMessageAt: true,
            unreadCount: true,
            chatbotContactId: true,
        },
    })

    console.log(`Found ${contacts.length} WhatsApp contacts in database\n`)

    if (contacts.length > 0) {
        console.log('Recent contacts:')
        contacts.forEach((contact, i) => {
            console.log(`\n${i + 1}. Contact ID: ${contact.id}`)
            console.log(`   JID: ${contact.jid}`)
            console.log(`   Name: ${contact.name || 'N/A'}`)
            console.log(`   Phone: ${contact.phoneNumber || 'N/A'}`)
            console.log(`   Last Message: ${contact.lastMessageAt}`)
            console.log(`   Unread Count: ${contact.unreadCount}`)
            console.log(`   Linked to ChatbotContact: ${contact.chatbotContactId ? 'Yes (' + contact.chatbotContactId + ')' : 'No (ORPHANED)'}`)
        })
    } else {
        console.log('❌ NO CONTACTS FOUND IN DATABASE')
    }

    await prisma.$disconnect()
}

checkWhatsAppMessages().catch(console.error)
