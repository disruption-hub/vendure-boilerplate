const { Pool } = require('pg');

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        // 1. Drop existing constraints and indexes to start fresh
        await pool.query(`ALTER TABLE customer DROP CONSTRAINT IF EXISTS "UQ_847464ecf377c421b29a3f37943"`);
        await pool.query(`DROP INDEX IF EXISTS "public"."IDX_customer_customFieldsLogtouserid"`);
        await pool.query(`DROP INDEX IF EXISTS "IDX_customer_customFieldsLogtouserid"`);

        // 2. Ensure columns exist with correct types
        // Note: logs showed DROP then ADD. We'll ensure it matches the final expected state.
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
        await pool.query(`
            ALTER TABLE customer 
            ADD CONSTRAINT "UQ_847464ecf377c421b29a3f37943" 
            UNIQUE ("customFieldsLogtouserid")
        `);

        // 4. Create the specific index expected by Vendure
        await pool.query(`
            CREATE INDEX "IDX_customer_customFieldsLogtouserid" 
            ON customer ("customFieldsLogtouserid")
        `);

        console.log('Schema alignment completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
