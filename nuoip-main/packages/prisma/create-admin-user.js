import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Check if tenant exists
    let tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: 'Default Tenant', isActive: true }
      })
      console.log('Created default tenant:', tenant.id)
    }

    // Check if admin user exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'admin@flowcast.chat' }
    })

    if (existingUser) {
      console.log('Admin user already exists:', existingUser.email)
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@flowcast.chat',
        name: 'Admin User',
        password: hashedPassword,
        role: 'super_admin',
        tenantId: tenant.id,
        language: 'en',
        theme: 'dark'
      }
    })

    console.log('Created admin user:', adminUser.email)
    console.log('Login credentials: admin@flowcast.chat / password123')
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
