import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tenantId = 'cmh9wylc60001tjs1qy2wm9ok'
    const contactId = 'cmiq29mr4001den8ze6k9bdaz'

    console.log('Checking for contact', { tenantId, contactId })

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
    })
    console.log('Tenant exists:', !!tenant)

    const contact = await prisma.chatbotContact.findUnique({
        where: { id: contactId },
    })
    console.log('Contact exists (by ID only):', !!contact)
    if (contact) {
        console.log('Contact tenantId:', contact.tenantId)
    }

    const contactInTenant = await prisma.chatbotContact.findFirst({
        where: {
            id: contactId,
            tenantId: tenantId,
        },
    })
    console.log('Contact exists in tenant:', !!contactInTenant)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
