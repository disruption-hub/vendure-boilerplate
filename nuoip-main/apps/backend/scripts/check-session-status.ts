
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const sessionId = 'session-1765432698322'
    console.log(`Checking session ${sessionId}...`)

    const session = await prisma.whatsAppSession.findUnique({
        where: { sessionId }
    })

    if (session) {
        console.log('Session found:', session)
    } else {
        console.log('Session NOT found in this database.')

        // List recent sessions to see if we are in the right DB
        const recent = await prisma.whatsAppSession.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { sessionId: true, status: true, createdAt: true }
        })
        console.log('Recent sessions in this DB:', recent)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
