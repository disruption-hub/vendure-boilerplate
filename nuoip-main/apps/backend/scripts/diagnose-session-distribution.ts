import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

async function main() {
    console.log('📊 Diagnosing Session Distribution')

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        console.error('DATABASE_URL not found')
        return
    }

    const pool = new Pool({ connectionString: databaseUrl })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
        // 1. Get Tenants with WhatsApp Data
        const tenants = await prisma.whatsAppSession.groupBy({
            by: ['tenantId'],
            _count: { sessionId: true }
        })

        console.log(`Found ${tenants.length} tenants with WhatsApp sessions.`)

        for (const t of tenants) {
            const tenantId = t.tenantId
            console.log(`\n🏢 Tenant: ${tenantId}`)

            // Get all sessions
            const sessions = await prisma.whatsAppSession.findMany({
                where: { tenantId },
                orderBy: { updatedAt: 'desc' },
                include: {
                    _count: {
                        select: { whatsapp_messages: true, whatsapp_contacts: true }
                    }
                }
            })

            console.log(`   Sessions (${sessions.length}):`)
            sessions.forEach(s => {
                console.log(`   - [${s.status}] ${s.sessionId} (LastSync: ${s.lastSync?.toISOString()})`)
                console.log(`     Messages: ${s._count.whatsapp_messages}`)
                console.log(`     Contacts: ${s._count.whatsapp_contacts}`)
            })

            // Check for "Orphaned" Data (if any - though schema usually cascades delete, 
            // effectively orphaned data shouldn't exist unless valid session but not 'active')

            // Let's look for Contacts that might be on a "Deleted/Archived" session but Messages on "Active"?
            // Or vice-versa.

            const activeSession = sessions.find(s => s.status === 'CONNECTED' || s.status === 'QR_REQUIRED')
            const activeSessionId = activeSession?.sessionId

            if (activeSessionId) {
                console.log(`   ✅ Active Session: ${activeSessionId}`)

                // Check count of contacts NOT on active session
                const strayContacts = await prisma.whatsAppContact.count({
                    where: { tenantId, sessionId: { not: activeSessionId } }
                })
                console.log(`   ⚠️  Contacts NOT on active session: ${strayContacts}`)

                if (strayContacts > 0) {
                    const examples = await prisma.whatsAppContact.findMany({
                        where: { tenantId, sessionId: { not: activeSessionId } },
                        take: 3,
                        select: { jid: true, sessionId: true, name: true }
                    })
                    examples.forEach(c => console.log(`      - ${c.name} (${c.jid}) on ${c.sessionId}`))
                }

                // Check count of messages NOT on active session
                const strayMessages = await prisma.whatsAppMessage.count({
                    where: { sessionId: { in: sessions.map(s => s.sessionId), not: activeSessionId } }
                })
                console.log(`   ⚠️  Messages NOT on active session: ${strayMessages}`)
            } else {
                console.log(`   ❌ No Active Session Found`)
            }
        }

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

main()
