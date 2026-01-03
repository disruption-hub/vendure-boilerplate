import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function deleteDuplicateContacts() {
    try {
        console.log('🗑️ Deleting duplicate ChatbotContacts...')

        const contactsToDelete = [
            'cmigbet91001o01qazey1ydh3', // MatMax
            'cmip7o3dt001901qv0vxxcfj7'  // Alberto Saco
        ]

        const result = await prisma.chatbotContact.deleteMany({
            where: {
                id: { in: contactsToDelete }
            }
        })

        console.log(`✅ Deleted ${result.count} contacts.`)
        console.log('IDs deleted:', contactsToDelete.join(', '))

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

deleteDuplicateContacts()
