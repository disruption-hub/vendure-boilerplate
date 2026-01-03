import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fixing integrity issues...')

    try {
        // Users approvedById
        console.log('Cleaning users.approvedById...')
        await prisma.$executeRawUnsafe(`UPDATE "users" SET "approvedById" = NULL WHERE "approvedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "users" u2 WHERE u2.id = "users"."approvedById")`)

        // Users invitedById
        console.log('Cleaning users.invitedById...')
        await prisma.$executeRawUnsafe(`UPDATE "users" SET "invitedById" = NULL WHERE "invitedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "users" u2 WHERE u2.id = "users"."invitedById")`)

        // Users chatbotPhoneUserId
        console.log('Cleaning users.chatbotPhoneUserId...')
        await prisma.$executeRawUnsafe(`UPDATE "users" SET "chatbotPhoneUserId" = NULL WHERE "chatbotPhoneUserId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "chatbot_phone_users" c WHERE c.id = "users"."chatbotPhoneUserId")`)

        // WhatsApp Contacts tenantId (from failed migration)
        console.log('Cleaning whatsapp_contacts.tenantId...')
        // If tenantId column exists, clean it. wrapping in try/catch in case column doesn't exist
        try {
            await prisma.$executeRawUnsafe(`DELETE FROM "whatsapp_contacts" WHERE "tenantId" NOT IN (SELECT "id" FROM "tenants")`)
        } catch (e) {
            console.log('Skipping whatsapp_contacts cleanup (column might not exist yet)')
        }

        console.log('Done.')
    } catch (err) {
        console.error('Error during cleanup:', err)
        process.exit(1)
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect())
