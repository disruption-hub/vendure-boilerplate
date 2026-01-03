import { PrismaClient } from '../../packages/prisma/generated/client'

const prisma = new PrismaClient()

async function main() {
    const searchPhone = '272593504436465'

    console.log(`\n=== Searching for messages with JID containing: ${searchPhone} ===\n`)

    // Check for messages with this phone number in the JID
    const messages = await prisma.whatsAppMessage.findMany({
        where: {
            remoteJid: { contains: searchPhone }
        },
        select: {
            id: true,
            sessionId: true,
            remoteJid: true,
            content: true,
            fromMe: true,
            timestamp: true,
        },
        take: 20,
        orderBy: { timestamp: 'desc' }
    })

    console.log('Messages found:', messages.length)
    messages.forEach(m => {
        console.log(`[${m.timestamp}] Session: ${m.sessionId} | JID: ${m.remoteJid} | fromMe: ${m.fromMe}`)
        console.log(`  Content: ${m.content?.substring(0, 80)}`)
    })

    // Also check WhatsAppContact
    console.log(`\n=== Checking WhatsAppContact table ===\n`)
    const contacts = await prisma.whatsAppContact.findMany({
        where: {
            OR: [
                { jid: { contains: searchPhone } },
                { phoneNumber: { contains: searchPhone } },
                { id: searchPhone },
            ]
        },
        select: {
            id: true,
            jid: true,
            phoneNumber: true,
            sessionId: true,
            name: true,
            tenantId: true,
        }
    })

    console.log('WhatsApp Contacts found:', contacts.length)
    contacts.forEach(c => console.log(c))

    // Check total message count
    console.log(`\n=== Total message counts ===\n`)
    const totalMessages = await prisma.whatsAppMessage.count()
    console.log('Total WhatsApp messages in database:', totalMessages)

    // Get a sample of recent messages to see what JIDs exist
    console.log(`\n=== Sample of recent messages (last 10) ===\n`)
    const recentMessages = await prisma.whatsAppMessage.findMany({
        select: {
            remoteJid: true,
            sessionId: true,
            timestamp: true,
        },
        take: 10,
        orderBy: { timestamp: 'desc' }
    })
    recentMessages.forEach(m => {
        console.log(`${m.timestamp} | Session: ${m.sessionId} | JID: ${m.remoteJid}`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
