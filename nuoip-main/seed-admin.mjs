
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedAdmin() {
  try {
    console.log('Seeding admin user...')
    
    // Check if tenant exists
    let tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: 'Default Tenant', isActive: true }
      })
      console.log('Created tenant:', tenant.id)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10)
    console.log('Generated password hash')

    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { 
        email_tenantId: { 
          email: 'admin@flowcast.chat', 
          tenantId: tenant.id 
        } 
      },
      update: {
        password: hashedPassword,
        name: 'Admin User',
        role: 'super_admin',
        preferredLanguage: 'en',
        status: 'active'
      },
      create: {
        email: 'admin@flowcast.chat',
        name: 'Admin User',
        password: hashedPassword,
        role: 'super_admin',
        tenantId: tenant.id,
        preferredLanguage: 'en',
        status: 'active'
      }
    })

    console.log('✅ Admin user created/updated successfully!')
    console.log('Email: admin@flowcast.chat')
    console.log('Password: password123')
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmin()

