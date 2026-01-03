import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function checkUnreadMessages() {
    try {
        const albertoJid = '51981281297@s.whatsapp.net'
        const rodrigoJid = '51949833976@s.whatsapp.net'

        // Check Alberto's messages
        const albertoFromMe = await prisma.whatsAppMessage.count({
            where: {
                remoteJid: albertoJid,
                fromMe: true
            }
        })

        const albertoNotFromMe = await prisma.whatsAppMessage.count({
            where: {
                remoteJid: albertoJid,
                fromMe: false
            }
        })

        console.log('Alberto Saco messages:')
        console.log(`  - From me: ${albertoFromMe}`)
        console.log(`  - From contact: ${albertoNotFromMe}`)
        console.log(`  - Total: ${albertoFromMe + albertoNotFromMe}\n`)

        // Check Rodrigo's messages
        const rodrigoFromMe = await prisma.whatsAppMessage.count({
            where: {
                remoteJid: rodrigoJid,
                fromMe: true
            }
        })

        const rodrigoNotFromMe = await prisma.whatsAppMessage.count({
            where: {
                remoteJid: rodrigoJid,
                fromMe: false
            }
        })

        console.log('Rodrigo messages:')
        console.log(`  - From me: ${rodrigoFromMe}`)
        console.log(`  - From contact: ${rodrigoNotFromMe}`)
        console.log(`  - Total: ${rodrigoFromMe + rodrigoNotFromMe}\n`)

        // The unread count issue is likely because the frontend/backend
        // is counting fromMe:false messages as "unread"
        console.log('💡 The unread counts are likely being calculated from actual messages')
        console.log('   where fromMe=false (messages from the contact to you)')

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkUnreadMessages()
