
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function checkLinkage() {
    try {
        console.log('🔍 Checking User <-> ChatbotPhoneUser Linkage...')

        // Get Alberto's User
        const user = await prisma.user.findFirst({
            where: { email: 'alberto@matmax.world' },
            include: {
                chatbotPhoneUser: true
            }
        })

        if (!user) {
            console.log('❌ User alberto not found')
            return
        }

        console.log(`\n👤 User: ${user.name}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Phone in User table: ${user.phone}`)

        // Check explicit relation
        if (user.chatbotPhoneUser) {
            console.log(`   ✅ Linked ChatbotPhoneUser:`)
            const cpu = user.chatbotPhoneUser
            console.log(`     - ${cpu.name} (${cpu.phone}) ID: ${cpu.id}`)
        } else {
            console.log(`   ⚠️  No explicit relation to ChatbotPhoneUser found.`)
        }

        // Check if a ChatbotPhoneUser exists with matching phone
        if (user.phone) {
            const matchingPhoneUser = await prisma.chatbotPhoneUser.findFirst({
                where: { phone: user.phone }
            })
            if (matchingPhoneUser) {
                console.log(`\n📞 Found ChatbotPhoneUser matching phone ${user.phone}:`)
                console.log(`   - ${matchingPhoneUser.name} ID: ${matchingPhoneUser.id}`)

                // Determine if HybridAdminGuard fallback would work
                // It searches for User by phone if no relation exists.
                // But here we want to go from Session -> PhoneUser -> [Users]

                // Let's check the reverse: PhoneUser -> Users
                const reverseCheck = await prisma.chatbotPhoneUser.findUnique({
                    where: { id: matchingPhoneUser.id },
                    include: { users: true }
                })

                console.log(`\n🔄 Reverse check (PhoneUser -> Users):`)
                if (reverseCheck?.users.length) {
                    reverseCheck.users.forEach(u => console.log(`   - Linked to User: ${u.name} (${u.email})`))
                } else {
                    console.log(`   ❌ PhoneUser verified to have NO linked Users.`)
                    console.log(`   ℹ️  HybridAdminGuard fallback will trigger: finding User by phone number.`)

                    // Verify fallback query
                    const fallbackUser = await prisma.user.findFirst({
                        where: {
                            phone: matchingPhoneUser.phone,
                            OR: [{ role: 'admin' }, { role: 'super_admin' }]
                        }
                    })

                    if (fallbackUser) {
                        console.log(`   ✅ Fallback WOULD succeed. Found User ID: ${fallbackUser.id}`)
                    } else {
                        console.log(`   ❌ Fallback WOULD FAIL. No admin user found with phone ${matchingPhoneUser.phone}`)
                        console.log(`      (Your user phone is: ${user.phone})`)
                    }
                }
            } else {
                console.log(`\n❌ No ChatbotPhoneUser found matching phone ${user.phone}`)
            }
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkLinkage()
