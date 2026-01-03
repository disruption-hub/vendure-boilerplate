
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function checkProducts() {
    try {
        // Use the tenant ID we found earlier for "MatMax" / Alberto
        const tenantId = 'cmh9wylc60001tjs1qy2wm9ok'

        console.log(`\n🔍 Checking products for Tenant: ${tenantId}`)

        const products = await prisma.paymentProduct.findMany({
            where: { tenantId },
            include: { paymentProductImages: true }
        })

        if (products.length === 0) {
            console.log('❌ No products found for this tenant.')
        } else {
            console.log(`✅ Found ${products.length} products:`)
            products.forEach(p => {
                console.log(`   - ${p.productCode}: ${p.name} (Amount: ${p.amountCents}, Active: ${p.isActive})`)
            })
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkProducts()
