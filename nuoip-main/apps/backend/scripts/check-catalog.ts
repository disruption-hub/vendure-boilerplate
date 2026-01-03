
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const productCount = await prisma.paymentProduct.count()
        const products = await prisma.paymentProduct.findMany({ take: 5 })

        const linkCount = await prisma.paymentLink.count()
        const links = await prisma.paymentLink.findMany({
            take: 5,
            select: { id: true, productName: true, productId: true }
        })

        console.log('--- DIAGNOSTIC RESULT ---')
        console.log(`Total PaymentProducts: ${productCount}`)
        if (productCount > 0) {
            console.log('Sample Products:', JSON.stringify(products, null, 2))
        } else {
            console.log('No PaymentProducts found.')
        }

        console.log(`Total PaymentLinks: ${linkCount}`)
        console.log('Sample Links:', JSON.stringify(links, null, 2))
        console.log('-------------------------')

    } catch (e) {
        console.error('Error querying database:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
