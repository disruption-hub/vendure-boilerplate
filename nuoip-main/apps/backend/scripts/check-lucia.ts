import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function checkLuciaContacts() {
    try {
        console.log('🔍 DIAGNOSTIC: Checking current state...')

        const searchJid = '51916172368'

        // 1. Check WhatsAppContact
        const waContacts = await prisma.whatsAppContact.findMany({
            where: { jid: { contains: searchJid } },
            include: { user: true, chatbotContact: true }
        })
        console.log(`\n1. WhatsAppContacts (JID ${searchJid}): ${waContacts.length}`)
        waContacts.forEach((wc: any) => {
            console.log(`   - JID: ${wc.jid}`)
            console.log(`     Linked User: ${wc.user?.name} (${wc.userId})`)
            console.log(`     Linked Contact: ${wc.chatbotContact?.displayName} (${wc.chatbotContactId})`)
        })

        // 2. Check Users with Metadata
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: 'Lucia', mode: 'insensitive' } },
                    { metadata: { path: ['whatsappJid'], string_contains: searchJid } }
                ]
            }
        })
        console.log(`\n2. Users (Name 'Lucia' OR Metadata JID): ${users.length}`)
        users.forEach((u: any) => {
            console.log(`   - ${u.name} (${u.id})`)
            console.log(`     Metadata:`, JSON.stringify(u.metadata))
        })

        // 3. Check ChatbotContacts with Metadata
        const contacts = await prisma.chatbotContact.findMany({
            where: {
                OR: [
                    { displayName: { contains: 'Lucia', mode: 'insensitive' } },
                    { metadata: { path: ['whatsappJid'], string_contains: searchJid } },
                    { phone: { contains: searchJid } } // Also check by phone to see if I missed clearing something
                ]
            }
        })
        console.log(`\n3. ChatbotContacts (Name 'Lucia' OR Metadata JID OR Phone): ${contacts.length}`)
        contacts.forEach((c: any) => {
            console.log(`   - ${c.displayName} (${c.id})`)
            console.log(`     Phone: ${c.phone}`)
            console.log(`     Metadata:`, JSON.stringify(c.metadata))
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkLuciaContacts()
