import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLuciaContacts() {
    try {
        const contacts = await prisma.chatbotContact.findMany({
            where: {
                OR: [
                    { name: { contains: 'Lucia', mode: 'insensitive' } },
                    { displayName: { contains: 'Lucia', mode: 'insensitive' } },
                ],
            },
            include: {
                whatsappContact: true,
                tenantUser: true,
            },
        })

        console.log(`\nFound ${contacts.length} contacts matching "Lucia":\n`)

        contacts.forEach((contact, index) => {
            console.log(`\n--- Contact ${index + 1} ---`)
            console.log(`ID: ${contact.id}`)
            console.log(`Name: ${contact.name}`)
            console.log(`Display Name: ${contact.displayName}`)
            console.log(`Type: ${contact.type}`)
            console.log(`Phone: ${contact.phone || 'N/A'}`)
            console.log(`Email: ${contact.email || 'N/A'}`)
            console.log(`Description: ${contact.description || 'N/A'}`)
            console.log(`Tenant ID: ${contact.tenantId}`)
            console.log(`Created: ${contact.createdAt}`)
            console.log(`Updated: ${contact.updatedAt}`)

            if (contact.metadata && typeof contact.metadata === 'object') {
                console.log(`Metadata:`)
                console.log(JSON.stringify(contact.metadata, null, 2))
            }

            if (contact.whatsappContact) {
                console.log(`WhatsApp Contact:`)
                console.log(`  - JID: ${contact.whatsappContact.jid}`)
                console.log(`  - Session ID: ${contact.whatsappContact.sessionId}`)
                console.log(`  - Push Name: ${contact.whatsappContact.pushName || 'N/A'}`)
            }

            if (contact.tenantUser) {
                console.log(`Tenant User:`)
                console.log(`  - User ID: ${contact.tenantUser.id}`)
                console.log(`  - Email: ${contact.tenantUser.email}`)
            }
        })

        console.log('\n\n=== SUMMARY ===')
        console.log(`Total Lucia contacts: ${contacts.length}`)
        console.log(`By type:`)
        const typeCount = contacts.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1
            return acc
        }, {} as Record<string, number>)
        console.log(typeCount)

        console.log(`\nWith WhatsApp: ${contacts.filter(c => c.whatsappContact).length}`)
        console.log(`With Tenant User: ${contacts.filter(c => c.tenantUser).length}`)

        // Check for duplicate JIDs
        const jids = contacts
            .map(c => c.whatsappContact?.jid)
            .filter(Boolean)
        const uniqueJids = new Set(jids)

        if (jids.length !== uniqueJids.size) {
            console.log(`\n⚠️  WARNING: Duplicate WhatsApp JIDs detected!`)
            console.log(`Total JIDs: ${jids.length}, Unique JIDs: ${uniqueJids.size}`)
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkLuciaContacts()
