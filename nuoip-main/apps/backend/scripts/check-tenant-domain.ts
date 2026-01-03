
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function main() {
    const tenantId = 'cmh9wylc60001tjs1qy2wm9ok'
    console.log(`🔍 Checking domain config for Tenant: ${tenantId}`)

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            id: true,
            name: true,
            domain: true,
            subdomain: true,
            settings: true
        }
    })

    if (!tenant) {
        console.log('❌ Tenant not found!')
        return
    }

    console.log('✅ Tenant Data:')
    console.log(`   Name: ${tenant.name}`)
    console.log(`   Domain: ${tenant.domain || '(null)'}`)
    console.log(`   Subdomain: ${tenant.subdomain || '(null)'}`)
    console.log(`   Settings:`, JSON.stringify(tenant.settings, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
