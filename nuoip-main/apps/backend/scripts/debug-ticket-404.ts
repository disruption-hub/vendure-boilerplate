
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const ticketId = 'ba3b8769-ec05-4db6-b6fb-cf3930917b93'
    console.log(`Searching for ticket: ${ticketId}`)

    try {
        const ticket = await prisma.tickets.findUnique({
            where: { id: ticketId },
            include: {
                users_tickets_createdByIdTousers: true
            }
        })

        if (ticket) {
            console.log('✅ Ticket found:')
            console.log(JSON.stringify(ticket, null, 2))
        } else {
            console.log('❌ Ticket not found in database')
        }
    } catch (error) {
        console.error('Error querying ticket:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
