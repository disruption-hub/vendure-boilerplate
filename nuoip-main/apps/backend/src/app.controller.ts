import { Controller, Get, Post } from '@nestjs/common'
import type { HealthPayload } from '@ipnuo/domain'
import { AppService } from './app.service'
import { PrismaService } from './prisma/prisma.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService
  ) {}

  // Root endpoint for Railway health checks
  @Get()
  getRoot(): HealthPayload {
    return this.appService.getHealth()
  }

  @Get('/health')
  getHealth(): HealthPayload {
    return this.appService.getHealth()
  }

  // Temporary endpoint to create enum and admin user
  @Post('/setup-admin')
  async setupAdmin() {
    try {
      // First, create the UserRole enum if it doesn't exist
      await this.prisma.$executeRaw`
        DO $$
        BEGIN
          CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'user');
        EXCEPTION
          WHEN duplicate_object THEN
            RAISE NOTICE 'UserRole enum already exists';
        END
        $$;
      `

      // Check if tenant exists
      let tenant = await this.prisma.tenant.findFirst()
      if (!tenant) {
        tenant = await this.prisma.tenant.create({
          data: { name: 'Default Tenant', isActive: true }
        })
      }

      // Import bcrypt for hashing
      const bcrypt = await import('bcryptjs')

      // Hash the password properly
      const hashedPassword = await bcrypt.hash('password123', 10)

      // Create or update admin user
      const adminUser = await this.prisma.user.upsert({
        where: { email_tenantId: { email: 'admin@flowcast.chat', tenantId: tenant.id } },
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

      return {
        message: 'Admin user created/updated successfully',
        email: adminUser.email,
        password: 'password123'
      }
    } catch (error) {
      return { error: 'Failed to create/update admin user', details: error.message }
    }
  }
}
