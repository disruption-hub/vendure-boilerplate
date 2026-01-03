import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function checkBothLucias() {
    try {
        console.log('🔍 Checking BOTH Lucia JIDs...\n')

        const jid1 = '51980627302@s.whatsapp.net'
        const jid2 = '51916172368@s.whatsapp.net'

        // Check first JID
        const wa1 = await prisma.whatsAppContact.findFirst({
            where: { jid: jid1 },
            include: { user: true, chatbotContact: true }
        })

        console.log(`\n=== JID 1: ${jid1} ===`)
        if (wa1) {
            console.log('WhatsAppContact:', {
                id: wa1.id,
                name: wa1.name,
                phoneNumber: wa1.phoneNumber,
                tenantId: wa1.tenantId,
                linkedUser: wa1.user?.name || null,
                linkedChatbotContact: wa1.chatbotContact?.displayName || null
            })
        } else {
            console.log('❌ NOT FOUND in database')
        }

        // Check second JID
        const wa2 = await prisma.whatsAppContact.findFirst({
            where: { jid: jid2 },
            include: { user: true, chatbotContact: true }
        })

        console.log(`\n=== JID 2: ${jid2} ===`)
        if (wa2) {
            console.log('WhatsAppContact:', {
                id: wa2.id,
                name: wa2.name,
                phoneNumber: wa2.phoneNumber,
                tenantId: wa2.tenantId,
                linkedUser: wa2.user?.name || null,
                linkedChatbotContact: wa2.chatbotContact?.displayName || null
            })
        } else {
            console.log('❌ NOT FOUND in database')
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkBothLucias()
