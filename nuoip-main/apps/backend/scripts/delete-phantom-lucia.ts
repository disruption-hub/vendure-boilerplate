import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function deletePhantomLucia() {
    try {
        const phantomJid = '51980627302@s.whatsapp.net'

        console.log(`🔍 Searching for data related to phantom JID: ${phantomJid}\n`)

        // 1. Check for WhatsApp messages
        const messages = await prisma.whatsAppMessage.findMany({
            where: { remoteJid: phantomJid },
            select: { id: true, messageId: true, content: true, timestamp: true }
        })

        console.log(`Found ${messages.length} WhatsApp messages`)
        if (messages.length > 0) {
            console.log('Sample messages:', messages.slice(0, 3).map(m => ({
                id: m.id,
                messageId: m.messageId,
                preview: m.content?.substring(0, 50),
                timestamp: m.timestamp
            })))
        }

        // 2. Check for WhatsAppContact (should be none based on previous check)
        const waContact = await prisma.whatsAppContact.findFirst({
            where: { jid: phantomJid }
        })

        console.log(`\nWhatsAppContact: ${waContact ? 'EXISTS' : 'NOT FOUND'}`)

        // 3. Check for ChatbotContact with this phone
        const chatbotContact = await prisma.chatbotContact.findFirst({
            where: {
                OR: [
                    { phone: { contains: '51980627302' } },
                    { phone: { contains: '980627302' } }
                ]
            }
        })

        console.log(`ChatbotContact with phone: ${chatbotContact ? `EXISTS (${chatbotContact.displayName})` : 'NOT FOUND'}`)

        // Ask for confirmation before deleting
        console.log('\n=== DELETION PLAN ===')
        console.log(`- Delete ${messages.length} WhatsApp messages`)
        if (waContact) console.log('- Delete WhatsAppContact record')
        if (chatbotContact) console.log(`- Delete ChatbotContact: ${chatbotContact.displayName}`)

        // DELETE MESSAGES
        if (messages.length > 0) {
            const deleted = await prisma.whatsAppMessage.deleteMany({
                where: { remoteJid: phantomJid }
            })
            console.log(`\n✅ Deleted ${deleted.count} WhatsApp messages`)
        }

        // DELETE WhatsAppContact if exists
        if (waContact) {
            await prisma.whatsAppContact.delete({
                where: { id: waContact.id }
            })
            console.log('✅ Deleted WhatsAppContact')
        }

        // DELETE ChatbotContact if exists
        if (chatbotContact) {
            await prisma.chatbotContact.delete({
                where: { id: chatbotContact.id }
            })
            console.log('✅ Deleted ChatbotContact')
        }

        console.log('\n✅ Cleanup complete!')

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

deletePhantomLucia()
