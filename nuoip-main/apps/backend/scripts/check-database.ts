/**
 * Check database connection and some basic table counts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function checkDatabase() {
    console.log('Checking database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')

    try {
        const tenantCount = await prisma.tenant.count()
        const userCount = await prisma.user.count()
        const chatbotContactCount = await prisma.chatbotContact.count()
        const waMessageCount = await prisma.whatsAppMessage.count()
        const waContactCount = await prisma.whatsAppContact.count()
        const waSessionCount = await prisma.whatsAppSession.count()

        console.log('\nTable Counts:')
        console.log(`  tenant: ${tenantCount}`)
        console.log(`  user: ${userCount}`)
        console.log(`  chatbotContact: ${chatbotContactCount}`)
        console.log(`  whatsAppMessage: ${waMessageCount}`)
        console.log(`  whatsAppContact: ${waContactCount}`)
        console.log(`  whatsAppSession: ${waSessionCount}`)

        // Check for any data in tables that might help identify the database
        if (tenantCount > 0) {
            const tenants = await prisma.tenant.findMany({ take: 3, select: { id: true, slug: true } })
            console.log('\nSample tenants:', tenants)
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkDatabase()
