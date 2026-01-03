import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function diagnoseCurrentState() {
    try {
        console.log('🔍 CURRENT STATE CHECK\n')

        // Check all records for "Lucia"
        const users = await prisma.user.findMany({
            where: {
                name: { contains: 'Lucia', mode: 'insensitive' }
            },
            select: {
                id: true,
                name: true,
                phone: true,
                metadata: true
            }
        })

        console.log(`\n=== Users named 'Lucia': ${users.length} ===`)
        users.forEach(u => {
            const meta = u.metadata as any
            console.log({
                id: u.id,
                name: u.name,
                phone: u.phone,
                whatsappJid: meta?.whatsappJid,
                whatsappSessionId: meta?.whatsappSessionId
            })
        })

        const chatbotContacts = await prisma.chatbotContact.findMany({
            where: {
                displayName: { contains: 'Lucia', mode: 'insensitive' }
            },
            select: {
                id: true,
                displayName: true,
                phone: true,
                metadata: true
            }
        })

        console.log(`\n=== ChatbotContacts named 'Lucia': ${chatbotContacts.length} ===`)
        chatbotContacts.forEach(c => {
            const meta = c.metadata as any
            console.log({
                id: c.id,
                displayName: c.displayName,
                phone: c.phone,
                whatsappJid: meta?.whatsappJid,
                whatsappSessionId: meta?.whatsappSessionId
            })
        })

        const waContacts = await prisma.whatsAppContact.findMany({
            where: {
                name: { contains: 'Lucia', mode: 'insensitive' }
            },
            select: {
                id: true,
                jid: true,
                name: true,
                phoneNumber: true,
                userId: true,
                chatbotContactId: true
            }
        })

        console.log(`\n=== WhatsAppContacts named 'Lucia': ${waContacts.length} ===`)
        waContacts.forEach(w => {
            console.log({
                id: w.id,
                jid: w.jid,
                name: w.name,
                phoneNumber: w.phoneNumber,
                linkedUserId: w.userId,
                linkedChatbotContactId: w.chatbotContactId
            })
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

diagnoseCurrentState()
