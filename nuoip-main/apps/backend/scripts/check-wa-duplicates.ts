import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function checkWhatsAppDuplicates() {
    try {
        console.log('🔍 Checking for duplicate WhatsAppContacts...')

        const searchJid = '51916172368'

        // 1. Check all WhatsAppContacts with this JID (partial or full)
        const waContacts = await prisma.whatsAppContact.findMany({
            where: {
                OR: [
                    { jid: { contains: searchJid } },
                    { name: { contains: 'Lucia', mode: 'insensitive' } }
                ]
            },
            include: {
                user: true,
                chatbotContact: true
            }
        })

        console.log(`Found ${waContacts.length} WhatsAppContacts:`)
        waContacts.forEach((wc: any) => {
            console.log(`\n--- ID: ${wc.id} ---`)
            console.log(`JID: ${wc.jid}`)
            console.log(`Name: ${wc.name}`)
            console.log(`Session ID: ${wc.sessionId}`)
            console.log(`Linked User: ${wc.user?.name} (${wc.userId})`)
            console.log(`Linked Contact: ${wc.chatbotContact?.displayName} (${wc.chatbotContactId})`)
            console.log(`Created At: ${wc.createdAt}`)
        })

        // 2. Check ALL ChatbotContacts with name "Lucia"
        console.log('\n🔍 Checking ALL ChatbotContacts with name "Lucia"...')
        const contacts = await prisma.chatbotContact.findMany({
            where: {
                displayName: { contains: 'Lucia', mode: 'insensitive' }
            }
        })

        console.log(`Found ${contacts.length} ChatbotContacts:`)
        contacts.forEach((c: any) => {
            console.log(`\n--- ID: ${c.id} ---`)
            console.log(`Name: ${c.name}`)
            console.log(`Display Name: ${c.displayName}`)
            console.log(`Phone: ${c.phone}`)
            console.log(`Type: ${c.type}`)
            console.log(`Metadata:`, JSON.stringify(c.metadata))
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkWhatsAppDuplicates()
