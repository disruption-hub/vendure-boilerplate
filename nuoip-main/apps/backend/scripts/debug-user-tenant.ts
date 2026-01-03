
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function checkUserTenant() {
    try {
        console.log('🔍 Checking potential Admin Users...')

        // Find users that might be the logged in admin
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: 'Alberto', mode: 'insensitive' } },
                    { email: { contains: 'alberto', mode: 'insensitive' } },
                    { role: 'admin' },
                    { role: 'super_admin' }
                ]
            }
        })

        console.log(`Found ${users.length} users.`)

        for (const u of users) {
            console.log(`\n👤 User: ${u.name} (${u.email})`)
            console.log(`   ID: ${u.id}`)
            console.log(`   Role: ${u.role}`)
            console.log(`   TenantID: ${u.tenantId}`)

            // Check if products exist for this tenant
            if (u.tenantId) {
                const count = await prisma.paymentProduct.count({
                    where: { tenantId: u.tenantId }
                })
                console.log(`   📦 Products for this tenant: ${count}`)
            } else {
                console.log(`   ❌ No Tenant ID!`)
            }
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkUserTenant()
