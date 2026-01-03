import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting demo database seeding...');

  // 1. Create the System Admin Tenant first
  console.log('Creating System Admin Tenant...');
  const systemAdminTenant = await prisma.tenant.upsert({
    where: { id: 'system_admin_tenant' },
    update: {},
    create: {
      id: 'system_admin_tenant',
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
  console.log('Creating Super Admin user...');
  const hashedSuperAdminPassword = await bcrypt.hash('superadmin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { 
      email_tenantId: { 
        email: 'super@admin.com', 
        tenantId: 'system_admin_tenant' 
      } 
    },
    update: {},
    create: {
      email: 'super@admin.com',
      name: 'Super Admin',
      password: hashedSuperAdminPassword,
      role: 'super_admin',
      tenantId: 'system_admin_tenant',
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 3. Create a Demo Tenant
  console.log('Creating Demo Tenant...');
  const demoTenant = await prisma.tenant.upsert({
    where: { id: 'innovate_corp_tenant' },
    update: {},
    create: {
      id: 'innovate_corp_tenant',
      name: 'Innovate Corp',
      domain: 'innovatecorp.demo',
      isActive: true,
      settings: {
        features: ['search', 'analytics', 'memory', 'ai'],
        maxUsers: 50,
        branding: { primaryColor: '#3B82F6' }
      }
    }
  });
  console.log(`✅ Demo Tenant created: ${demoTenant.name} (ID: ${demoTenant.id})`);

  // 4. Create a Demo User within the Demo Tenant
  console.log('Creating demo user for Demo Tenant...');
  const demoUserPassword = await bcrypt.hash('demopass123', 10);
  const demoUser = await prisma.user.upsert({
    where: { 
      email_tenantId: { 
        email: 'demo@innovatecorp.demo', 
        tenantId: demoTenant.id 
      } 
    },
    update: {},
    create: {
      email: 'demo@innovatecorp.demo',
      name: 'Demo User',
      password: demoUserPassword,
      role: 'user',
      tenantId: demoTenant.id,
    },
  });
  console.log(`✅ Demo User created: ${demoUser.email}`);

  // 5. Create an Admin User within the Demo Tenant
  console.log('Creating admin user for Demo Tenant...');
  const adminUserPassword = await bcrypt.hash('adminpass123', 10);
  const adminUser = await prisma.user.upsert({
    where: { 
      email_tenantId: { 
        email: 'admin@innovatecorp.demo', 
        tenantId: demoTenant.id 
      } 
    },
    update: {},
    create: {
      email: 'admin@innovatecorp.demo',
      name: 'Admin User',
      password: adminUserPassword,
      role: 'admin',
      tenantId: demoTenant.id,
    },
  });
  console.log(`✅ Admin User created: ${adminUser.email}`);

  // 6. Seed some Trademark data for the Demo Tenant
  console.log('Seeding trademark data for the Demo Tenant...');
  await prisma.trademark.createMany({
    data: [
      {
        marca: 'InnovateTech',
        titular: 'Innovate Corp',
        clase: '9.0',
        estado: 'OTORGADO',
        fechaRegistro: new Date('2020-03-15'),
        tenantId: demoTenant.id,
        descripcion: 'Software y servicios de tecnología innovadora.'
      },
      {
        marca: 'InnovateCloud',
        titular: 'Innovate Corp',
        clase: '42.0',
        estado: 'OTORGADO',
        fechaRegistro: new Date('2021-07-20'),
        tenantId: demoTenant.id,
        descripcion: 'Servicios de computación en la nube y almacenamiento.'
      },
      {
        marca: 'InnovateAI',
        titular: 'Innovate Corp',
        clase: '9.0',
        estado: 'EN_TRAMITE',
        fechaRegistro: new Date('2023-11-01'),
        tenantId: demoTenant.id,
        descripcion: 'Inteligencia artificial y machine learning.'
      },
      {
        marca: 'InnovateMobile',
        titular: 'Innovate Corp',
        clase: '9.0',
        estado: 'DENEGADO',
        fechaRegistro: new Date('2022-05-10'),
        tenantId: demoTenant.id,
        descripcion: 'Aplicaciones móviles y servicios relacionados.'
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Seeded 4 trademarks for the demo tenant.');

  // 7. Create another demo tenant for testing multi-tenancy
  console.log('Creating Second Demo Tenant...');
  const secondTenant = await prisma.tenant.upsert({
    where: { id: 'techstart_inc_tenant' },
    update: {},
    create: {
      id: 'techstart_inc_tenant',
      name: 'TechStart Inc',
      domain: 'techstart.demo',
      isActive: true,
      settings: {
        features: ['search', 'analytics'],
        maxUsers: 25,
        branding: { primaryColor: '#10B981' }
      }
    }
  });
  console.log(`✅ Second Demo Tenant created: ${secondTenant.name} (ID: ${secondTenant.id})`);

  // 8. Create a user for the second tenant
  console.log('Creating user for Second Demo Tenant...');
  const secondTenantUserPassword = await bcrypt.hash('techpass123', 10);
  const secondTenantUser = await prisma.user.upsert({
    where: { 
      email_tenantId: { 
        email: 'user@techstart.demo', 
        tenantId: secondTenant.id 
      } 
    },
    update: {},
    create: {
      email: 'user@techstart.demo',
      name: 'TechStart User',
      password: secondTenantUserPassword,
      role: 'user',
      tenantId: secondTenant.id,
    },
  });
  console.log(`✅ Second Tenant User created: ${secondTenantUser.email}`);

  // 9. Seed some data for the second tenant
  console.log('Seeding trademark data for the Second Demo Tenant...');
  await prisma.trademark.createMany({
    data: [
      {
        marca: 'TechStart',
        titular: 'TechStart Inc',
        clase: '35.0',
        estado: 'OTORGADO',
        fechaRegistro: new Date('2019-12-01'),
        tenantId: secondTenant.id,
        descripcion: 'Servicios de consultoría en tecnología.'
      },
      {
        marca: 'StartUp',
        titular: 'TechStart Inc',
        clase: '42.0',
        estado: 'OTORGADO',
        fechaRegistro: new Date('2020-06-15'),
        tenantId: secondTenant.id,
        descripcion: 'Plataforma de gestión para startups.'
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Seeded 2 trademarks for the second demo tenant.');
  
  console.log('🌱 Demo seeding finished successfully!');
  console.log('\n📋 Demo Accounts Created:');
  console.log('🔐 Super Admin:');
  console.log('   Email: super@admin.com');
  console.log('   Password: superadmin123');
  console.log('   Role: super_admin');
  console.log('\n🏢 Innovate Corp Tenant:');
  console.log('   Demo User: demo@innovatecorp.demo / demopass123');
  console.log('   Admin User: admin@innovatecorp.demo / adminpass123');
  console.log('\n🏢 TechStart Inc Tenant:');
  console.log('   User: user@techstart.demo / techpass123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
