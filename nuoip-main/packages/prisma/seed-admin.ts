// FILE: prisma/seed-admin.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with initial admin and tenant data...');

  // 1. Create the SYSTEM_ADMIN tenant first
  const systemAdminTenant = await (prisma as any).tenant.upsert({
    where: { id: 'SYSTEM_ADMIN' },
    update: {},
    create: {
      id: 'SYSTEM_ADMIN',
      name: 'System Administration',
      domain: 'system.admin',
      isActive: true,
      settings: {
        features: ['admin', 'system'],
        limits: { "maxUsers": 1000, "maxTrademarks": 1000000 },
        branding: { "primaryColor": "#dc2626" }
      }
    }
  });
  console.log(`✅ System Admin Tenant created: ${systemAdminTenant.name}`);

  // 2. Create the Super Admin User
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await (prisma as any).user.upsert({
    where: { email_tenantId: { email: 'super@admin.com', tenantId: 'SYSTEM_ADMIN' } },
    update: {},
    create: {
      email: 'super@admin.com',
      name: 'Super Admin',
      password: superAdminPassword,
      role: 'super_admin',
      tenantId: 'SYSTEM_ADMIN',
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 3. Create a Sample Tenant for management
  const sampleTenant = await (prisma as any).tenant.upsert({
    where: { domain: 'samplecorp.com' },
    update: {},
    create: {
      name: 'Sample Corp',
      domain: 'samplecorp.com',
      isActive: true,
      settings: {
        features: ['search', 'analytics'],
        limits: { "maxUsers": 10 },
        branding: { "primaryColor": "#3b82f6" }
      }
    }
  });
  console.log(`✅ Sample Tenant created: ${sampleTenant.name}`);

  // 4. Create a user for the Sample Tenant
  const sampleUserPassword = await bcrypt.hash('sampleuser123', 10);
  await (prisma as any).user.upsert({
    where: { email_tenantId: { email: 'user@samplecorp.com', tenantId: sampleTenant.id } },
    update: {},
    create: {
      email: 'user@samplecorp.com',
      name: 'Sample User',
      password: sampleUserPassword,
      role: 'user',
      tenantId: sampleTenant.id,
    },
  });

  console.log('🌱 Seeding finished successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('Super Admin:');
  console.log('  Email: super@admin.com');
  console.log('  Password: superadmin123');
  console.log('\nSample User:');
  console.log('  Email: user@samplecorp.com');
  console.log('  Password: sampleuser123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
