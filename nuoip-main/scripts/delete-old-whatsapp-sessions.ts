import { PrismaClient } from '../packages/prisma/index.js'

const prisma = new PrismaClient()

async function deleteOldWhatsAppSessions() {
    console.log('🔍 Finding old WhatsApp contact records...')

    // Find all WhatsAppContacts with the old session ID
    const oldSessionId = 'session-1764575170092'
    const newSessionId = 'session-1764595243929'

    const oldContacts = await prisma.whatsAppContact.findMany({
        where: {
            sessionId: oldSessionId
        },
        select: {
            id: true,
            jid: true,
            phoneNumber: true,
            sessionId: true,
            name: true
        }
    })

    console.log(`📊 Found ${oldContacts.length} old contacts:`)
    oldContacts.forEach(c => {
        console.log(`  - ${c.jid} (${c.phoneNumber}) - ${c.name || 'No name'}`)
    })

    if (oldContacts.length === 0) {
        console.log('✅ No old contacts to delete')
        return
    }

    console.log(`\n🗑️  Deleting ${oldContacts.length} old WhatsApp contacts...`)

    const result = await prisma.whatsAppContact.deleteMany({
        where: {
            sessionId: oldSessionId
        }
    })

    console.log(`✅ Deleted ${result.count} old WhatsApp contacts`)

    // Show remaining contacts
    const remaining = await prisma.whatsAppContact.findMany({
        where: {
            sessionId: newSessionId
        },
        select: {
            id: true,
            jid: true,
            phoneNumber: true,
            sessionId: true,
            name: true
        }
    })

    console.log(`\n📊 Remaining contacts with new session (${newSessionId}):`)
    remaining.forEach(c => {
        console.log(`  - ${c.jid} (${c.phoneNumber}) - ${c.name || 'No name'}`)
    })
}

deleteOldWhatsAppSessions()
    .then(() => {
        console.log('\n✅ Cleanup complete!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Error:', error)
        process.exit(1)
    })
