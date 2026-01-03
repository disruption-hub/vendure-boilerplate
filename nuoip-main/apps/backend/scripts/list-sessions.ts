import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function listSessions() {
    try {
        console.log('🔍 Listing all WhatsAppSessions...')

        const sessions = await prisma.whatsAppSession.findMany({
            orderBy: { lastSync: 'desc' }
        })

        console.log(`Found ${sessions.length} sessions:`)
        sessions.forEach((s: any) => {
            console.log(`\n--- Session ID: ${s.sessionId} ---`)
            console.log(`Name: ${s.name}`)
            console.log(`Phone: ${s.phoneNumber}`)
            console.log(`Status: ${s.status}`)
            console.log(`Tenant: ${s.tenantId}`)
            console.log(`Last Sync: ${s.lastSync}`)
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

listSessions()
