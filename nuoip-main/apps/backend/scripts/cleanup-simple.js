const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanup() {
    console.log('🔍 Deleting old WhatsApp contacts...\n')

    const oldSessionId = 'session-1764575170092'

    try {
        const result = await prisma.whatsAppContact.deleteMany({
            where: { sessionId: oldSessionId }
        })

        console.log(`✅ Deleted ${result.count} old WhatsApp contacts`)
    } catch (error) {
        console.error('❌ Error deleting contacts:', error)
    } finally {
        await prisma.$disconnect()
    }
}

cleanup()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
