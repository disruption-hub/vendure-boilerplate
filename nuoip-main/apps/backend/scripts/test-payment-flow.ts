import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function main() {
    console.log('🔍 Testing Payment Flow Product Filtering...')

    // 1. Get a valid tenant ID (from previous tasks, e.g. 'cmh9wylc60001tjs1qy2wm9ok')
    const tenantId = 'cmh9wylc60001tjs1qy2wm9ok'
    console.log(`targetTenantId: ${tenantId}`)

    // 2. Simulate the query currently in payment-flow.service.ts (Line 449)
    // It effectively does this:
    console.log('\n--- Simulation of Current Logic (No tenantId filter) ---')
    const allProducts = await prisma.paymentProduct.findMany({
        where: { isActive: true },
        select: { id: true, name: true, tenantId: true }
    })

    console.log(`Found ${allProducts.length} total active products in DB.`)
    const productsFromOtherTenants = allProducts.filter(p => p.tenantId !== tenantId)

    if (productsFromOtherTenants.length > 0) {
        console.log(`⚠️ ALARM: Found ${productsFromOtherTenants.length} products from OTHER tenants!`)
        productsFromOtherTenants.forEach(p => console.log(`   - [Tenant: ${p.tenantId}] ${p.name}`))
    } else {
        console.log('No products from other tenants found (maybe DB only has one tenant?)')
    }

    // 3. Simulate the Fixed Query
    console.log('\n--- Simulation of Fixed Logic (With tenantId filter) ---')
    const tenantProducts = await prisma.paymentProduct.findMany({
        where: {
            isActive: true,
            tenantId // Filter by tenantId
        },
        select: { id: true, name: true, tenantId: true }
    })

    console.log(`Found ${tenantProducts.length} products for tenant ${tenantId}.`)
    const leakedProducts = tenantProducts.filter(p => p.tenantId !== tenantId)
    if (leakedProducts.length === 0) {
        console.log('✅ Success: Only products for target tenant returned.')
    } else {
        console.log('❌ Failure: Leaked products found.')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
