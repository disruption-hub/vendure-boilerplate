// Script to list all WhatsApp sessions and contacts
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function listSessions() {
    try {
        console.log('=== Listing ALL WhatsApp Sessions ===\n')

        const sessions = await prisma.whatsAppSession.findMany({
            orderBy: { lastSync: 'desc' }
        })

        console.log(`Found ${sessions.length} sessions:\n`)

        for (const session of sessions) {
            const contactCount = await prisma.whatsAppContact.count({
                where: { sessionId: session.sessionId }
            })

            console.log(`Session: ${session.sessionId}`)
            console.log(`  Status: ${session.status}`)
            console.log(`  Tenant: ${session.tenantId}`)
            console.log(`  Name: ${session.name || 'N/A'}`)
            console.log(`  Contacts: ${contactCount}`)
            console.log(`  Last Sync: ${session.lastSync}`)
            console.log('')
        }

        console.log('\n=== Checking Orphaned Contacts ===\n')

        const missingSessionId = 'session-1764628788062'
        const orphanedContacts = await prisma.whatsAppContact.findMany({
            where: { sessionId: missingSessionId }
        })

        console.log(`Contacts linked to missing session ${missingSessionId}: ${orphanedContacts.length}`)

        if (orphanedContacts.length > 0) {
            console.log('\nOrphaned contacts:')
            orphanedContacts.forEach(contact => {
                console.log(`  - ${contact.jid} (${contact.name || 'No name'})`)
            })
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

listSessions()
