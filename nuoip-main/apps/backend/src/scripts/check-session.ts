
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSession() {
    const missingSessionId = 'session-1764628788062'
    console.log(`Checking missing session: ${missingSessionId}`)

    const session = await prisma.whatsAppSession.findUnique({
        where: { sessionId: missingSessionId }
    })

    if (session) {
        console.log('✅ Session found:', session)
    } else {
        console.log('❌ Session NOT found')
    }

    console.log('\nListing ALL sessions in DB:')
    const allSessions = await prisma.whatsAppSession.findMany({
        orderBy: { lastSync: 'desc' }
    })

    for (const s of allSessions) {
        const contactCount = await prisma.whatsAppContact.count({
            where: { sessionId: s.sessionId }
        })
        console.log(`- ${s.sessionId} (Status: ${s.status}, Tenant: ${s.tenantId}, Contacts: ${contactCount}, Name: ${s.name})`)
    }

    console.log('\nChecking contacts linked to missing session:')
    const contacts = await prisma.whatsAppContact.findMany({
        where: { sessionId: missingSessionId }
    })
    console.log(`Found ${contacts.length} contacts linked to ${missingSessionId}`)
    contacts.forEach((c: any) => {
        console.log(`- ${c.jid} (ID: ${c.id}, Name: ${c.name})`)
    })
}

checkSession()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
