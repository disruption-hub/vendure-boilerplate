// FILE: prisma/seed-labs-mobile.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Labs Mobile API key and user data...');

  // 1. Create or update the Labs Mobile API key in SystemConfig
  console.log('Creating Labs Mobile API key configuration...');
  const labsMobileApiKey = await prisma.systemConfig.upsert({
    where: { key: 'labs_mobile_api_key' },
    update: {
      value: {
        apiKey: 'BqVcFI39Ca2J8wKlT2l9vaESEZLu28It',
        service: 'Labs Mobile',
        description: 'API key for Labs Mobile SMS service',
        createdAt: new Date().toISOString(),
        isActive: true
      }
    },
    create: {
      key: 'labs_mobile_api_key',
      value: {
        apiKey: 'BqVcFI39Ca2J8wKlT2l9vaESEZLu28It',
        service: 'Labs Mobile',
        description: 'API key for Labs Mobile SMS service',
        createdAt: new Date().toISOString(),
        isActive: true
      }
    }
  });
  console.log(`✅ Labs Mobile API key configured: ${labsMobileApiKey.key}`);

  // 2. Create MatMax tenant if it doesn't exist
  console.log('Creating MatMax tenant...');
  const matmaxTenant = await prisma.tenant.upsert({
    where: { domain: 'matmax.world' },
    update: {
      subdomain: 'matmax',
    },
    create: {
      name: 'MatMax Wellness',
      domain: 'matmax.world',
      subdomain: 'matmax',
      isActive: true,
      settings: {
        features: ['search', 'analytics', 'memory', 'ai', 'sms', 'notifications'],
        limits: { "maxUsers": 100, "maxTrademarks": 10000 },
        branding: { 
          "primaryColor": "#075e54",
          "logo": "/matmax-logo.png"
        },
        sms: {
          provider: 'labs_mobile',
          apiKey: 'BqVcFI39Ca2J8wKlT2l9vaESEZLu28It'
        }
      }
    }
  });
  console.log(`✅ MatMax Tenant created: ${matmaxTenant.name} (ID: ${matmaxTenant.id})`);

  // 3. Create Alberto user in MatMax tenant
  console.log('Creating Alberto user for MatMax tenant...');
  const albertoPassword = await bcrypt.hash('matmax2024!', 10);
  const albertoUser = await prisma.user.upsert({
    where: { 
      email_tenantId: { 
        email: 'alberto@matmax.world', 
        tenantId: matmaxTenant.id 
      } 
    },
    update: {
      name: 'Alberto Sacco',
      role: 'admin',
      language: 'es',
      theme: 'light'
    },
    create: {
      email: 'alberto@matmax.world',
      name: 'Alberto Sacco',
      password: albertoPassword,
      role: 'admin',
      tenantId: matmaxTenant.id,
      language: 'es',
      theme: 'light'
    }
  });
  console.log(`✅ Alberto user created: ${albertoUser.email} (Role: ${albertoUser.role})`);

  // 4. Add additional system configuration for MatMax
  console.log('Adding MatMax system configuration...');
  await prisma.systemConfig.upsert({
    where: { key: 'matmax_tenant_config' },
    update: {
      value: {
        tenantId: matmaxTenant.id,
        tenantName: 'MatMax Wellness',
        primaryContact: 'alberto@matmax.world',
        features: ['search', 'analytics', 'memory', 'ai', 'sms', 'notifications'],
        smsProvider: 'labs_mobile',
        apiKey: 'BqVcFI39Ca2J8wKlT2l9vaESEZLu28It',
        createdAt: new Date().toISOString()
      }
    },
    create: {
      key: 'matmax_tenant_config',
      value: {
        tenantId: matmaxTenant.id,
        tenantName: 'MatMax Wellness',
        primaryContact: 'alberto@matmax.world',
        features: ['search', 'analytics', 'memory', 'ai', 'sms', 'notifications'],
        smsProvider: 'labs_mobile',
        apiKey: 'BqVcFI39Ca2J8wKlT2l9vaESEZLu28It',
        createdAt: new Date().toISOString()
      }
    }
  });
  console.log('✅ MatMax tenant configuration added');

  console.log('🌱 Labs Mobile seeding finished successfully!');
  console.log('\n📋 Created Accounts:');
  console.log('🏢 MatMax Wellness Tenant:');
  console.log(`   Tenant ID: ${matmaxTenant.id}`);
  console.log(`   Domain: ${matmaxTenant.domain}`);
  console.log('\n👤 Alberto User:');
  console.log('   Email: alberto@matmax.world');
  console.log('   Password: matmax2024!');
  console.log('   Role: admin');
  console.log('\n🔑 Labs Mobile API Key:');
  console.log('   API Key: BqVcFI39Ca2J8wKlT2l9vaESEZLu28It');
  console.log('   Service: Labs Mobile SMS');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
