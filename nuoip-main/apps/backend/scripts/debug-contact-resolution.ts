const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('DATABASE_URL not found in env');
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const targetId = 'cmipktzgq002e01new6o4hoq9';
    console.log(`Checking contact ID: ${targetId}`);

    // Check ChatbotContact
    const chatbotContact = await prisma.chatbotContact.findUnique({
        where: { id: targetId }
    });
    console.log('ChatbotContact:', chatbotContact ? 'FOUND' : 'NOT FOUND');
    if (chatbotContact) {
        console.log('ChatbotContact Details:', JSON.stringify(chatbotContact, null, 2));
    }

    // Check WhatsAppContact (Direct ID)
    const waContactDirect = await prisma.whatsAppContact.findUnique({
        where: { id: targetId }
    });
    console.log('WhatsAppContact (Direct ID):', waContactDirect ? 'FOUND' : 'NOT FOUND');

    // Check WhatsAppContact (Linked via chatbotContactId)
    const waContactLinked = await prisma.whatsAppContact.findFirst({
        where: { chatbotContactId: targetId }
    });
    console.log('WhatsAppContact (Linked via chatbotContactId):', waContactLinked ? 'FOUND' : 'NOT FOUND');
    if (waContactLinked) {
        console.log('WhatsAppContact Details:', JSON.stringify(waContactLinked, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
