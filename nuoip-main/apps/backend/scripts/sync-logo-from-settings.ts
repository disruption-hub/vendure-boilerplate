import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncLogoFromSettings() {
    console.log('[syncLogoFromSettings] Starting...')

    // Find all tenants
    const tenants = await prisma.tenant.findMany({
        select: {
            id: true,
            name: true,
            logoUrl: true,
            settings: true,
        },
    })

    console.log(`[syncLogoFromSettings] Found ${tenants.length} tenants`)

    let updated = 0
    let skipped = 0

    for (const tenant of tenants) {
        try {
            // Extract logo from settings.branding.logoUrl
            const settings = tenant.settings as any
            const settingsLogoUrl = settings?.branding?.logoUrl

            // Check if settings has a data URL logo
            if (settingsLogoUrl && typeof settingsLogoUrl === 'string' && settingsLogoUrl.startsWith('data:')) {
                // Check if top-level logoUrl is different
                if (tenant.logoUrl !== settingsLogoUrl) {
                    console.log(`[syncLogoFromSettings] Updating tenant: ${tenant.name} (${tenant.id})`)
                    console.log(`  Current logoUrl: ${tenant.logoUrl?.substring(0, 50)}...`)
                    console.log(`  Settings logoUrl: ${settingsLogoUrl.substring(0, 50)}...`)

                    await prisma.tenant.update({
                        where: { id: tenant.id },
                        data: {
                            logoUrl: settingsLogoUrl,
                        },
                    })

                    updated++
                    console.log(`  ✅ Updated`)
                } else {
                    console.log(`[syncLogoFromSettings] Skipping tenant ${tenant.name}: logoUrl already matches`)
                    skipped++
                }
            } else {
                console.log(`[syncLogoFromSettings] Skipping tenant ${tenant.name}: no data URL in settings.branding.logoUrl`)
                skipped++
            }
        } catch (error) {
            console.error(`[syncLogoFromSettings] Error processing tenant ${tenant.id}:`, error)
        }
    }

    console.log(`[syncLogoFromSettings] Complete! Updated: ${updated}, Skipped: ${skipped}`)
}

syncLogoFromSettings()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
