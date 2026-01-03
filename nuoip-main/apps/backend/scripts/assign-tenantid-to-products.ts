/**
 * Script to assign MatMax tenantId to products
 * Run with: railway run -- npx tsx apps/backend/scripts/assign-tenantid-to-products.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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
  
  // Use raw SQL since Prisma schema doesn't allow null in where clause
  const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count
    FROM "payment_products"
    WHERE "tenantId" IS NULL
  `
  const count = Number(countResult[0].count)

  console.log(`📦 Found ${count} products without tenantId`)

  if (count === 0) {
    console.log('✅ All products already have tenantId assigned!')
    return
  }

  console.log(`🔄 Updating ${count} products to MatMax tenant...`)
  
  // Use raw SQL to update
  const updateResult = await prisma.$executeRaw`
    UPDATE "payment_products"
    SET "tenantId" = ${matmaxTenantId}
    WHERE "tenantId" IS NULL
  `

  console.log(`✅ Updated ${updateResult} products`)

  // Verify
  const remainingResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count
    FROM "payment_products"
    WHERE "tenantId" IS NULL
  `
  const remainingNull = Number(remainingResult[0].count)

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
    await pool.end()
  })

