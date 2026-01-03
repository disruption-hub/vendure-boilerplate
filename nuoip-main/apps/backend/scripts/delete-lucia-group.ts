import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function deleteGroupLucia() {
    try {
        const groupJid = '120363396684753504@g.us'
        const contactId = 'cmipab3ec003e01plnq9msoqe'

        console.log(`🔍 Deleting WhatsApp group: ${groupJid}\n`)

        // 1. Check and delete WhatsAppContact
        const waContact = await prisma.whatsAppContact.findFirst({
            where: { jid: groupJid }
        })

        if (waContact) {
            console.log('Found WhatsAppContact:', {
                id: waContact.id,
                jid: waContact.jid,
                name: waContact.name
            })
        }

        // 2. Check and delete ChatbotContact
        const chatbotContact = await prisma.chatbotContact.findUnique({
            where: { id: contactId }
        })

        if (chatbotContact) {
            console.log('Found ChatbotContact:', {
                id: chatbotContact.id,
                displayName: chatbotContact.displayName
            })
        }

        // 3. Check messages count
        const messagesCount = await prisma.whatsAppMessage.count({
            where: { remoteJid: groupJid }
        })

        console.log(`Found ${messagesCount} WhatsApp messages for this group\n`)

        // Execute deletions in transaction
        const result = await prisma.$transaction(async (tx) => {
            const stats = {
                messages: 0,
                whatsappContact: false,
                chatbotContact: false
            }

            // Delete messages
            if (messagesCount > 0) {
                const deleted = await tx.whatsAppMessage.deleteMany({
                    where: { remoteJid: groupJid }
                })
                stats.messages = deleted.count
            }

            // Delete WhatsAppContact
            if (waContact) {
                await tx.whatsAppContact.delete({
                    where: { id: waContact.id }
                })
                stats.whatsappContact = true
            }

            // Delete ChatbotContact
            if (chatbotContact) {
                await tx.chatbotContact.delete({
                    where: { id: contactId }
                })
                stats.chatbotContact = true
            }

            return stats
        })

        console.log('\n✅ DELETION COMPLETE:')
        console.log(`   - Deleted ${result.messages} WhatsApp messages`)
        console.log(`   - Deleted WhatsAppContact: ${result.whatsappContact}`)
        console.log(`   - Deleted ChatbotContact: ${result.chatbotContact}`)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

deleteGroupLucia()
