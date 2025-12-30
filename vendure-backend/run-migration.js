const { Pool } = require('pg');

async function runMigration() {
    console.log('--- VENDURE MIGRATION SCRIPT V5 (REMOVE REDUNDANT INDEX) ---');

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

        // 1. Drop existing constraints and indexes that we want to clean up
        console.log('Cleaning up existing constraints/indexes...');
        await pool.query(`ALTER TABLE customer DROP CONSTRAINT IF EXISTS "UQ_847464ecf377c421b29a3f37943"`);
        await pool.query(`DROP INDEX IF EXISTS "public"."IDX_customer_customFieldsLogtouserid"`);
        await pool.query(`DROP INDEX IF EXISTS "public"."IDX_customer_customfieldslogtouserid"`);
        await pool.query(`DROP INDEX IF EXISTS "IDX_customer_customFieldsLogtouserid"`);
        await pool.query(`DROP INDEX IF EXISTS "IDX_customer_customfieldslogtouserid"`);

        // 2. Drop and Re-add columns to ensure fresh start and correct types
        console.log('Re-creating columns...');
        await pool.query(`
            ALTER TABLE customer 
            DROP COLUMN IF EXISTS "customFieldsLogtouserid",
            DROP COLUMN IF EXISTS "customFieldsLogtodata"
        `);

        await pool.query(`
            ALTER TABLE customer 
            ADD COLUMN "customFieldsLogtouserid" character varying(255),
            ADD COLUMN "customFieldsLogtodata" text
        `);

        // 3. Add the specific unique constraint expected by Vendure
        console.log('Adding unique constraint...');
        await pool.query(`
            ALTER TABLE customer 
            ADD CONSTRAINT "UQ_847464ecf377c421b29a3f37943" 
            UNIQUE ("customFieldsLogtouserid")
        `);

        // Note: NO manual index creation here. Vendure handles the unique storage via the constraint.
        console.log('Schema alignment completed successfully!');
    } catch (error) {
        console.error('Migration failed with error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
