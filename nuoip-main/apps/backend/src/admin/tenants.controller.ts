import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException, NotFoundException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard, AdminGuard, Public } from '../common/guards/auth.guard'
import { HybridAdminGuard } from '../common/guards/hybrid-auth.guard'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { AdminTenantsService, AdminTenantSummary } from './tenants.service'

@Controller('admin/tenants')
export class AdminTenantsController {
  constructor(private readonly tenantsService: AdminTenantsService) { }

  // Public endpoint for tenant lookup (used by OTP login page)
  @Get('lookup')
  @Public()
  async lookupTenant(@Query('key') key: string): Promise<{ success: boolean; tenant?: any; error?: string }> {
    if (!key) {
      return { success: false, error: 'Missing tenant key (key parameter required)' }
    }

    try {
      const tenant = await this.tenantsService.getTenantByKey(key)
      if (!tenant) {
        return { success: false, error: 'Tenant not found' }
      }

      return {
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          logoUrl: tenant.logoUrl,
          subdomain: tenant.subdomain,
          domain: tenant.domain,
          settings: tenant.settings, // Include settings for customization
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listTenants(): Promise<AdminTenantSummary[]> {
    return this.tenantsService.listTenants()
  }

  // More specific routes must come before the generic :id route
  @Get(':id/contacts/debug')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async debugTenantContacts(@Param('id') tenantId: string): Promise<any> {
    return this.tenantsService.debugTenantContacts(tenantId)
  }

  @Get(':id/contacts')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getTenantContacts(@Param('id') tenantId: string): Promise<{ success: boolean; contacts: any[] }> {
    return this.tenantsService.getTenantContacts(tenantId)
  }

  @Put(':id/contacts/:contactId')
  @UseGuards(HybridAdminGuard)
  async updateTenantContact(
    @Param('id') tenantId: string,
    @Param('contactId') contactId: string,
    @Body() payload: { displayName?: string; phone?: string | null; email?: string | null; description?: string | null },
  ): Promise<{ success: boolean; contact: any }> {
    return this.tenantsService.updateTenantContact(tenantId, contactId, payload)
  }


  @Get(':id/customization')
  @Public()
  async getTenantCustomization(@Param('id') tenantId: string): Promise<{ customization: any }> {
    return this.tenantsService.getTenantCustomization(tenantId)
  }

  @Put(':id/customization')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateTenantCustomization(
    @Param('id') tenantId: string,
    @Body() payload: { customization: any },
  ): Promise<{ customization: any }> {
    return this.tenantsService.updateTenantCustomization(tenantId, payload.customization)
  }

  @Post(':id/logo')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new BadRequestException('Unsupported file type. Please upload a PNG, JPG, WEBP, or SVG logo.'), false)
      }
    },
  }))
  async uploadLogo(
    @Param('id') tenantId: string,
    @UploadedFile() file: any,
  ): Promise<{ logoUrl: string; width?: number; height?: number; mimeType: string }> {
    if (!file) {
      throw new BadRequestException('No file provided')
    }

    return this.tenantsService.uploadLogo(tenantId, file)
  }

  // Generic :id routes come after specific routes
  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getTenant(@Param('id') tenantId: string): Promise<any> {
    try {
      return await this.tenantsService.getTenantById(tenantId)
    } catch (error) {
      console.error('[AdminTenantsController] Error getting tenant:', {
        tenantId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createTenant(@Body() payload: CreateTenantDto): Promise<AdminTenantSummary> {
    return this.tenantsService.createTenant(payload)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateTenant(@Param('id') tenantId: string, @Body() payload: UpdateTenantDto): Promise<AdminTenantSummary> {
    return this.tenantsService.updateTenant(tenantId, payload)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deactivateTenant(@Param('id') tenantId: string): Promise<void> {
    await this.tenantsService.deactivateTenant(tenantId)
  }

}
