import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSessionTenant() {
    const targetTenantId = 'cmh9wylc60001tjs1qy2wm9ok' // The tenant ID from logs
    const targetSessionId = 'session-1764568598748' // The session ID from logs

    console.log(`Checking Session: ${targetSessionId}`)

    const session = await prisma.whatsAppSession.findUnique({
        where: { sessionId: targetSessionId },
    })

    if (!session) {
        console.log('❌ Session not found!')
        return
    }

    console.log('Current Session Data:', session)

    if (session.tenantId !== targetTenantId) {
        console.log(`⚠️ Mismatch! Session tenantId (${session.tenantId}) != Target tenantId (${targetTenantId})`)

        // Update the session
        console.log('Fixing session tenantId...')
        await prisma.whatsAppSession.update({
            where: { sessionId: targetSessionId },
            data: { tenantId: targetTenantId },
        })
        console.log('✅ Session updated successfully!')
    } else {
        console.log('✅ Session tenantId matches target.')
    }

    // Also check if there are other sessions for this tenant
    const tenantSessions = await prisma.whatsAppSession.findMany({
        where: { tenantId: targetTenantId },
    })
    console.log(`\nTotal sessions for tenant ${targetTenantId}: ${tenantSessions.length}`)
    tenantSessions.forEach(s => console.log(`- ${s.sessionId} (${s.status})`))

    await prisma.$disconnect()
}

fixSessionTenant().catch(console.error)
