import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSession() {
    const tenantId = 'cmh9wylc60001tjs1qy2wm9ok'
    const sessionId = 'session-1764568598748'

    console.log(`Checking Tenant: ${tenantId}`)
    console.log(`Checking Session: ${sessionId}`)

    // 1. Check if session exists and is linked to tenant
    const session = await prisma.whatsAppSession.findUnique({
        where: { sessionId },
    })

    console.log('\nSession:', session)

    if (session?.tenantId !== tenantId) {
        console.log(`❌ Session tenantId (${session?.tenantId}) does NOT match expected tenantId (${tenantId})`)
    } else {
        console.log('✅ Session is linked to correct tenant')
    }

    // 2. Check contacts for this session
    const contacts = await prisma.whatsAppContact.findMany({
        where: { sessionId },
    })

    console.log(`\nFound ${contacts.length} contacts for this session:`)
    contacts.forEach(c => {
        console.log(`- ID: ${c.id}`)
        console.log(`  JID: ${c.jid}`)
        console.log(`  Phone: ${c.phoneNumber}`)
        console.log(`  ChatbotContactId: ${c.chatbotContactId}`)
        console.log(`  Is Orphaned (chatbotContactId is null): ${c.chatbotContactId === null}`)
    })

    await prisma.$disconnect()
}

checkSession().catch(console.error)
