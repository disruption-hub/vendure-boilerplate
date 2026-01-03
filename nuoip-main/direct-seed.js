
const { Client } = require('pg');

// Railway database URL from environment
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:tAuoGsEE...'; // truncated for security

async function seedAdmin() {
  const client = new Client({ connectionString: databaseUrl });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check if tenant exists
    const tenantResult = await client.query('SELECT id FROM tenants LIMIT 1');
    let tenantId;
    
    if (tenantResult.rows.length === 0) {
      const insertTenant = await client.query(
        'INSERT INTO tenants (name, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) RETURNING id',
        ['Default Tenant', true]
      );
      tenantId = insertTenant.rows[0].id;
      console.log('Created tenant:', tenantId);
    } else {
      tenantId = tenantResult.rows[0].id;
      console.log('Using existing tenant:', tenantId);
    }
    
    // Hash password (simple approach)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('Generated password hash');
    
    // Upsert admin user
    const upsertQuery = `
      INSERT INTO users (email, name, password, role, "tenantId", "preferredLanguage", status, "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (email, "tenantId") 
      DO UPDATE SET 
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        "preferredLanguage" = EXCLUDED."preferredLanguage",
        status = EXCLUDED.status,
        "updatedAt" = NOW()
    `;
    
    await client.query(upsertQuery, [
      'admin@flowcast.chat',
      'Admin User', 
      hashedPassword,
      'super_admin',
      tenantId,
      'en',
      'active'
    ]);
    
    console.log('✅ Admin user seeded successfully!');
    console.log('Email: admin@flowcast.chat');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

seedAdmin();

