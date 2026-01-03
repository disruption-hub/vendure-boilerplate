
import * as dotenv from 'dotenv'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

async function main() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
        throw new Error('DATABASE_URL not found in environment')
    }

    console.log('Connecting to database...')

    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
        const tenantId = 'cmh9wylc60001tjs1qy2wm9ok'
        console.log(`Checking tenant: ${tenantId}`)

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
        })

        if (!tenant) {
            console.log('Tenant not found')
            return
        }

        console.log('Tenant found:')
        console.log('ID:', tenant.id)
        console.log('Name:', tenant.name)
        console.log('Subdomain:', tenant.subdomain)
        console.log('Logo URL (column):', tenant.logoUrl)

        console.log('Settings (raw):', typeof tenant.settings === 'string' ? tenant.settings : JSON.stringify(tenant.settings, null, 2))

        if (tenant.settings) {
            const settings = typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : tenant.settings
            console.log('Parsed Settings:')
            console.log('Branding:', JSON.stringify(settings.branding, null, 2))
            console.log('Customization:', JSON.stringify(settings.customization, null, 2))
        }
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
