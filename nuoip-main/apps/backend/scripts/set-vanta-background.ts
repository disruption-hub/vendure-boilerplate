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
        console.log(`Updating background to Vanta for tenant: ${tenantId}`)

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
        })

        if (!tenant) {
            throw new Error('Tenant not found')
        }

        let settings: any = tenant.settings
        if (typeof settings === 'string') {
            settings = JSON.parse(settings)
        }

        if (!settings) {
            settings = {}
        }

        const primaryColor = settings.branding?.primaryColor || '#075e54'

        // Convert hex to number for Vanta (remove # and parse as hex)
        const colorNum = parseInt(primaryColor.replace('#', ''), 16)

        // Create Vanta fog customization with branded colors
        const customization = {
            primaryButton: {
                background: primaryColor,
                hover: '#06544b',
                text: '#ffffff'
            },
            background: {
                type: 'vanta',
                vanta: {
                    effect: 'fog',
                    options: {
                        highlightColor: colorNum,
                        midtoneColor: 0x0c8f72,
                        lowlightColor: 0x5ce7c5,
                        baseColor: 0x00121a,
                        blurFactor: 0.6,
                        zoom: 0.8,
                        speed: 1.0,
                    }
                }
            },
            otpForm: {
                inputBorder: '#b6d9c4',
                inputBorderFocus: primaryColor,
                inputBackground: '#ffffff',
                inputBackgroundFilled: '#e9f7ef',
                inputText: '#0f3c34',
                inputBorderFilled: primaryColor,
            },
            inputFields: {
                background: '#f5f1ed',
                border: '#d1d5db',
                borderFocus: primaryColor,
                text: '#0f172a',
                placeholder: '#64748b',
            },
            formContainer: {
                background: '#ffffff',
                border: 'rgba(255, 255, 255, 0.2)',
                shadow: '0 20px 52px -28px rgba(0,0,0,0.3)',
            },
            textColors: {
                heading: '#111827',
                description: '#4b5563',
                label: '#111827',
                error: '#111827',
            },
        }

        settings.customization = customization

        // Update tenant
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { settings }
        })

        console.log('✅ Updated customization to use Vanta fog effect')
        console.log(JSON.stringify(customization.background, null, 2))

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
