import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function deleteRodrigo() {
    try {
        const targetJid = '51949833976@s.whatsapp.net'
        console.log(`🔍 Searching for Rodrigo (${targetJid})...`)

        // 1. Find WhatsAppContact
        const waContacts = await prisma.whatsAppContact.findMany({
            where: { jid: targetJid }
        })

        console.log(`Found ${waContacts.length} WhatsAppContact records`)

        // 2. Find ChatbotContact
        const chatbotContacts = await prisma.chatbotContact.findMany({
            where: {
                OR: [
                    { phone: '51949833976' },
                    { phone: '949833976' }, // Try without country code too
                    { displayName: { contains: 'Rodrigo' } }
                ]
            }
        })

        console.log(`Found ${chatbotContacts.length} ChatbotContact records`)

        // 3. Delete Messages
        const deletedMessages = await prisma.whatsAppMessage.deleteMany({
            where: { remoteJid: targetJid }
        })
        console.log(`✅ Deleted ${deletedMessages.count} messages`)

        // 4. Delete WhatsAppContacts
        const deletedWaContacts = await prisma.whatsAppContact.deleteMany({
            where: { jid: targetJid }
        })
        console.log(`✅ Deleted ${deletedWaContacts.count} WhatsAppContact records`)

        // 5. Delete ChatbotContacts
        for (const contact of chatbotContacts) {
            // Check if linked to other things before deleting? 
            // For now, just delete as requested
            await prisma.chatbotContact.delete({
                where: { id: contact.id }
            })
            console.log(`✅ Deleted ChatbotContact: ${contact.id} (${contact.name || 'No Name'})`)
        }

        console.log('🎉 Rodrigo deletion complete')

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

deleteRodrigo()
