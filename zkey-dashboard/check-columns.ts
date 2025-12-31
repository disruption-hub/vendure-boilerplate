import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mjOwgnKZCuKShgFfpwSbTbSRyyxbdAwM@yamabiko.proxy.rlwy.net:23289/railway';

async function main() {
    const pool = new pg.Pool({ connectionString });

    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants';
    `);

        console.log('Columns in tenants table:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });

    } catch (err) {
        console.error('Error querying columns:', err);
    } finally {
        await pool.end();
    }
}

main();
