
const { Client } = require('pg');

async function main() {
    // Try to find database URL from environment or .env
    // For now, I'll assume we can use the local default if not set, or hardcode it for this debug script if needed
    // But usually in dev it's in .env 

    // Actually, let's try to assume standard local connection or read .env

    // NOTE: Simple script to just connect and query
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ipnuo_db?schema=public'
    });

    try {
        await client.connect();

        // Check if tickets table exists (it might be "Tickets" or "tickets")
        // Prisma model is Tickets, blocked as @@map isn't shown in previous view
        // Let's assume table name "Tickets" based on Prisma convention unless mapped
        // Wait, looking at schema.prisma lines 290...
        // I need to check schema.prisma again.

        const res = await client.query('SELECT * FROM "tickets" WHERE id = $1', ['ba3b8769-ec05-4db6-b6fb-cf3930917b93']);

        if (res.rows.length > 0) {
            console.log('✅ Ticket found:', res.rows[0]);
        } else {
            console.log('❌ Ticket NOT FOUND in table "tickets"');
            // Try checking other tables just in case?
        }

    } catch (err) {
        console.error('Database query error:', err);
    } finally {
        await client.end();
    }
}

main();
