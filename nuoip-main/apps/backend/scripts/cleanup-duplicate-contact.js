// Cleanup duplicate WhatsApp contacts
// This script deletes the old duplicate contact for JID 51981281297@s.whatsapp.net

const { PrismaClient } = require('../../../packages/prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Searching for duplicate contacts for JID: 51981281297@s.whatsapp.net')

    // Find all contacts with this JID
    const contacts = await prisma.whatsAppContact.findMany({
        where: {
            jid: '51981281297@s.whatsapp.net'
        },
        select: {
            id: true,
            sessionId: true,
            jid: true,
            name: true,
            createdAt: true,
            chatbotContactId: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    console.log(`Found ${contacts.length} contacts:`)
    contacts.forEach((c, i) => {
        console.log(`  ${i + 1}. ID: ${c.id}, Session: ${c.sessionId}, Created: ${c.createdAt}`)
    })

    if (contacts.length <= 1) {
        console.log('✅ No duplicates found, nothing to clean up!')
        return
    }

    // Delete the OLD contact (from session-1764606877888)
    const oldContact = contacts.find(c => c.sessionId === 'session-1764606877888')

    if (!oldContact) {
        console.log('⚠️ Old contact from session-1764606877888 not found. Skipping deletion.')
        return
    }

    console.log(`🗑️ Deleting old contact: ${oldContact.id} from session ${oldContact.sessionId}`)

    const deleted = await prisma.whatsAppContact.delete({
        where: {
            id: oldContact.id
        }
    })

    console.log(`✅ Successfully deleted contact: ${deleted.id}`)

    // Verify only one remains
    const remaining = await prisma.whatsAppContact.findMany({
        where: {
            jid: '51981281297@s.whatsapp.net'
        }
    })

    console.log(`\n✅ Cleanup complete! Remaining contacts: ${remaining.length}`)
    remaining.forEach((c, i) => {
        console.log(`  ${i + 1}. Session: ${c.sessionId}, Created: ${c.createdAt}`)
    })
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
