/**
 * Script to copy global Lyra configuration to MatMax tenant settings.
 * Run with: cd packages/prisma && node copy-lyra-to-matmax.js
 * Or via Railway: railway run -- bash -c "cd packages/prisma && node copy-lyra-to-matmax.js"
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting Lyra config migration to MatMax tenant...\n')

  // 1. Find MatMax tenant
  const matmaxTenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { name: { contains: 'matmax', mode: 'insensitive' } },
        { name: { contains: 'MatMax', mode: 'insensitive' } },
        { subdomain: { contains: 'matmax', mode: 'insensitive' } },
      ],
    },
  })

  if (!matmaxTenant) {
    console.error('❌ MatMax tenant not found!')
    console.log('\nAvailable tenants:')
    const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, subdomain: true } })
    tenants.forEach((t) => console.log(`  - ${t.name} (${t.subdomain || 'no subdomain'}) [${t.id}]`))
    return
  }

  console.log('✅ Found MatMax tenant:', {
    id: matmaxTenant.id,
    name: matmaxTenant.name,
    subdomain: matmaxTenant.subdomain,
  })

  // 2. Get global Lyra config
  const possibleKeys = ['lyra_config', 'lyra_settings', 'lyra', 'LYRA_CONFIG', 'LYRA_SETTINGS']
  let globalLyraConfig = null

  for (const key of possibleKeys) {
    const config = await prisma.systemConfig.findUnique({ where: { key } })
    if (config?.value) {
      try {
        globalLyraConfig = typeof config.value === 'string' ? JSON.parse(config.value) : config.value
        console.log(`\n✅ Found global Lyra config under key: ${key}`)
        break
      } catch (e) {
        console.log(`⚠️ Could not parse config for key: ${key}`)
      }
    }
  }

  if (!globalLyraConfig) {
    console.error('❌ No global Lyra configuration found!')
    return
  }

  console.log('\n📋 Global Lyra config preview:')
  console.log('  - Active mode:', globalLyraConfig.activeMode)
  console.log('  - Test mode enabled:', globalLyraConfig.testMode?.enabled)
  console.log('  - Production mode enabled:', globalLyraConfig.productionMode?.enabled)
  if (globalLyraConfig.productionMode?.credentials) {
    console.log('  - Production credentials:', Object.keys(globalLyraConfig.productionMode.credentials).join(', '))
  }

  // 3. Update MatMax tenant settings with Lyra config
  const currentSettings = matmaxTenant.settings || {}
  const updatedSettings = {
    ...currentSettings,
    lyraConfig: globalLyraConfig,
  }

  await prisma.tenant.update({
    where: { id: matmaxTenant.id },
    data: {
      settings: updatedSettings,
    },
  })

  console.log('\n✅ Successfully copied Lyra config to MatMax tenant!')
  console.log('\n📝 Tenant settings now include lyraConfig with:')
  console.log('  - Active mode:', globalLyraConfig.activeMode)
  console.log('  - Test mode:', globalLyraConfig.testMode?.enabled ? 'enabled' : 'disabled')
  console.log('  - Production mode:', globalLyraConfig.productionMode?.enabled ? 'enabled' : 'disabled')

  // 4. Verify the update
  const verifyTenant = await prisma.tenant.findUnique({
    where: { id: matmaxTenant.id },
    select: { settings: true },
  })
  
  const verifySettings = verifyTenant?.settings
  if (verifySettings?.lyraConfig) {
    console.log('\n✅ Verification passed! MatMax tenant now has lyraConfig in settings.')
  } else {
    console.log('\n⚠️ Verification: lyraConfig not found in settings after update.')
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

