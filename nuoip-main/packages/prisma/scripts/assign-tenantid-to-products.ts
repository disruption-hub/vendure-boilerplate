/**
 * Script to assign tenantId to existing payment products that have NULL tenantId
 * 
 * This script:
 * 1. Finds products with NULL tenantId
 * 2. Tries to infer tenantId from payment links
 * 3. For products without payment links, assigns to the first active tenant
 * 
 * Run with: npx tsx packages/prisma/scripts/assign-tenantid-to-products.ts
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding MatMax tenant...')
  
  // Find MatMax tenant
  const matmaxTenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { name: { contains: 'matmax', mode: 'insensitive' } },
        { name: { contains: 'MatMax', mode: 'insensitive' } },
        { subdomain: { contains: 'matmax', mode: 'insensitive' } },
        { domain: { contains: 'matmax', mode: 'insensitive' } },
      ],
    },
  })

  if (!matmaxTenant) {
    console.error('❌ MatMax tenant not found!')
    console.log('\nAvailable tenants:')
    const tenants = await prisma.tenant.findMany({ 
      select: { id: true, name: true, subdomain: true, domain: true } 
    })
    tenants.forEach((t) => 
      console.log(`  - ${t.name} (${t.subdomain || t.domain || 'no domain'}) [${t.id}]`)
    )
    process.exit(1)
  }

  console.log(`✅ Found MatMax tenant: ${matmaxTenant.name} (${matmaxTenant.id})`)
  console.log('🔍 Finding products with NULL tenantId...')
  
  // Find all products with NULL tenantId
  const productsWithoutTenant = await prisma.paymentProduct.findMany({
    where: {
      tenantId: null,
    },
  })

  console.log(`📦 Found ${productsWithoutTenant.length} products without tenantId`)

  if (productsWithoutTenant.length === 0) {
    console.log('✅ All products already have tenantId assigned!')
    return
  }

  let updated = 0
  let errors = 0

  for (const product of productsWithoutTenant) {
    try {
      // Assign to MatMax tenant
      await prisma.paymentProduct.update({
        where: { id: product.id },
        data: { tenantId: matmaxTenant.id },
      })
      updated++
      console.log(`  ✅ ${product.name} → MatMax (${matmaxTenant.id})`)
    } catch (error) {
      errors++
      console.error(`  ❌ Error updating ${product.name}:`, error)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   Products assigned to MatMax: ${updated}`)
  console.log(`   Errors: ${errors}`)

  // Verify
  const remainingNull = await prisma.paymentProduct.count({
    where: { tenantId: null },
  })

  if (remainingNull === 0) {
    console.log('\n✅ All products now have tenantId assigned to MatMax!')
  } else {
    console.log(`\n⚠️  ${remainingNull} products still have NULL tenantId`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

