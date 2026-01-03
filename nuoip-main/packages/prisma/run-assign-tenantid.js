/**
 * Simple script to assign MatMax tenantId to products
 * Run with: railway run -- node packages/prisma/run-assign-tenantid.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding MatMax tenant...')
  
  // MatMax tenant ID from logs
  let matmaxTenantId = 'cmh9wylc60001tjs1qy2wm9ok'
  
  // Verify tenant exists
  let tenant = await prisma.tenant.findUnique({
    where: { id: matmaxTenantId },
    select: { id: true, name: true }
  })

  if (!tenant) {
    console.log('⚠️  Tenant ID from logs not found, trying to find MatMax tenant...')
    const matmaxTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'matmax', mode: 'insensitive' } },
          { subdomain: { contains: 'matmax', mode: 'insensitive' } },
        ],
      },
    })
    
    if (!matmaxTenant) {
      console.error('❌ No MatMax tenant found at all!')
      process.exit(1)
    }
    
    matmaxTenantId = matmaxTenant.id
    tenant = matmaxTenant
  }
  
  console.log(`✅ Found MatMax tenant: ${tenant.name} (${matmaxTenantId})`)

  console.log('🔍 Finding products with NULL tenantId...')
  
  const count = await prisma.paymentProduct.count({
    where: { tenantId: null },
  })

  console.log(`📦 Found ${count} products without tenantId`)

  if (count === 0) {
    console.log('✅ All products already have tenantId assigned!')
    return
  }

  console.log(`🔄 Updating ${count} products to MatMax tenant...`)
  
  const result = await prisma.paymentProduct.updateMany({
    where: { tenantId: null },
    data: { tenantId: matmaxTenantId },
  })

  console.log(`✅ Updated ${result.count} products`)

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

