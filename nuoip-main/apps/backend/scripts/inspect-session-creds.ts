
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const sessions = await prisma.whatsAppSession.findMany({
        where: {
            status: 'CONNECTED'
        }
    })

    console.log(`Found ${sessions.length} connected sessions`)

    for (const session of sessions) {
        console.log(`\n--- Session: ${session.sessionId} ---`)
        console.log(`Name in DB Column: ${session.name}`)
        console.log(`Phone in DB Column: ${session.phoneNumber}`)

        if (session.creds) {
            try {
                const creds = JSON.parse(JSON.stringify(session.creds))
                const me = creds.me
                console.log('Creds "me" object:', me)

                if (me) {
                    console.log(`- ID: ${me.id}`)
                    console.log(`- Name: ${me.name}`)
                    console.log(`- Notify: ${me.notify}`)
                    console.log(`- VerifiedName: ${me.verifiedName}`)
                } else {
                    console.log('No "me" object in creds')
                }
            } catch (e) {
                console.error('Error parsing creds:', e)
            }
        } else {
            console.log('No creds stored')
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
