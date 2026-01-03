
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function resolveTenantBaseUrl(tenantId: string | null): Promise<string> {
    const rootDomain = process.env.ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'flowcast.chat';
    console.log(`Debug: rootDomain=${rootDomain}`)

    if (tenantId) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { domain: true, subdomain: true, settings: true },
        });

        if (tenant) {
            if (tenant.domain) {
                console.log('Trace: Found tenant.domain')
                return `https://${tenant.domain}`;
            }

            if (tenant.subdomain) {
                console.log('Trace: Found tenant.subdomain')
                return `https://${tenant.subdomain}.${rootDomain}`;
            }
        }
    }

    return `https://${rootDomain}`;
}

async function main() {
    const tenantId = 'cmh9wylc60001tjs1qy2wm9ok'
    console.log(`Testing URL resolution for ${tenantId}`)
    const url = await resolveTenantBaseUrl(tenantId)
    console.log(`Result: ${url}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
