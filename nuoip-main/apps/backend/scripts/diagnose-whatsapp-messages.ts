/**
 * Diagnostic script to check WhatsApp messages for a specific JID
 * Run with: npx ts-node scripts/diagnose-whatsapp-messages.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function diagnose() {
    // The JID from the logs
    const targetJid = '51981281297@s.whatsapp.net'
    const targetSessionId = 'session-1764628788062'

    console.log('='.repeat(60))
    console.log('WhatsApp Message Diagnostics')
    console.log('='.repeat(60))

    // 1. Check if the session exists
    console.log('\n1. Checking WhatsApp Sessions:')
    const sessions = await prisma.whatsAppSession.findMany({
        select: {
            sessionId: true,
            tenantId: true,
            status: true,
            isActive: true,
            phoneNumber: true,
        }
    })
    console.log(`   Found ${sessions.length} sessions:`)
    sessions.forEach(s => {
        console.log(`   - ${s.sessionId} | tenant: ${s.tenantId} | status: ${s.status} | active: ${s.isActive}`)
    })

    // 2. Check messages by JID (without session filter)
    console.log('\n2. Checking messages by JID (no session filter):')
    const messagesByJid = await prisma.whatsAppMessage.findMany({
        where: {
            OR: [
                { remoteJid: targetJid },
                { remoteJid: { contains: '51981281297' } },
            ]
        },
        select: {
            id: true,
            sessionId: true,
            messageId: true,
            remoteJid: true,
            fromMe: true,
            content: true,
            timestamp: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
    })
    console.log(`   Found ${messagesByJid.length} messages for JID containing '51981281297':`)
    messagesByJid.forEach(m => {
        console.log(`   - [${m.fromMe ? 'OUT' : 'IN'}] ${m.remoteJid} | session: ${m.sessionId} | ${m.content?.substring(0, 40)}...`)
    })

    // 3. Check all unique sessionIds in messages
    console.log('\n3. Checking unique sessionIds in WhatsAppMessage table:')
    const uniqueSessionIds = await prisma.whatsAppMessage.groupBy({
        by: ['sessionId'],
        _count: { id: true },
    })
    console.log(`   Found ${uniqueSessionIds.length} unique sessionIds:`)
    uniqueSessionIds.forEach(s => {
        console.log(`   - ${s.sessionId}: ${s._count.id} messages`)
    })

    // 4. Check messages for the specific sessionId
    console.log(`\n4. Checking messages for sessionId: ${targetSessionId}:`)
    const messagesBySession = await prisma.whatsAppMessage.findMany({
        where: { sessionId: targetSessionId },
        select: {
            id: true,
            remoteJid: true,
            fromMe: true,
            content: true,
            timestamp: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
    })
    console.log(`   Found ${messagesBySession.length} messages for session ${targetSessionId}:`)
    messagesBySession.forEach(m => {
        console.log(`   - [${m.fromMe ? 'OUT' : 'IN'}] ${m.remoteJid} | ${m.content?.substring(0, 40)}...`)
    })

    // 5. Check WhatsAppContact for this JID
    console.log('\n5. Checking WhatsAppContact for this JID:')
    const contacts = await prisma.whatsAppContact.findMany({
        where: {
            OR: [
                { jid: targetJid },
                { jid: { contains: '51981281297' } },
                { phoneNumber: { contains: '51981281297' } },
            ]
        },
        select: {
            id: true,
            jid: true,
            sessionId: true,
            tenantId: true,
            chatbotContactId: true,
            name: true,
            phoneNumber: true,
        }
    })
    console.log(`   Found ${contacts.length} WhatsApp contacts:`)
    contacts.forEach(c => {
        console.log(`   - ${c.jid} | session: ${c.sessionId} | tenant: ${c.tenantId} | chatbotId: ${c.chatbotContactId}`)
    })

    // 6. Check total message count
    console.log('\n6. Total message counts:')
    const totalMessages = await prisma.whatsAppMessage.count()
    console.log(`   Total WhatsAppMessage records: ${totalMessages}`)

    console.log('\n' + '='.repeat(60))
}

diagnose()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
