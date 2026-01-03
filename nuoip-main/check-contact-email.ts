
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking recent contacts for email field...')

    const contacts = await prisma.chatbotContact.findMany({
        where: {
            email: { not: null }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
    })

    console.log(`Found ${contacts.length} contacts with email:`)
    contacts.forEach(c => {
        console.log(`- ${c.displayName}: ${c.email} (UpdatedAt: ${c.updatedAt})`)
    })

    if (contacts.length === 0) {
        console.log('No contacts found with email. Checking a specific contact if you have an ID...')
        // List some recent contacts to see if they should have email
        const recent = await prisma.chatbotContact.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' }
        })
        console.log('Recent contacts (without filter):')
        recent.forEach(c => {
            console.log(`- ${c.displayName}: [${c.email}] (ID: ${c.id})`)
        })
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
