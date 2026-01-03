const { Pool } = require('pg');

async function runMigration() {
    console.log('--- VENDURE MIGRATION SCRIPT V7 (CORRECT CASING) ---');

    // Construct connection config
    const connectionConfig = {
        ssl: {
            rejectUnauthorized: false
        }
    };

    if (process.env.DATABASE_URL && process.env.DATABASE_URL !== '') {
        connectionConfig.connectionString = process.env.DATABASE_URL;
        console.log('Connection: Using DATABASE_URL');
    } else if (process.env.DB_HOST) {
        connectionConfig.host = process.env.DB_HOST;
        connectionConfig.port = process.env.DB_PORT;
        connectionConfig.user = process.env.DB_USERNAME;
        connectionConfig.password = process.env.DB_PASSWORD;
        connectionConfig.database = process.env.DB_NAME;
        console.log(`Connection: Using DB_ variables (Host: ${process.env.DB_HOST})`);
    } else {
        console.error('Migration failed: No valid database credentials found.');
        process.exit(1);
    }

    const pool = new Pool(connectionConfig);

    try {
        console.log('Connecting to database...');
        await pool.query('SELECT 1');
        console.log('Connected. Starting schema alignment...');

        // 1. Clean up old fields (including the ones with wrong casing I just added)
        console.log('Cleaning up obsolete fields and constraints...');
        await pool.query(`ALTER TABLE customer DROP CONSTRAINT IF EXISTS "UQ_847464ecf377c421b29a3f37943"`);
        await pool.query(`ALTER TABLE customer DROP CONSTRAINT IF EXISTS "UQ_walletAddress"`);
        await pool.query(`ALTER TABLE customer DROP CONSTRAINT IF EXISTS "UQ_customFieldsWalletAddress"`);
        await pool.query(`ALTER TABLE customer DROP CONSTRAINT IF EXISTS "UQ_customFieldsZkeyInternalId"`);
        await pool.query(`ALTER TABLE customer DROP CONSTRAINT IF EXISTS "UQ_customFieldsWalletaddress"`);
        await pool.query(`ALTER TABLE customer DROP CONSTRAINT IF EXISTS "UQ_customFieldsZkeyinternalid"`);

        await pool.query(`
            ALTER TABLE customer 
            DROP COLUMN IF EXISTS "customFieldsLogtouserid",
            DROP COLUMN IF EXISTS "customFieldsLogtodata",
            DROP COLUMN IF EXISTS "customFieldsWalletAddress",
            DROP COLUMN IF EXISTS "customFieldsZkeyInternalId",
            DROP COLUMN IF EXISTS "customFieldsWalletaddress",
            DROP COLUMN IF EXISTS "customFieldsZkeyinternalid"
        `);

        // 2. Add current fields with correct casing (lowercase after "customFields")
        console.log('Adding current custom fields with correct casing...');
        await pool.query(`
            ALTER TABLE customer 
            ADD COLUMN IF NOT EXISTS "customFieldsWalletaddress" character varying(255),
            ADD COLUMN IF NOT EXISTS "customFieldsZkeyinternalid" character varying(255)
        `);

        // 3. Add unique constraints
        console.log('Adding unique constraints...');
        await pool.query(`
            ALTER TABLE customer 
            ADD CONSTRAINT "UQ_customFieldsWalletaddress" UNIQUE ("customFieldsWalletaddress"),
            ADD CONSTRAINT "UQ_customFieldsZkeyinternalid" UNIQUE ("customFieldsZkeyinternalid")
        `);

        console.log('Schema alignment completed successfully!');
    } catch (error) {
        console.error('Migration failed with error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
