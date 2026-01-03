
import * as dotenv from 'dotenv'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

// Helper to darken a hex color
function darkenColor(hex: string, percent: number): string {
    let r = parseInt(hex.substring(1, 3), 16)
    let g = parseInt(hex.substring(3, 5), 16)
    let b = parseInt(hex.substring(5, 7), 16)

    r = Math.floor(r * (100 - percent) / 100)
    g = Math.floor(g * (100 - percent) / 100)
    b = Math.floor(b * (100 - percent) / 100)

    r = (r < 255) ? r : 255
    g = (g < 255) ? g : 255
    b = (b < 255) ? b : 255

    const rr = ((r.toString(16).length === 1) ? '0' + r.toString(16) : r.toString(16))
    const gg = ((g.toString(16).length === 1) ? '0' + g.toString(16) : g.toString(16))
    const bb = ((b.toString(16).length === 1) ? '0' + b.toString(16) : b.toString(16))

    return '#' + rr + gg + bb
}

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
        console.log(`Fixing customization for tenant: ${tenantId}`)

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

        const primaryColor = settings.branding?.primaryColor || '#000000'
        const hoverColor = darkenColor(primaryColor, 10)

        // Create correct customization structure
        const customization = {
            primaryButton: {
                background: primaryColor,
                hover: hoverColor,
                text: '#ffffff'
            },
            background: {
                type: 'particles',
                particles: {
                    colors: [primaryColor, hoverColor],
                    count: 150
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

        console.log('✅ Updated customization')
        console.log(JSON.stringify(customization, null, 2))

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
