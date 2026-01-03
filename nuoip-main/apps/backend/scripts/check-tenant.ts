import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function checkTenant() {
    try {
        const jid = '51916172368@s.whatsapp.net'
        const waContact = await prisma.whatsAppContact.findFirst({
            where: { jid },
            include: { user: true }
        })

        if (waContact) {
            console.log('WhatsAppContact:', {
                id: waContact.id,
                jid: waContact.jid,
                tenantId: waContact.tenantId,
                userId: waContact.userId,
                userTenantId: waContact.user?.tenantId
            })
        } else {
            console.log('WhatsAppContact not found')
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkTenant()
