import { PrismaService } from '../src/prisma/prisma.service'
import { ConfigService } from '@nestjs/config'

// Mock ConfigService
const configService = new ConfigService({
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:P9M0apRhFKNGf3AjCwYPQ2XzLNR.g2FA@yamabiko.proxy.rlwy.net:10585/railway'
})

// Instantiate service logic directly
const prisma = new PrismaService(configService)

async function resetPhoneNumber(phone: string) {
    // Normalize phone number to just digits
    const normalized = phone.replace(/\D/g, '')

    console.log(`Searching for phone numbers ending in ${normalized}...`)

    // Manually connect
    await prisma.onModuleInit()

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { phone: { contains: normalized } },
                { normalizedPhone: { contains: normalized } }
            ]
        },
        include: {
            chatbotPhoneUser: true
        }
    })

    console.log(`Found ${users.length} users`)

    for (const user of users) {
        console.log(`User: ${user.id} (${user.name}) - Phone: ${user.phone}`)

        // Ensure properly approved
        await prisma.user.update({
            where: { id: user.id },
            data: {
                approvalStatus: 'approved',
                chatbotAccessStatus: 'approved',
                status: 'active'
            }
        })
        console.log(`Updated user access status`)
    }

    if (users.length === 0) {
        console.log('No user found. Creating one...')
        const newUser = await prisma.user.create({
            data: {
                email: 'test@example.com',
                name: 'Test User',
                role: 'ADMIN',
                tenantId: 'cmh9wylc60001tjs1qy2wm9ok',
                phone: normalized,
                normalizedPhone: '+' + normalized,
                approvalStatus: 'approved',
                chatbotAccessStatus: 'approved',
                status: 'active'
            }
        })
        console.log(`Created user: ${newUser.id}`)
    }
}

resetPhoneNumber('981281297')
    .then(() => console.log('Done'))
    .catch(console.error)
    .finally(() => prisma.onModuleDestroy())
