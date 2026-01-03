import { ConflictException, Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { normalizePhoneNumber } from '@ipnuo/shared-chat-auth'

type MulterFile = {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  buffer: Buffer
  destination?: string
  filename?: string
  path?: string
}

export interface AdminTenantSummary {
  id: string
  name: string
  domain: string | null
  isActive: boolean
  settings: Record<string, unknown> | null
  userCount: number
  trademarkCount: number
  memorySessionCount: number
  createdAt: string
  updatedAt: string
}

@Injectable()
export class AdminTenantsService {
  // Type-safe accessor for Prisma models
  // PrismaService extends PrismaClient, so all Prisma models are available
  private get prismaClient(): any {
    return this.prisma as any
  }

  constructor(private readonly prisma: PrismaService) { }

  private isPrismaError(error: unknown, code: string): boolean {
    return Boolean(
      error &&
      typeof error === 'object' &&
      'code' in (error as Record<string, unknown>) &&
      (error as Record<string, unknown>).code === code,
    )
  }

  async listTenants(): Promise<AdminTenantSummary[]> {
    const tenants = await this.prismaClient.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (tenants.length === 0) {
      return []
    }

    const tenantIds = tenants.map((tenant) => tenant.id)

    const [userCounts, trademarkCounts, memoryCounts] = await Promise.all([
      this.prismaClient.user.groupBy({
        by: ['tenantId'],
        _count: { _all: true },
        where: { tenantId: { in: tenantIds } },
      }),
      this.prismaClient.trademark.groupBy({
        by: ['tenantId'],
        _count: { _all: true },
        where: { tenantId: { in: tenantIds } },
      }),
      // MemorySession model doesn't have tenantId field, return empty counts
      Promise.resolve([] as { tenantId: string; _count: { _all: number } }[]),
    ])

    const toCountMap = <T extends { tenantId: string; _count: { _all: number } }>(collection: T[]) =>
      collection.reduce<Record<string, number>>((acc, item) => {
        acc[item.tenantId] = item._count?._all ?? 0
        return acc
      }, {})

    const userCountMap = toCountMap(userCounts)
    const trademarkCountMap = toCountMap(trademarkCounts)
    const memoryCountMap = toCountMap(memoryCounts)

    return tenants.map((tenant) =>
      this.toSummary(tenant, {
        userCount: userCountMap[tenant.id] ?? 0,
        trademarkCount: trademarkCountMap[tenant.id] ?? 0,
        memorySessionCount: memoryCountMap[tenant.id] ?? 0,
      }),
    )
  }

  async createTenant(dto: CreateTenantDto): Promise<AdminTenantSummary> {
    try {
      const tenant = await this.prismaClient.tenant.create({
        data: {
          name: dto.name.trim(),
          domain: dto.domain?.trim() || null,
          settings: dto.settings ? (dto.settings as unknown) : undefined,
        },
        select: {
          id: true,
          name: true,
          domain: true,
          isActive: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return this.toSummary(tenant, {
        userCount: 0,
        trademarkCount: 0,
        memorySessionCount: 0,
      })
    } catch (error) {
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException('Domain already in use')
      }
      throw error
    }
  }

  async updateTenant(id: string, dto: UpdateTenantDto): Promise<AdminTenantSummary> {
    try {
      const updateData: any = {}

      if (dto.name !== undefined) {
        updateData.name = dto.name.trim()
      }
      if (dto.domain !== undefined) {
        updateData.domain = dto.domain.trim() || null
      }
      if (dto.settings !== undefined) {
        // Log lyraConfig changes for debugging before conversion
        const settings = dto.settings as any
        if (settings?.lyraConfig) {
          console.log('[AdminTenantsService] Updating tenant with lyraConfig:', {
            hasLyraConfig: !!settings.lyraConfig,
            activeMode: settings.lyraConfig.activeMode,
            hasTestMode: !!settings.lyraConfig.testMode,
            hasProductionMode: !!settings.lyraConfig.productionMode,
            testModeEnabled: settings.lyraConfig.testMode?.enabled,
            productionModeEnabled: settings.lyraConfig.productionMode?.enabled,
          })
        }

        // CRITICAL: Merge with existing settings to preserve data not in the request
        // Get current tenant settings first
        const currentTenant = await this.prismaClient.tenant.findUnique({
          where: { id },
          select: { settings: true },
        })

        const currentSettings = (currentTenant?.settings && typeof currentTenant.settings === 'object')
          ? (currentTenant.settings as Record<string, unknown>)
          : {}

        // Deep merge lyraConfig to preserve testMode and productionMode credentials when only activeMode/enabled is updated
        let mergedLyraConfig = currentSettings.lyraConfig as any
        if (settings.lyraConfig) {
          const currentLyraConfig = (currentSettings.lyraConfig && typeof currentSettings.lyraConfig === 'object')
            ? (currentSettings.lyraConfig as Record<string, unknown>)
            : {}

          // Deep merge testMode: preserve credentials if only enabled is being updated
          let mergedTestMode = currentLyraConfig.testMode as any
          if (settings.lyraConfig.testMode !== undefined) {
            const currentTestMode = (currentLyraConfig.testMode && typeof currentLyraConfig.testMode === 'object')
              ? (currentLyraConfig.testMode as Record<string, unknown>)
              : {}
            const incomingTestMode = settings.lyraConfig.testMode as Record<string, unknown>
            mergedTestMode = {
              ...currentTestMode, // Preserve existing credentials and all other properties
              // Only update enabled if provided, don't spread everything to avoid overwriting credentials
              ...(incomingTestMode.enabled !== undefined ? { enabled: incomingTestMode.enabled } : {}),
              // CRITICAL: Only update credentials if they are explicitly provided AND not null/undefined
              // If credentials are missing from request, preserve existing ones
              credentials: (incomingTestMode.credentials !== undefined && incomingTestMode.credentials !== null)
                ? incomingTestMode.credentials
                : currentTestMode.credentials,
            }
          }

          // Deep merge productionMode: preserve credentials if only enabled is being updated
          let mergedProductionMode = currentLyraConfig.productionMode as any
          if (settings.lyraConfig.productionMode !== undefined) {
            const currentProductionMode = (currentLyraConfig.productionMode && typeof currentLyraConfig.productionMode === 'object')
              ? (currentLyraConfig.productionMode as Record<string, unknown>)
              : {}
            const incomingProductionMode = settings.lyraConfig.productionMode as Record<string, unknown>
            mergedProductionMode = {
              ...currentProductionMode, // Preserve existing credentials and all other properties
              // Only update enabled if provided, don't spread everything to avoid overwriting credentials
              ...(incomingProductionMode.enabled !== undefined ? { enabled: incomingProductionMode.enabled } : {}),
              // CRITICAL: Only update credentials if they are explicitly provided AND not null/undefined
              // If credentials are missing from request, preserve existing ones
              credentials: (incomingProductionMode.credentials !== undefined && incomingProductionMode.credentials !== null)
                ? incomingProductionMode.credentials
                : currentProductionMode.credentials,
            }
          }

          mergedLyraConfig = {
            ...currentLyraConfig, // Preserve existing lyraConfig (theme, language, etc.)
            ...settings.lyraConfig, // Override with new values (activeMode, etc.)
            // Use merged testMode and productionMode (deep merge to preserve credentials)
            testMode: mergedTestMode,
            productionMode: mergedProductionMode,
          }

          console.log('[AdminTenantsService] Merged lyraConfig:', {
            activeMode: mergedLyraConfig.activeMode,
            hasTestMode: !!mergedLyraConfig.testMode,
            hasProductionMode: !!mergedLyraConfig.productionMode,
            testModeEnabled: mergedLyraConfig.testMode?.enabled,
            productionModeEnabled: mergedLyraConfig.productionMode?.enabled,
            testModeHasCredentials: !!mergedLyraConfig.testMode?.credentials,
            productionModeHasCredentials: !!mergedLyraConfig.productionMode?.credentials,
          })
        }

        // Merge: new settings override existing, but preserve nested objects that aren't in the request
        const mergedSettings = {
          ...currentSettings, // Start with existing settings
          ...settings, // Override with new settings
          // Use merged lyraConfig (deep merge to preserve testMode/productionMode)
          lyraConfig: mergedLyraConfig,
          // Preserve other nested settings that might not be in the request
          customization: settings.customization !== undefined ? settings.customization : currentSettings.customization,
        }

        // Validate the merged settings before saving
        if (mergedSettings.lyraConfig && typeof mergedSettings.lyraConfig !== 'object') {
          console.error('[AdminTenantsService] Invalid lyraConfig type:', typeof mergedSettings.lyraConfig)
          throw new BadRequestException('lyraConfig must be an object')
        }

        console.log('[AdminTenantsService] Final merged settings:', {
          hasLyraConfig: !!mergedSettings.lyraConfig,
          lyraConfigType: typeof mergedSettings.lyraConfig,
          activeMode: (mergedSettings.lyraConfig as any)?.activeMode,
          testModeEnabled: (mergedSettings.lyraConfig as any)?.testMode?.enabled,
          productionModeEnabled: (mergedSettings.lyraConfig as any)?.productionMode?.enabled,
          hasCustomization: !!mergedSettings.customization,
        })

        // Final validation before saving
        const finalLyraConfig = mergedSettings.lyraConfig
        if (finalLyraConfig) {
          if (typeof finalLyraConfig !== 'object' || Array.isArray(finalLyraConfig)) {
            console.error('[AdminTenantsService] Final lyraConfig validation failed:', {
              type: typeof finalLyraConfig,
              isArray: Array.isArray(finalLyraConfig),
              value: finalLyraConfig,
            })
            throw new BadRequestException('Invalid lyraConfig structure - must be an object')
          }
        }

        updateData.settings = mergedSettings as any

        // Log what will be saved to database
        console.log('[AdminTenantsService] About to save to database:', {
          tenantId: id,
          activeMode: (updateData.settings as any)?.lyraConfig?.activeMode,
          testModeEnabled: (updateData.settings as any)?.lyraConfig?.testMode?.enabled,
          productionModeEnabled: (updateData.settings as any)?.lyraConfig?.productionMode?.enabled,
        })
      }
      if (dto.isActive !== undefined) {
        updateData.isActive = dto.isActive
      }
      // Store paymentReturnHomeUrl in settings JSON as well for Railway compatibility
      // The column exists but Prisma client cache issues on Railway prevent direct access
      if (dto.paymentReturnHomeUrl !== undefined) {
        const paymentUrl = (dto.paymentReturnHomeUrl && typeof dto.paymentReturnHomeUrl === 'string') ? dto.paymentReturnHomeUrl.trim() || null : null
        // Store in settings JSON for fallback (Railway-safe)
        if (!updateData.settings) {
          const currentTenantForSettings = await this.prismaClient.tenant.findUnique({
            where: { id },
            select: { settings: true },
          })
          updateData.settings = (currentTenantForSettings?.settings && typeof currentTenantForSettings.settings === 'object')
            ? { ...(currentTenantForSettings.settings as Record<string, unknown>), paymentReturnHomeUrl: paymentUrl }
            : { paymentReturnHomeUrl: paymentUrl }
        } else {
          ; (updateData.settings as any).paymentReturnHomeUrl = paymentUrl
        }
      }
      if (dto.displayName !== undefined) {
        updateData.displayName = (dto.displayName && typeof dto.displayName === 'string') ? dto.displayName.trim() || null : null
      }
      if (dto.legalName !== undefined) {
        updateData.legalName = (dto.legalName && typeof dto.legalName === 'string') ? dto.legalName.trim() || null : null
      }
      if (dto.tagline !== undefined) {
        updateData.tagline = (dto.tagline && typeof dto.tagline === 'string') ? dto.tagline.trim() || null : null
      }
      if (dto.contactEmail !== undefined) {
        updateData.contactEmail = (dto.contactEmail && typeof dto.contactEmail === 'string') ? dto.contactEmail.trim() || null : null
      }
      if (dto.contactPhone !== undefined) {
        updateData.contactPhone = (dto.contactPhone && typeof dto.contactPhone === 'string') ? dto.contactPhone.trim() || null : null
      }
      if (dto.websiteUrl !== undefined) {
        updateData.websiteUrl = (dto.websiteUrl && typeof dto.websiteUrl === 'string') ? dto.websiteUrl.trim() || null : null
      }
      if (dto.industry !== undefined) {
        updateData.industry = (dto.industry && typeof dto.industry === 'string') ? dto.industry.trim() || null : null
      }
      if (dto.addressLine1 !== undefined) {
        updateData.addressLine1 = (dto.addressLine1 && typeof dto.addressLine1 === 'string') ? dto.addressLine1.trim() || null : null
      }
      if (dto.addressLine2 !== undefined) {
        updateData.addressLine2 = (dto.addressLine2 && typeof dto.addressLine2 === 'string') ? dto.addressLine2.trim() || null : null
      }
      if (dto.city !== undefined) {
        updateData.city = (dto.city && typeof dto.city === 'string') ? dto.city.trim() || null : null
      }
      if (dto.state !== undefined) {
        updateData.state = (dto.state && typeof dto.state === 'string') ? dto.state.trim() || null : null
      }
      if (dto.postalCode !== undefined) {
        updateData.postalCode = (dto.postalCode && typeof dto.postalCode === 'string') ? dto.postalCode.trim() || null : null
      }
      if (dto.country !== undefined) {
        updateData.country = (dto.country && typeof dto.country === 'string') ? dto.country.trim() || null : null
      }
      if (dto.subdomain !== undefined) {
        updateData.subdomain = (dto.subdomain && typeof dto.subdomain === 'string') ? dto.subdomain.trim() || null : null
      }

      const tenant = await this.prismaClient.tenant.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          domain: true,
          isActive: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // Verify what was actually saved to database
      const savedSettings = tenant.settings as any
      const savedLyraConfig = savedSettings?.lyraConfig
      if (savedLyraConfig) {
        console.log('[AdminTenantsService] ✅ Tenant saved to database with lyraConfig:', {
          tenantId: id,
          tenantName: tenant.name,
          activeMode: savedLyraConfig.activeMode,
          testModeEnabled: savedLyraConfig.testMode?.enabled,
          productionModeEnabled: savedLyraConfig.productionMode?.enabled,
          testModeHasCredentials: !!savedLyraConfig.testMode?.credentials,
          productionModeHasCredentials: !!savedLyraConfig.productionMode?.credentials,
        })
      } else {
        console.warn('[AdminTenantsService] ⚠️ Tenant saved but no lyraConfig found in saved settings!')
      }

      // Get counts for the updated tenant
      const [userCounts, trademarkCounts, memoryCounts] = await Promise.all([
        this.prismaClient.user.groupBy({
          by: ['tenantId'],
          _count: { _all: true },
          where: { tenantId: id },
        }),
        this.prismaClient.trademark.groupBy({
          by: ['tenantId'],
          _count: { _all: true },
          where: { tenantId: id },
        }),
        this.prismaClient.memorySession.groupBy({
          by: ['tenantId'],
          _count: { _all: true },
          where: { tenantId: id },
        }),
      ])

      return this.toSummary(tenant, {
        userCount: userCounts[0]?._count?._all ?? 0,
        trademarkCount: trademarkCounts[0]?._count?._all ?? 0,
        memorySessionCount: memoryCounts[0]?._count?._all ?? 0,
      })
    } catch (error) {
      if (this.isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Tenant not found')
      }
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException('Domain already in use')
      }
      throw error
    }
  }

  async deactivateTenant(id: string): Promise<void> {
    try {
      await this.prismaClient.tenant.update({
        where: { id },
        data: { isActive: false },
      })
    } catch (error) {
      if (this.isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Tenant not found')
      }
      throw error
    }
  }

  async getTenantById(id: string): Promise<any> {
    try {
      const tenant = await this.prismaClient.tenant.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          domain: true,
          subdomain: true,
          displayName: true,
          legalName: true,
          tagline: true,
          contactEmail: true,
          contactPhone: true,
          websiteUrl: true,
          // paymentReturnHomeUrl: true, // Removed - Prisma client cache issue on Railway, fetched from settings instead
          industry: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          primaryColor: true,
          logoUrl: true,
          logoWidth: true,
          logoHeight: true,
          logoMimeType: true,
          logoBlurData: true,
          logoUpdatedAt: true,
          isActive: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // Extract paymentReturnHomeUrl from settings (Railway-safe fallback)
      const settings = tenant?.settings as any
      const paymentReturnHomeUrl = settings?.paymentReturnHomeUrl || null
      if (tenant) {
        ; (tenant as any).paymentReturnHomeUrl = paymentReturnHomeUrl
      }

      if (!tenant) {
        throw new NotFoundException('Tenant not found')
      }

      // Log what we're returning, especially lyraConfig
      try {
        const settings = tenant.settings as any
        const lyraConfig = settings?.lyraConfig
        console.log('[AdminTenantsService] getTenantById returning:', {
          tenantId: id,
          tenantName: tenant.name,
          hasSettings: !!settings,
          settingsKeys: settings ? Object.keys(settings) : [],
          hasLyraConfig: !!lyraConfig,
          lyraConfigKeys: lyraConfig ? Object.keys(lyraConfig) : [],
          activeMode: lyraConfig?.activeMode,
          testModeEnabled: lyraConfig?.testMode?.enabled,
          productionModeEnabled: lyraConfig?.productionMode?.enabled,
          testModeHasCredentials: !!lyraConfig?.testMode?.credentials,
          productionModeHasCredentials: !!lyraConfig?.productionMode?.credentials,
        })
      } catch (logError) {
        console.error('[AdminTenantsService] Error logging tenant details:', {
          tenantId: id,
          error: logError instanceof Error ? logError.message : String(logError),
        })
        // Don't fail the request if logging fails
      }

      return tenant
    } catch (error) {
      console.error('[AdminTenantsService] Error in getTenantById:', {
        tenantId: id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      if (error instanceof NotFoundException) {
        throw error
      }
      // Re-throw as InternalServerErrorException to provide better error context
      throw new HttpException(
        `Failed to retrieve tenant: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getTenantByKey(key: string): Promise<{ id: string; name: string; logoUrl: string | null; subdomain: string | null; domain: string | null; settings: any } | null> {
    const tenant = await this.prismaClient.tenant.findFirst({
      where: {
        OR: [
          { subdomain: key },
          { id: key },
          { domain: key },
        ],
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        subdomain: true,
        domain: true,
        settings: true,
      },
    })

    if (!tenant) {
      return null
    }

    // Prefer data URL from settings.branding.logoUrl over logoUrl field
    // settings.branding.logoUrl contains the actual image data (data URL)
    // logoUrl field may contain a relative path that needs to be served
    let logoUrl = null

    if (tenant.settings) {
      try {
        const settings = typeof tenant.settings === 'string'
          ? JSON.parse(tenant.settings)
          : tenant.settings
        if (settings?.branding?.logoUrl) {
          // Prefer data URL from settings (this is the actual uploaded logo)
          logoUrl = settings.branding.logoUrl
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Fallback to logoUrl field if no data URL in settings
    if (!logoUrl) {
      logoUrl = tenant.logoUrl
    }

    return {
      ...tenant,
      logoUrl: logoUrl || null,
    }
  }

  async uploadLogo(tenantId: string, file: MulterFile): Promise<{ logoUrl: string; width?: number; height?: number; mimeType: string }> {
    try {
      // Check if tenant exists
      const tenant = await this.prismaClient.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, settings: true },
      })

      if (!tenant) {
        throw new NotFoundException('Tenant not found')
      }

      // Convert file to base64 data URL
      const base64 = file.buffer.toString('base64')
      const dataUrl = `data:${file.mimetype};base64,${base64}`

      // Get image dimensions if it's a raster image (not SVG)
      let width: number | undefined
      let height: number | undefined

      if (file.mimetype !== 'image/svg+xml') {
        try {
          // For now, we'll skip dimension extraction as it requires additional dependencies
          // In production, you might want to use sharp or jimp to get dimensions
          width = undefined
          height = undefined
        } catch {
          // Ignore dimension extraction errors
        }
      }

      // Update tenant settings with logo
      const currentSettings = (tenant.settings && typeof tenant.settings === 'object'
        ? tenant.settings as Record<string, unknown>
        : {}) as Record<string, unknown>

      const updatedSettings = {
        ...currentSettings,
        branding: {
          ...(currentSettings.branding && typeof currentSettings.branding === 'object'
            ? currentSettings.branding as Record<string, unknown>
            : {}),
          logoUrl: dataUrl,
        },
      }

      await this.prismaClient.tenant.update({
        where: { id: tenantId },
        data: {
          // Update top-level logoUrl so payment forms can display it
          logoUrl: dataUrl,
          logoWidth: width,
          logoHeight: height,
          logoMimeType: file.mimetype,
          logoUpdatedAt: new Date(),
          // Also update settings.branding.logoUrl for backward compatibility
          settings: updatedSettings as unknown,
        },
      })

      return {
        logoUrl: dataUrl,
        width,
        height,
        mimeType: file.mimetype,
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      if (this.isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Tenant not found')
      }
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to upload logo')
    }
  }

  private toSummary(
    tenant: {
      id: string
      name: string
      domain: string | null
      isActive: boolean
      settings: unknown
      createdAt: Date
      updatedAt: Date
    },
    counts: { userCount: number; trademarkCount: number; memorySessionCount: number },
  ): AdminTenantSummary {
    return {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      isActive: tenant.isActive,
      settings: tenant.settings && typeof tenant.settings === 'object' ? (tenant.settings as Record<string, unknown>) : null,
      userCount: counts.userCount,
      trademarkCount: counts.trademarkCount,
      memorySessionCount: counts.memorySessionCount,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    }
  }

  async getTenantCustomization(tenantIdOrKey: string): Promise<{ customization: any }> {
    try {
      // Try to find tenant by ID, subdomain, or domain
      const tenant = await this.prismaClient.tenant.findFirst({
        where: {
          OR: [
            { id: tenantIdOrKey },
            { subdomain: tenantIdOrKey },
            { domain: tenantIdOrKey },
          ],
        },
        select: {
          id: true,
          settings: true,
        },
      })

      if (!tenant) {
        return { customization: null }
      }

      // Extract customization from settings
      let customization = null
      if (tenant.settings) {
        try {
          const settings = typeof tenant.settings === 'string'
            ? JSON.parse(tenant.settings)
            : tenant.settings
          customization = settings?.customization || null
        } catch (error) {
          console.error('[getTenantCustomization] Error parsing settings:', error)
        }
      }

      return { customization }
    } catch (error) {
      console.error('[getTenantCustomization] Error:', error)
      return { customization: null }
    }
  }

  async updateTenantCustomization(tenantId: string, customization: any): Promise<{ customization: any }> {
    try {
      // Check if tenant exists
      const tenant = await this.prismaClient.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, settings: true },
      })

      if (!tenant) {
        throw new NotFoundException('Tenant not found')
      }

      // Merge customization into settings
      const currentSettings = (tenant.settings && typeof tenant.settings === 'object'
        ? tenant.settings as Record<string, unknown>
        : {}) as Record<string, unknown>

      const updatedSettings = {
        ...currentSettings,
        customization,
      }

      await this.prismaClient.tenant.update({
        where: { id: tenantId },
        data: {
          settings: updatedSettings as unknown,
        },
      })

      return { customization }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      if (this.isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Tenant not found')
      }
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to update customization')
    }
  }

  async getTenantContacts(tenantId: string, userId?: string): Promise<{ success: boolean; contacts: any[] }> {
    const startTime = Date.now()
    // Debug mode: set to true for verbose logging (causes Railway rate limiting if enabled in production)
    const DEBUG_LOGGING = process.env.DEBUG_CONTACTS === 'true'

    console.log('[getTenantContacts] Starting contact enrichment', { tenantId, userId })

    // Validate tenant exists
    const tenant = await this.prismaClient.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    })

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`)
    }

    // Get all chatbot contacts for this tenant using Prisma
    // Include linked WhatsAppContacts to get sessionId and jid
    const chatbotContacts = await this.prismaClient.chatbotContact.findMany({
      where: { tenantId },
      include: {
        whatsapp_contacts: {
          select: {
            sessionId: true,
            jid: true,
            sessionStatus: true,
            sessionStartedAt: true,
            lastSessionClosedAt: true,
          },
        },
      },
    })

    if (DEBUG_LOGGING) console.log('[getTenantContacts] Fetched chatbot contacts via Prisma:', chatbotContacts.length)

    // Get all tenant users
    // CRITICAL: Include metadata to preserve existing WhatsApp info
    const tenantUsers = await this.prismaClient.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        phone: true,
        profilePictureUrl: true,
        role: true,
        metadata: true, // Include metadata to preserve existing WhatsApp info
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })
    if (DEBUG_LOGGING) console.log('[getTenantContacts] Fetched tenant users', {
      tenantId,
      count: tenantUsers.length,
    })

    // Fetch unread counts if userId is provided
    const unreadCounts = new Map<string, number>()
    const lastMessageTimes = new Map<string, Date>()

    if (userId) {
      const unreadMessages = await this.prismaClient.tenantUserChatMessage.groupBy({
        by: ['senderId'],
        where: {
          recipientId: userId,
          readAt: null,
          tenantId,
        },
        _count: {
          _all: true,
        },
      })

      unreadMessages.forEach(item => {
        unreadCounts.set(item.senderId, item._count._all)
      })

      // Also get last message time for sorting
      const lastMessages = await this.prismaClient.tenantUserChatMessage.groupBy({
        by: ['senderId', 'recipientId'],
        where: {
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
          tenantId,
        },
        _max: {
          createdAt: true,
        },
      })

      lastMessages.forEach(item => {
        const otherId = item.senderId === userId ? item.recipientId : item.senderId
        const time = item._max.createdAt
        if (time) {
          const existing = lastMessageTimes.get(otherId)
          if (!existing || time > existing) {
            lastMessageTimes.set(otherId, time)
          }
        }
      })
    }

    // Helper function to normalize phone numbers to E.164 format
    const normalizePhone = (phone: string | null | undefined): string | null => {
      if (!phone || typeof phone !== 'string' || !phone.trim()) {
        return null
      }
      try {
        const normalized = normalizePhoneNumber(phone.trim())
        return normalized?.normalized || null
      } catch (error) {
        if (DEBUG_LOGGING) console.warn('[getTenantContacts] Failed to normalize phone number', { phone })
        return null
      }
    }

    // Also fetch WhatsAppContacts by phone number, userId, and JID to enrich contacts that aren't directly linked
    // This helps when contacts exist but aren't linked via chatbotContactId or userId
    const phoneToWhatsAppMap = new Map<string, { sessionId: string; jid: string; sessionStatus: string | null; sessionStartedAt: Date | null; lastSessionClosedAt: Date | null }>()
    const userIdToWhatsAppMap = new Map<string, { sessionId: string; jid: string; sessionStatus: string | null; sessionStartedAt: Date | null; lastSessionClosedAt: Date | null }>()
    const jidToWhatsAppMap = new Map<string, { sessionId: string; jid: string; sessionStatus: string | null; sessionStartedAt: Date | null; lastSessionClosedAt: Date | null }>()

    // Collect and normalize phone numbers from both chatbotContacts and tenantUsers
    const rawPhoneNumbers = [
      ...chatbotContacts.map(c => c.phone).filter((phone): phone is string => !!phone && phone.trim().length > 0),
      ...tenantUsers.map(u => u.phone).filter((phone): phone is string => !!phone && phone.trim().length > 0),
    ]

    // Normalize phone numbers and create mapping from original to normalized
    const phoneNormalizationMap = new Map<string, string>() // original -> normalized
    const normalizedPhoneNumbers: string[] = []

    rawPhoneNumbers.forEach(originalPhone => {
      const normalized = normalizePhone(originalPhone)
      if (normalized) {
        phoneNormalizationMap.set(originalPhone, normalized)
        if (!normalizedPhoneNumbers.includes(normalized)) {
          normalizedPhoneNumbers.push(normalized)
        }
      } else {
        if (DEBUG_LOGGING) console.warn('[getTenantContacts] Could not normalize phone number', { original: originalPhone })
      }
    })

    // Collect user IDs
    const allUserIds = tenantUsers.map(u => u.id)

    if (normalizedPhoneNumbers.length > 0 || allUserIds.length > 0) {
      try {
        // Fetch WhatsAppContacts by normalized phone number
        if (normalizedPhoneNumbers.length > 0) {
          // Also fetch with original phone numbers in case they're stored as-is
          const allPhoneVariants = [...new Set([...normalizedPhoneNumbers, ...rawPhoneNumbers])]

          // Extract last 9-10 digits from normalized phones for partial matching
          const partialPhoneMatches: string[] = []
          normalizedPhoneNumbers.forEach(normalized => {
            const digitsOnly = normalized.replace(/\+/g, '').replace(/^\d{1,3}/, '') // Remove country code
            const last9 = digitsOnly.slice(-9)
            const last10 = digitsOnly.slice(-10)
            if (last9 && last9.length === 9) partialPhoneMatches.push(last9)
            if (last10 && last10.length === 10 && last10 !== last9) partialPhoneMatches.push(last10)
          })

          // Also extract from raw phone numbers
          rawPhoneNumbers.forEach(raw => {
            const digitsOnly = raw.replace(/[^0-9]/g, '')
            const last9 = digitsOnly.slice(-9)
            const last10 = digitsOnly.slice(-10)
            if (last9 && last9.length === 9) partialPhoneMatches.push(last9)
            if (last10 && last10.length === 10 && last10 !== last9) partialPhoneMatches.push(last10)
          })

          const uniquePartialMatches = [...new Set(partialPhoneMatches)]

          if (DEBUG_LOGGING) console.log('[getTenantContacts] Phone matching query', {
            allPhoneVariantsCount: allPhoneVariants.length,
            partialMatchesCount: uniquePartialMatches.length,
          })

          const whatsappContactsByPhone = await this.prismaClient.whatsAppContact.findMany({
            where: {
              OR: [
                // Exact matches
                {
                  phoneNumber: {
                    in: allPhoneVariants,
                  },
                },
                // Contains matches (for partial country codes)
                ...normalizedPhoneNumbers.map(normalized => ({
                  phoneNumber: {
                    contains: normalized.replace('+', ''), // Try without + prefix
                  },
                })),
                // Partial matches: last 9-10 digits
                ...uniquePartialMatches.map(partial => ({
                  phoneNumber: {
                    endsWith: partial, // Match if phoneNumber ends with these digits
                  },
                })),
              ],
            },
            select: {
              phoneNumber: true,
              sessionId: true,
              jid: true,
              sessionStatus: true,
              sessionStartedAt: true,
              lastSessionClosedAt: true,
            },
          })

          if (DEBUG_LOGGING) console.log('[getTenantContacts] WhatsAppContacts found by phone', {
            queryPhoneCount: allPhoneVariants.length,
            foundCount: whatsappContactsByPhone.length,
          })

          whatsappContactsByPhone.forEach(wc => {
            if (wc.sessionId && wc.jid) {
              // Normalize the WhatsAppContact's phone number
              const normalizedWcPhone = normalizePhone(wc.phoneNumber)
              const variations = new Set<string>()

              // Add to map with both original and normalized phone numbers
              if (normalizedWcPhone) {
                phoneToWhatsAppMap.set(normalizedWcPhone, {
                  sessionId: wc.sessionId,
                  jid: wc.jid,
                  sessionStatus: wc.sessionStatus,
                  sessionStartedAt: wc.sessionStartedAt,
                  lastSessionClosedAt: wc.lastSessionClosedAt,
                })

                // Also extract last N digits for partial matching (handles missing country code)
                // Try removing country code (1, 2, or 3 digits) and get last 9-10
                const allDigits = normalizedWcPhone.replace(/\+/g, '').replace(/[^0-9]/g, '')

                // Add last 9-10 digits from full number
                const last9Digits = allDigits.slice(-9)
                const last10Digits = allDigits.slice(-10)
                if (last9Digits && last9Digits.length === 9) {
                  variations.add(last9Digits)
                }
                if (last10Digits && last10Digits.length === 10) {
                  variations.add(last10Digits)
                }

                // Try removing 1, 2, or 3 digits from start (country codes)
                for (let ccLength = 1; ccLength <= 3 && ccLength < allDigits.length; ccLength++) {
                  const withoutCC = allDigits.substring(ccLength)
                  const last9 = withoutCC.slice(-9)
                  const last10 = withoutCC.slice(-10)

                  if (last9 && last9.length === 9) {
                    variations.add(last9)
                  }
                  if (last10 && last10.length === 10) {
                    variations.add(last10)
                  }
                }

                // Add all variations to map
                variations.forEach(variation => {
                  phoneToWhatsAppMap.set(variation, {
                    sessionId: wc.sessionId,
                    jid: wc.jid,
                    sessionStatus: wc.sessionStatus,
                    sessionStartedAt: wc.sessionStartedAt,
                    lastSessionClosedAt: wc.lastSessionClosedAt,
                  })
                })
              }
              if (wc.phoneNumber) {
                phoneToWhatsAppMap.set(wc.phoneNumber, {
                  sessionId: wc.sessionId,
                  jid: wc.jid,
                  sessionStatus: wc.sessionStatus,
                  sessionStartedAt: wc.sessionStartedAt,
                  lastSessionClosedAt: wc.lastSessionClosedAt,
                })
              }

              // Also add to JID map for fallback matching
              jidToWhatsAppMap.set(wc.jid, {
                sessionId: wc.sessionId,
                jid: wc.jid,
                sessionStatus: wc.sessionStatus,
                sessionStartedAt: wc.sessionStartedAt,
                lastSessionClosedAt: wc.lastSessionClosedAt,
              })


            }
          })
        }

        // Fetch WhatsAppContacts by userId
        if (allUserIds.length > 0) {
          const whatsappContactsByUserId = await this.prismaClient.whatsAppContact.findMany({
            where: {
              userId: {
                in: allUserIds,
              },
            },
            select: {
              userId: true,
              sessionId: true,
              jid: true,
              sessionStatus: true,
              sessionStartedAt: true,
              lastSessionClosedAt: true,
            },
          })

          if (DEBUG_LOGGING) console.log('[getTenantContacts] WhatsAppContacts found by userId', {
            queryUserIdsCount: allUserIds.length,
            foundCount: whatsappContactsByUserId.length,
          })

          whatsappContactsByUserId.forEach(wc => {
            if (wc.userId && wc.sessionId && wc.jid) {
              userIdToWhatsAppMap.set(wc.userId, {
                sessionId: wc.sessionId,
                jid: wc.jid,
                sessionStatus: wc.sessionStatus,
                sessionStartedAt: wc.sessionStartedAt,
                lastSessionClosedAt: wc.lastSessionClosedAt,
              })

              // Also add to JID map for fallback matching
              jidToWhatsAppMap.set(wc.jid, {
                sessionId: wc.sessionId,
                jid: wc.jid,
                sessionStatus: wc.sessionStatus,
                sessionStartedAt: wc.sessionStartedAt,
                lastSessionClosedAt: wc.lastSessionClosedAt,
              })


            }
          })
        }

        // Fetch all WhatsAppContacts for JID matching (fallback)
        // This is a broader query but helps when phone/userId matching fails
        // Only fetch WhatsAppContacts from sessions that belong to this tenant
        try {
          const allWhatsAppContacts = await this.prismaClient.whatsAppContact.findMany({
            where: {
              whatsapp_sessions: {
                tenantId: tenantId,
              },
            },
            select: {
              sessionId: true,
              jid: true,
              phoneNumber: true,
              userId: true,
              chatbotContactId: true,
              sessionStatus: true,
              sessionStartedAt: true,
              lastSessionClosedAt: true,
            },
            take: 1000, // Limit to prevent performance issues
          })

          if (DEBUG_LOGGING) console.log('[getTenantContacts] Fetched all WhatsAppContacts for tenant', {
            totalCount: allWhatsAppContacts.length,
          })

          allWhatsAppContacts.forEach(wc => {
            if (wc.sessionId && wc.jid) {
              jidToWhatsAppMap.set(wc.jid, {
                sessionId: wc.sessionId,
                jid: wc.jid,
                sessionStatus: wc.sessionStatus,
                sessionStartedAt: wc.sessionStartedAt,
                lastSessionClosedAt: wc.lastSessionClosedAt,
              })

              // Extract phone from JID if phoneNumber is not set
              // JID format: 51949833976@s.whatsapp.net
              let phoneFromJid: string | null = null
              if (!wc.phoneNumber && wc.jid.includes('@')) {
                const jidPhone = wc.jid.split('@')[0]
                if (jidPhone && /^\d+$/.test(jidPhone)) {
                  phoneFromJid = jidPhone
                }
              }

              // Try to match by phone number using partial matching
              // Use phoneNumber if available, otherwise use phone extracted from JID
              const phoneToUse = wc.phoneNumber || phoneFromJid
              if (phoneToUse) {
                const normalizedWcPhone = normalizePhone(phoneToUse)
                if (normalizedWcPhone) {
                  // Remove + and get all digits
                  const allDigits = normalizedWcPhone.replace(/\+/g, '').replace(/[^0-9]/g, '')

                  // For partial matching, try multiple approaches:
                  // 1. Last 9 digits (most common for mobile numbers without country code)
                  // 2. Last 10 digits (for numbers with area code)
                  const last9Digits = allDigits.slice(-9)
                  const last10Digits = allDigits.slice(-10)

                  // 3. Try removing country code (1, 2, or 3 digits) and get last 9-10
                  // This handles cases like +51949833976 -> remove 51 -> 949833976
                  // We try all possibilities (1, 2, 3 digits) because country codes vary
                  const variations = new Set<string>()

                  // Add last 9-10 digits from full number
                  if (last9Digits && last9Digits.length === 9) {
                    variations.add(last9Digits)
                  }
                  if (last10Digits && last10Digits.length === 10) {
                    variations.add(last10Digits)
                  }

                  // Try removing 1, 2, or 3 digits from start (country codes)
                  for (let ccLength = 1; ccLength <= 3 && ccLength < allDigits.length; ccLength++) {
                    const withoutCC = allDigits.substring(ccLength)
                    const last9 = withoutCC.slice(-9)
                    const last10 = withoutCC.slice(-10)

                    if (last9 && last9.length === 9) {
                      variations.add(last9)
                    }
                    if (last10 && last10.length === 10) {
                      variations.add(last10)
                    }
                  }

                  // Add all variations to map
                  variations.forEach(variation => {
                    phoneToWhatsAppMap.set(variation, {
                      sessionId: wc.sessionId,
                      jid: wc.jid,
                      sessionStatus: wc.sessionStatus,
                      sessionStartedAt: wc.sessionStartedAt,
                      lastSessionClosedAt: wc.lastSessionClosedAt,
                    })
                  })

                  // Also add the full normalized phone
                  phoneToWhatsAppMap.set(normalizedWcPhone, {
                    sessionId: wc.sessionId,
                    jid: wc.jid,
                    sessionStatus: wc.sessionStatus,
                    sessionStartedAt: wc.sessionStartedAt,
                    lastSessionClosedAt: wc.lastSessionClosedAt,
                  })


                }
              }
            }
          })
        } catch (jidMatchError) {
          console.error('[getTenantContacts] Error fetching WhatsAppContacts for JID matching', {
            error: jidMatchError instanceof Error ? jidMatchError.message : 'unknown-error',
          })
        }
      } catch (error) {
        console.error('[getTenantContacts] Error fetching WhatsAppContacts', {
          error: error instanceof Error ? error.message : 'unknown-error',
          stack: error instanceof Error ? error.stack : undefined,
        })
      }
    }

    // CRITICAL: Fetch orphaned WhatsAppContacts (those without a linked ChatbotContact)
    // These are contacts created from incoming WhatsApp messages that couldn't extract a phone number
    // Without this, they won't appear in the UI after reload

    // CRITICAL: Track JIDs that were ACTUALLY used to enrich contacts during mapping
    // This will be populated during ChatbotContact and TenantUser mapping below
    const actuallyEnrichedJids = new Set<string>()

    // Store potentially orphaned contacts - will be filtered after mapping
    let potentiallyOrphanedContacts: Array<{
      id: string
      sessionId: string
      jid: string
      name: string | null
      phoneNumber: string | null
      lastMessageAt: Date | null
      unreadCount: number
      metadata: any
      sessionStatus: string | null
      sessionStartedAt: Date | null
    }> = []

    try {
      // Fetch ALL WhatsAppContacts for this tenant directly
      // This is now possible because we added tenantId to WhatsAppContact
      const allTenantWhatsAppContacts = await this.prismaClient.whatsAppContact.findMany({
        where: {
          tenantId: tenantId,
        },
        select: {
          id: true,
          sessionId: true,
          jid: true,
          name: true,
          phoneNumber: true,
          lastMessageAt: true,
          unreadCount: true,
          metadata: true,
          chatbotContactId: true,
          sessionStatus: true,
          sessionStartedAt: true,
          lastSessionClosedAt: true,
        },
      })

      // Create a set of ChatbotContact IDs that we have already fetched
      const fetchedChatbotContactIds = new Set(chatbotContacts.map(c => c.id))

      // CRITICAL: Track JIDs that were ACTUALLY used to enrich contacts
      // This will be populated during contact mapping below - NOT from jidToWhatsAppMap.keys()
      // Using all jidToWhatsAppMap keys was incorrect because it excluded orphaned contacts
      // that weren't actually matched to any ChatbotContact or TenantUser
      const actuallyEnrichedJids = new Set<string>()

      if (DEBUG_LOGGING) console.log('[getTenantContacts] JID deduplication - starting with empty set')

      // Filter for contacts that are effectively orphaned:
      // 1. chatbotContactId is null (truly orphaned)
      // 2. OR chatbotContactId points to a contact we didn't fetch (e.g. wrong tenant)
      // NOTE: We will filter by actuallyEnrichedJids AFTER processing contacts
      const potentiallyOrphaned = allTenantWhatsAppContacts.filter(c =>
        (!c.chatbotContactId || !fetchedChatbotContactIds.has(c.chatbotContactId))
      )

      // Store for later filtering - we'll filter by actuallyEnrichedJids after mapping
      potentiallyOrphanedContacts = potentiallyOrphaned

      if (DEBUG_LOGGING) console.log('[getTenantContacts] Found potentially orphaned WhatsAppContacts', {
        tenantId,
        potentiallyOrphanedCount: potentiallyOrphaned.length,
      })
    } catch (orphanError) {
      console.error('[getTenantContacts] Error fetching orphaned WhatsAppContacts', {
        error: orphanError instanceof Error ? orphanError.message : 'unknown-error',
      })
    }

    // NOTE: Orphaned contacts mapping moved AFTER ChatbotContact and TenantUser mapping
    // so that actuallyEnrichedJids is populated first

    const mappedChatbotContacts = chatbotContacts.map(contact => {
      // Start with existing metadata
      let metadata = contact.metadata && typeof contact.metadata === 'object'
        ? { ...(contact.metadata as Record<string, any>) }
        : {}

      // If metadata doesn't have WhatsApp info but we have linked WhatsAppContacts, add it
      // Note: Relation name is 'whatsapp_contacts' (snake_case) from schema
      const whatsappContacts = (contact as any).whatsapp_contacts || []

      if (DEBUG_LOGGING) console.log('[getTenantContacts] Processing contact', {
        contactId: contact.id,
        displayName: contact.displayName,
        hasWhatsappContacts: whatsappContacts.length > 0,
      })

      // First try linked WhatsAppContacts
      if ((!metadata.whatsappSessionId || !metadata.whatsappJid) && whatsappContacts.length > 0) {
        const whatsappContact = whatsappContacts[0]
        if (whatsappContact.sessionId && whatsappContact.jid) {
          metadata.whatsappSessionId = whatsappContact.sessionId
          metadata.whatsappJid = whatsappContact.jid
          metadata.sessionStatus = whatsappContact.sessionStatus
          metadata.sessionStartTime = whatsappContact.sessionStartedAt?.toISOString()
          metadata.lastSessionClosedAt = whatsappContact.lastSessionClosedAt?.toISOString()
        }
      }

      // If still no WhatsApp info, try to find by phone number (with normalization and partial matching)
      if ((!metadata.whatsappSessionId || !metadata.whatsappJid) && contact.phone) {
        const normalizedContactPhone = normalizePhone(contact.phone)

        // Try original phone number first
        let whatsappByPhone = phoneToWhatsAppMap.get(contact.phone)

        // Try normalized phone number if original didn't match
        if (!whatsappByPhone && normalizedContactPhone) {
          whatsappByPhone = phoneToWhatsAppMap.get(normalizedContactPhone)
        }

        // Try partial matching: extract last 9-10 digits (handles missing country code)
        if (!whatsappByPhone && contact.phone) {
          const phoneDigits = contact.phone.replace(/[^0-9]/g, '')
          const last9Digits = phoneDigits.slice(-9)
          const last10Digits = phoneDigits.slice(-10)

          whatsappByPhone = phoneToWhatsAppMap.get(last9Digits) || phoneToWhatsAppMap.get(last10Digits)
        }

        if (whatsappByPhone) {
          metadata.whatsappSessionId = whatsappByPhone.sessionId
          metadata.whatsappJid = whatsappByPhone.jid
          metadata.sessionStatus = whatsappByPhone.sessionStatus
          metadata.sessionStartTime = whatsappByPhone.sessionStartedAt?.toISOString()
          metadata.lastSessionClosedAt = whatsappByPhone.lastSessionClosedAt?.toISOString()
        }
      }

      // JID-based matching fallback: Check if any linked WhatsAppContacts have JIDs we can match
      if ((!metadata.whatsappSessionId || !metadata.whatsappJid) && whatsappContacts.length > 0) {
        for (const wc of whatsappContacts) {
          if (wc.jid && jidToWhatsAppMap.has(wc.jid)) {
            const whatsappByJid = jidToWhatsAppMap.get(wc.jid)!
            metadata.whatsappSessionId = whatsappByJid.sessionId
            metadata.whatsappJid = whatsappByJid.jid
            metadata.sessionStatus = whatsappByJid.sessionStatus
            metadata.sessionStartTime = whatsappByJid.sessionStartedAt?.toISOString()
            metadata.lastSessionClosedAt = whatsappByJid.lastSessionClosedAt?.toISOString()
            break
          }
        }
      }

      // Final validation: Ensure whatsappSessionId and whatsappJid are strings (not null/undefined)
      if (metadata.whatsappSessionId && typeof metadata.whatsappSessionId !== 'string') {
        metadata.whatsappSessionId = String(metadata.whatsappSessionId)
      }
      if (metadata.whatsappJid && typeof metadata.whatsappJid !== 'string') {
        metadata.whatsappJid = String(metadata.whatsappJid)
      }

      if (!metadata.whatsappSessionId || !metadata.whatsappJid) {
        if (DEBUG_LOGGING) console.warn('[getTenantContacts] Contact has no WhatsApp info', {
          contactId: contact.id,
          displayName: contact.displayName,
        })
      }

      // Ensure metadata is always an object (not null) to prevent frontend errors
      // Final validation: Remove any null/undefined/invalid values from whatsappSessionId and whatsappJid
      const finalMetadata: Record<string, any> = {}

      // Copy all valid metadata fields
      Object.keys(metadata).forEach(key => {
        const value = metadata[key]
        // Only include non-null, non-undefined values
        if (value !== null && value !== undefined) {
          finalMetadata[key] = value
        }
      })

      // Ensure whatsappSessionId and whatsappJid are strings if present
      if (finalMetadata.whatsappSessionId && typeof finalMetadata.whatsappSessionId !== 'string') {
        finalMetadata.whatsappSessionId = String(finalMetadata.whatsappSessionId)
      }
      if (finalMetadata.whatsappJid && typeof finalMetadata.whatsappJid !== 'string') {
        finalMetadata.whatsappJid = String(finalMetadata.whatsappJid)
      }

      // Remove invalid whatsapp fields (empty strings, null, undefined)
      if (!finalMetadata.whatsappSessionId || typeof finalMetadata.whatsappSessionId !== 'string' || finalMetadata.whatsappSessionId.trim() === '') {
        delete finalMetadata.whatsappSessionId
      }
      if (!finalMetadata.whatsappJid || typeof finalMetadata.whatsappJid !== 'string' || finalMetadata.whatsappJid.trim() === '') {
        delete finalMetadata.whatsappJid
      }

      // TRACK: If this contact was enriched with WhatsApp JID, track it to prevent duplicates
      if (finalMetadata.whatsappJid && typeof finalMetadata.whatsappJid === 'string' && finalMetadata.whatsappJid.trim()) {
        actuallyEnrichedJids.add(finalMetadata.whatsappJid.trim())
      }

      return {
        id: contact.id,
        tenantId: contact.tenantId,
        type: contact.type,
        displayName: contact.displayName,
        phone: contact.phone || null, // Ensure phone is null if empty
        description: contact.description || null,
        avatarUrl: contact.avatarUrl || null,
        isFlowbot: contact.isDefaultFlowbot,
        // Add additional fields that might be expected
        name: contact.displayName,
        email: contact.email || null,
        createdAt: contact.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: contact.updatedAt?.toISOString() || new Date().toISOString(),
        metadata: Object.keys(finalMetadata).length > 0 ? finalMetadata : null, // Return null only if truly empty
        unreadCount: 0, // Chatbot contacts don't have unread counts via this mechanism yet
        lastMessageAt: null,
      }
    })

    const mappedTenantUsers = tenantUsers.map(user => {
      // Start with existing metadata - preserve what's already there
      // CRITICAL: Merge existing metadata with role instead of overwriting
      let metadata: Record<string, any> = {}

      // Preserve existing metadata if it exists
      if (user.metadata && typeof user.metadata === 'object') {
        metadata = { ...(user.metadata as Record<string, any>) }
      }

      // Ensure role is always set (merge, don't overwrite)
      if (!metadata.role) {
        metadata.role = user.role
      }

      if (DEBUG_LOGGING) console.log('[getTenantContacts] Processing User', {
        userId: user.id,
        displayName: user.name || user.email,
      })

      // Priority 1: Try to enrich with WhatsApp info from userId (most reliable)
      const whatsappByUserId = userIdToWhatsAppMap.get(user.id)
      if (whatsappByUserId) {
        metadata.whatsappSessionId = whatsappByUserId.sessionId
        metadata.whatsappJid = whatsappByUserId.jid
      }

      // Priority 2: If still no WhatsApp info, try by phone number (with normalization and partial matching)
      if ((!metadata.whatsappSessionId || !metadata.whatsappJid) && user.phone) {
        const normalizedUserPhone = normalizePhone(user.phone)

        // Try original phone number first
        let whatsappByPhone = phoneToWhatsAppMap.get(user.phone)

        // Try normalized phone number if original didn't match
        if (!whatsappByPhone && normalizedUserPhone) {
          whatsappByPhone = phoneToWhatsAppMap.get(normalizedUserPhone)
        }

        // Try partial matching: extract last 9-10 digits (handles missing country code)
        if (!whatsappByPhone && user.phone) {
          const phoneDigits = user.phone.replace(/[^0-9]/g, '')
          const last9Digits = phoneDigits.slice(-9)
          const last10Digits = phoneDigits.slice(-10)

          // Try matching with last 9-10 digits directly
          whatsappByPhone = phoneToWhatsAppMap.get(last9Digits) || phoneToWhatsAppMap.get(last10Digits)

          // Also try with normalized phone's last digits (in case normalization added country code)
          if (!whatsappByPhone && normalizedUserPhone) {
            const normalizedDigits = normalizedUserPhone.replace(/\+/g, '').replace(/[^0-9]/g, '')
            const normalizedLast9 = normalizedDigits.slice(-9)
            const normalizedLast10 = normalizedDigits.slice(-10)
            whatsappByPhone = phoneToWhatsAppMap.get(normalizedLast9) || phoneToWhatsAppMap.get(normalizedLast10)
          }


        }

        if (whatsappByPhone) {
          metadata.whatsappSessionId = whatsappByPhone.sessionId
          metadata.whatsappJid = whatsappByPhone.jid
        }
      }

      // Priority 3: JID-based matching fallback
      // Try to find WhatsAppContacts by JID if we have any WhatsAppContacts linked to this user
      if ((!metadata.whatsappSessionId || !metadata.whatsappJid)) {
        // Check if we can find a WhatsAppContact by userId that has a JID
        const userWhatsAppContacts = Array.from(userIdToWhatsAppMap.entries())
          .filter(([uid]) => uid === user.id)
          .map(([, data]) => data)

        for (const wc of userWhatsAppContacts) {
          if (wc.jid && jidToWhatsAppMap.has(wc.jid)) {
            const whatsappByJid = jidToWhatsAppMap.get(wc.jid)!
            metadata.whatsappSessionId = whatsappByJid.sessionId
            metadata.whatsappJid = whatsappByJid.jid
            break
          }
        }
      }

      // Final validation: Ensure whatsappSessionId and whatsappJid are strings (not null/undefined)
      if (metadata.whatsappSessionId && typeof metadata.whatsappSessionId !== 'string') {
        metadata.whatsappSessionId = String(metadata.whatsappSessionId)
      }
      if (metadata.whatsappJid && typeof metadata.whatsappJid !== 'string') {
        metadata.whatsappJid = String(metadata.whatsappJid)
      }

      if (!metadata.whatsappSessionId || !metadata.whatsappJid) {
        if (DEBUG_LOGGING) console.warn('[getTenantContacts] User has no WhatsApp info', {
          userId: user.id,
          displayName: user.name || user.email,
        })
      }

      // Ensure metadata is always an object (not null) to prevent frontend errors
      // Final validation: Remove any null/undefined/invalid values from whatsappSessionId and whatsappJid
      const finalMetadata: Record<string, any> = {}

      // Copy all valid metadata fields
      Object.keys(metadata).forEach(key => {
        const value = metadata[key]
        // Only include non-null, non-undefined values
        if (value !== null && value !== undefined) {
          finalMetadata[key] = value
        }
      })

      // Ensure whatsappSessionId and whatsappJid are strings if present
      if (finalMetadata.whatsappSessionId && typeof finalMetadata.whatsappSessionId !== 'string') {
        finalMetadata.whatsappSessionId = String(finalMetadata.whatsappSessionId)
      }
      if (finalMetadata.whatsappJid && typeof finalMetadata.whatsappJid !== 'string') {
        finalMetadata.whatsappJid = String(finalMetadata.whatsappJid)
      }

      // Remove invalid whatsapp fields (empty strings, null, undefined)
      if (!finalMetadata.whatsappSessionId || typeof finalMetadata.whatsappSessionId !== 'string' || finalMetadata.whatsappSessionId.trim() === '') {
        delete finalMetadata.whatsappSessionId
      }
      if (!finalMetadata.whatsappJid || typeof finalMetadata.whatsappJid !== 'string' || finalMetadata.whatsappJid.trim() === '') {
        delete finalMetadata.whatsappJid
      }

      // TRACK: If this user was enriched with WhatsApp JID, track it to prevent duplicates
      if (finalMetadata.whatsappJid && typeof finalMetadata.whatsappJid === 'string' && finalMetadata.whatsappJid.trim()) {
        actuallyEnrichedJids.add(finalMetadata.whatsappJid.trim())
      }

      // Ensure role is always present for Users
      if (!finalMetadata.role && user.role) {
        finalMetadata.role = user.role
      }

      return {
        id: user.id,
        tenantId: user.tenantId,
        type: 'TENANT_USER', // Custom type for frontend filtering
        displayName: user.name || user.email || 'Unknown User',
        phone: user.phone || null, // Ensure phone is null if empty
        description: user.role || null, // Use role as description
        avatarUrl: user.profilePictureUrl || null,
        isFlowbot: false,
        name: user.name || user.email || 'Unknown User',
        email: user.email || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        metadata: Object.keys(finalMetadata).length > 0 ? finalMetadata : null, // Return null only if truly empty
        unreadCount: unreadCounts.get(user.id) || 0,
        lastMessageAt: lastMessageTimes.get(user.id)?.toISOString() || null,
      }
    })

    // NOW filter and map orphaned WhatsApp contacts - AFTER ChatbotContacts and TenantUsers
    // so that actuallyEnrichedJids is fully populated
    const finalOrphanedContacts = potentiallyOrphanedContacts.filter(c => !actuallyEnrichedJids.has(c.jid))

    if (DEBUG_LOGGING) console.log('[getTenantContacts] Filtered orphaned contacts', {
      potentiallyOrphanedCount: potentiallyOrphanedContacts.length,
      actuallyEnrichedJidsCount: actuallyEnrichedJids.size,
      finalOrphanedCount: finalOrphanedContacts.length,
    })

    // Map orphaned WhatsApp contacts to contact format
    const mappedOrphanedWhatsAppContacts = finalOrphanedContacts.map(waContact => ({
      id: waContact.id,
      tenantId: tenantId,
      type: 'CONTACT', // Use CONTACT type like other ChatbotContacts
      displayName: waContact.name || waContact.phoneNumber || waContact.jid || 'WhatsApp Contact',
      phone: waContact.phoneNumber || null,
      description: waContact.jid || null,
      avatarUrl: null,
      isFlowbot: false,
      createdAt: new Date().toISOString(), // We don't have createdAt from WhatsAppContact
      updatedAt: new Date().toISOString(),
      metadata: {
        whatsappSessionId: waContact.sessionId,
        whatsappJid: waContact.jid,
        lastMessageAt: waContact.lastMessageAt?.toISOString() || null,
        sessionStatus: waContact.sessionStatus?.toLowerCase() || null,
        sessionStartTime: waContact.sessionStartedAt?.toISOString() || null,
        ...((waContact.metadata && typeof waContact.metadata === 'object') ? waContact.metadata as Record<string, any> : {}),
      },
      unreadCount: waContact.unreadCount || 0,
      lastMessageAt: waContact.lastMessageAt?.toISOString() || null,
    }))

    // Merge and sort
    // Priority: FlowBot > Last Message Time > Display Name
    // Include: ChatbotContacts + TenantUsers + Orphaned WhatsApp Contacts
    const allContacts = [...mappedChatbotContacts, ...mappedTenantUsers, ...mappedOrphanedWhatsAppContacts].sort((a, b) => {
      if (a.isFlowbot && !b.isFlowbot) return -1
      if (!a.isFlowbot && b.isFlowbot) return 1

      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0

      if (timeA !== timeB) {
        return timeB - timeA // Recent first
      }

      return (a.displayName || '').localeCompare(b.displayName || '')
    })

    // Final summary log with detailed statistics
    const enrichedCount = allContacts.filter(c =>
      c.metadata &&
      typeof c.metadata === 'object' &&
      (c.metadata as Record<string, any>).whatsappSessionId &&
      (c.metadata as Record<string, any>).whatsappJid
    ).length

    const contactsWithMetadata = allContacts.filter(c => c.metadata && typeof c.metadata === 'object').length
    const contactsWithoutMetadata = allContacts.length - contactsWithMetadata

    const enrichedContacts = allContacts.filter(c => {
      if (!c.metadata || typeof c.metadata !== 'object') return false
      const meta = c.metadata as Record<string, any>
      return !!meta.whatsappSessionId && !!meta.whatsappJid
    })

    // Summary log - concise to avoid rate limiting
    const enrichmentDuration = Date.now() - startTime
    console.log('[getTenantContacts] Complete', {
      tenantId,
      durationMs: enrichmentDuration,
      totalContacts: allContacts.length,
      enrichedWithWhatsApp: enrichedCount,
      enrichmentRate: allContacts.length > 0
        ? `${Math.round(enrichedCount / allContacts.length * 100)}%`
        : 'N/A',
    })

    // Final response validation - ensure metadata structure is correct
    const validatedContacts = allContacts.map(contact => {
      // Ensure metadata is properly structured
      if (contact.metadata && typeof contact.metadata === 'object') {
        const meta = contact.metadata as Record<string, any>
        // Ensure whatsappSessionId and whatsappJid are strings if present
        if (meta.whatsappSessionId && typeof meta.whatsappSessionId !== 'string') {
          meta.whatsappSessionId = String(meta.whatsappSessionId)
        }
        if (meta.whatsappJid && typeof meta.whatsappJid !== 'string') {
          meta.whatsappJid = String(meta.whatsappJid)
        }
        // Remove invalid values
        if (!meta.whatsappSessionId || meta.whatsappSessionId.trim() === '') {
          delete meta.whatsappSessionId
        }
        if (!meta.whatsappJid || meta.whatsappJid.trim() === '') {
          delete meta.whatsappJid
        }
      }
      return contact
    })



    return {
      success: true,
      contacts: validatedContacts,
    }
  }

  async debugTenantContacts(tenantId: string): Promise<any> {
    // Diagnostic method to check what WhatsAppContacts exist and why enrichment might not be working
    console.log('[debugTenantContacts] Starting diagnostic for tenant', { tenantId })

    const chatbotContacts = await this.prismaClient.chatbotContact.findMany({
      where: { tenantId },
      include: {
        whatsapp_contacts: {
          select: {
            sessionId: true,
            jid: true,
            phoneNumber: true,
          },
          take: 5,
        },
      },
    })

    const tenantUsers = await this.prismaClient.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        metadata: true,
      },
    })

    // Get all WhatsAppContacts for this tenant (via sessions)
    const sessions = await this.prismaClient.whatsAppSession.findMany({
      where: { tenantId },
      select: { sessionId: true },
    })

    const sessionIds = sessions.map(s => s.sessionId)

    const allWhatsAppContacts = await this.prismaClient.whatsAppContact.findMany({
      where: {
        sessionId: {
          in: sessionIds,
        },
      },
      select: {
        id: true,
        sessionId: true,
        jid: true,
        phoneNumber: true,
        userId: true,
        chatbotContactId: true,
        name: true,
      },
    })

    // Check phone number normalization
    const normalizePhone = (phone: string | null | undefined): string | null => {
      if (!phone || typeof phone !== 'string' || !phone.trim()) {
        return null
      }
      try {
        const normalized = normalizePhoneNumber(phone.trim())
        return normalized?.normalized || null
      } catch (error) {
        return null
      }
    }

    const contactPhones = chatbotContacts
      .map(c => ({ original: c.phone, normalized: normalizePhone(c.phone) }))
      .filter(p => p.original)

    const userPhones = tenantUsers
      .map(u => ({ original: u.phone, normalized: normalizePhone(u.phone) }))
      .filter(p => p.original)

    const whatsappPhones = allWhatsAppContacts
      .map(wc => ({ original: wc.phoneNumber, normalized: normalizePhone(wc.phoneNumber) }))
      .filter(p => p.original)

    // Extract phone from JID for WhatsAppContacts without phoneNumber
    const whatsappPhonesFromJid = allWhatsAppContacts
      .filter(wc => !wc.phoneNumber && wc.jid.includes('@'))
      .map(wc => {
        const jidPhone = wc.jid.split('@')[0]
        return {
          jid: wc.jid,
          extractedPhone: /^\d+$/.test(jidPhone) ? jidPhone : null,
          normalized: /^\d+$/.test(jidPhone) ? normalizePhone(jidPhone) : null,
        }
      })

    // Try to match phones
    const matchingAttempts = []
    for (const contactPhone of contactPhones) {
      if (contactPhone.normalized) {
        const match = whatsappPhones.find(wp => wp.normalized === contactPhone.normalized)
        if (match) {
          matchingAttempts.push({
            type: 'chatbotContact',
            contactPhone: contactPhone.original,
            normalized: contactPhone.normalized,
            matched: true,
            whatsappPhone: match.original,
            whatsappNormalized: match.normalized,
          })
        } else {
          // Try partial matching
          const contactDigits = contactPhone.normalized.replace(/\+/g, '').replace(/^\d{1,3}/, '').slice(-9)
          const partialMatch = whatsappPhones.find(wp => {
            if (!wp.normalized) return false
            const wpDigits = wp.normalized.replace(/\+/g, '').replace(/^\d{1,3}/, '').slice(-9)
            return wpDigits === contactDigits
          })
          matchingAttempts.push({
            type: 'chatbotContact',
            contactPhone: contactPhone.original,
            normalized: contactPhone.normalized,
            matched: !!partialMatch,
            partialMatch: !!partialMatch,
            contactLast9: contactDigits,
            whatsappMatch: partialMatch ? {
              phone: partialMatch.original,
              normalized: partialMatch.normalized,
              last9: partialMatch.normalized?.replace(/\+/g, '').replace(/^\d{1,3}/, '').slice(-9),
            } : null,
          })
        }
      }
    }

    for (const userPhone of userPhones) {
      if (userPhone.normalized) {
        const match = whatsappPhones.find(wp => wp.normalized === userPhone.normalized)
        if (match) {
          matchingAttempts.push({
            type: 'user',
            userPhone: userPhone.original,
            normalized: userPhone.normalized,
            matched: true,
            whatsappPhone: match.original,
            whatsappNormalized: match.normalized,
          })
        } else {
          // Try partial matching
          const userDigits = userPhone.normalized.replace(/\+/g, '').replace(/^\d{1,3}/, '').slice(-9)
          const partialMatch = whatsappPhones.find(wp => {
            if (!wp.normalized) return false
            const wpDigits = wp.normalized.replace(/\+/g, '').replace(/^\d{1,3}/, '').slice(-9)
            return wpDigits === userDigits
          })
          matchingAttempts.push({
            type: 'user',
            userPhone: userPhone.original,
            normalized: userPhone.normalized,
            matched: !!partialMatch,
            partialMatch: !!partialMatch,
            userLast9: userDigits,
            whatsappMatch: partialMatch ? {
              phone: partialMatch.original,
              normalized: partialMatch.normalized,
              last9: partialMatch.normalized?.replace(/\+/g, '').replace(/^\d{1,3}/, '').slice(-9),
            } : null,
          })
        }
      }
    }

    return {
      tenantId,
      summary: {
        chatbotContactsCount: chatbotContacts.length,
        tenantUsersCount: tenantUsers.length,
        whatsappContactsCount: allWhatsAppContacts.length,
        whatsappSessionsCount: sessions.length,
        contactPhonesCount: contactPhones.length,
        userPhonesCount: userPhones.length,
        whatsappPhonesCount: whatsappPhones.length,
        whatsappPhonesFromJidCount: whatsappPhonesFromJid.length,
        matchingAttemptsCount: matchingAttempts.length,
        successfulMatches: matchingAttempts.filter(m => m.matched).length,
        failedMatches: matchingAttempts.filter(m => !m.matched).length,
      },
      chatbotContacts: {
        count: chatbotContacts.length,
        contacts: chatbotContacts.map(c => ({
          id: c.id,
          displayName: c.displayName,
          phone: c.phone,
          normalizedPhone: normalizePhone(c.phone),
          hasMetadata: !!c.metadata,
          metadataKeys: c.metadata && typeof c.metadata === 'object' ? Object.keys(c.metadata as Record<string, any>) : [],
          linkedWhatsappContacts: c.whatsapp_contacts.map(wc => ({
            sessionId: wc.sessionId,
            jid: wc.jid,
            phoneNumber: wc.phoneNumber,
          })),
        })),
      },
      tenantUsers: {
        count: tenantUsers.length,
        users: tenantUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          normalizedPhone: normalizePhone(u.phone),
          hasMetadata: !!u.metadata,
          metadataKeys: u.metadata && typeof u.metadata === 'object' ? Object.keys(u.metadata as Record<string, any>) : [],
          existingWhatsappSessionId: u.metadata && typeof u.metadata === 'object'
            ? (u.metadata as Record<string, any>).whatsappSessionId
            : undefined,
          existingWhatsappJid: u.metadata && typeof u.metadata === 'object'
            ? (u.metadata as Record<string, any>).whatsappJid
            : undefined,
        })),
      },
      whatsappContacts: {
        count: allWhatsAppContacts.length,
        contacts: allWhatsAppContacts.map(wc => ({
          id: wc.id,
          sessionId: wc.sessionId,
          jid: wc.jid,
          phoneNumber: wc.phoneNumber,
          phoneFromJid: wc.jid.includes('@') ? wc.jid.split('@')[0] : null,
          normalizedPhone: normalizePhone(wc.phoneNumber),
          normalizedPhoneFromJid: wc.jid.includes('@') && /^\d+$/.test(wc.jid.split('@')[0])
            ? normalizePhone(wc.jid.split('@')[0])
            : null,
          userId: wc.userId,
          chatbotContactId: wc.chatbotContactId,
          name: wc.name,
        })),
      },
      phoneNormalization: {
        contactPhones,
        userPhones,
        whatsappPhones,
        whatsappPhonesFromJid,
      },
      matchingAttempts,
      userIdMatching: {
        userIds: tenantUsers.map(u => u.id),
        linkedWhatsAppContacts: allWhatsAppContacts.filter(wc =>
          wc.userId && tenantUsers.some(u => u.id === wc.userId)
        ),
      },
      chatbotContactIdMatching: {
        chatbotContactIds: chatbotContacts.map(c => c.id),
        linkedWhatsAppContacts: allWhatsAppContacts.filter(wc =>
          wc.chatbotContactId && chatbotContacts.some(c => c.id === wc.chatbotContactId)
        ),
      },
    }
  }

  /**
   * Update a ChatbotContact record
   */
  async updateTenantContact(
    tenantId: string,
    contactId: string,
    data: { displayName?: string; phone?: string | null; email?: string | null; description?: string | null },
  ): Promise<{ success: boolean; contact: any }> {
    console.log('[updateTenantContact] Updating contact', { tenantId, contactId, data })

    // Validate tenant exists
    const tenant = await this.prismaClient.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    })

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`)
    }

    // Validate contact exists and belongs to this tenant
    let existingContact = await this.prismaClient.chatbotContact.findFirst({
      where: {
        id: contactId,
        tenantId,
      },
    })

    // FALLBACK: If not found as ChatbotContact, check if it's an orphaned WhatsAppContact
    // If so, create a linked ChatbotContact and update that
    if (!existingContact) {
      console.log('[updateTenantContact] ChatbotContact not found, checking WhatsAppContact', { contactId, tenantId })

      const whatsappContact = await this.prismaClient.whatsAppContact.findFirst({
        where: {
          id: contactId,
          tenantId,
        },
      })

      if (whatsappContact) {
        console.log('[updateTenantContact] Found orphaned WhatsAppContact, creating linked ChatbotContact', {
          whatsappContactId: whatsappContact.id,
          jid: whatsappContact.jid,
          phoneNumber: whatsappContact.phoneNumber,
        })

        // Create a ChatbotContact linked to this WhatsAppContact
        const newChatbotContact = await this.prismaClient.chatbotContact.create({
          data: {
            id: whatsappContact.id, // Use same ID for simplicity
            tenantId,
            displayName: data.displayName || whatsappContact.name || whatsappContact.phoneNumber || whatsappContact.jid || 'WhatsApp Contact',
            phone: whatsappContact.phoneNumber || null,
            type: 'CONTACT',
            updatedAt: new Date(),
          },
        })

        // Link the WhatsAppContact to this new ChatbotContact
        await this.prismaClient.whatsAppContact.update({
          where: { id: whatsappContact.id },
          data: {
            chatbotContactId: newChatbotContact.id,
          },
        })

        existingContact = newChatbotContact
        console.log('[updateTenantContact] Created and linked ChatbotContact', { chatbotContactId: newChatbotContact.id })
      }
    }

    if (!existingContact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found for tenant ${tenantId}`)
    }

    // Build update data
    const updateData: any = {}

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName.trim()
    }

    if (data.phone !== undefined) {
      // Normalize phone number if provided
      const normalizedPhone = data.phone ? normalizePhoneNumber(data.phone) : null
      updateData.phone = normalizedPhone ? normalizedPhone.normalized : null
    }

    if (data.email !== undefined) {
      updateData.email = data.email?.trim() || null
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      return {
        success: true,
        contact: this.transformContactToFrontendFormat(existingContact),
      }
    }

    // Update the contact
    const updatedContact = await this.prismaClient.chatbotContact.update({
      where: { id: existingContact.id },
      data: updateData,
    })

    console.log('[updateTenantContact] Contact updated successfully', {
      contactId: existingContact.id,
      updatedFields: Object.keys(updateData),
    })

    return {
      success: true,
      contact: this.transformContactToFrontendFormat(updatedContact),
    }
  }

  /**
   * Transform a ChatbotContact record to the frontend format
   */
  private transformContactToFrontendFormat(contact: any): any {
    return {
      id: contact.id,
      tenantId: contact.tenantId,
      type: contact.type,
      displayName: contact.displayName,
      phone: contact.phone,
      email: contact.email,
      avatarUrl: contact.avatarUrl,
      description: contact.description,
      isFlowbot: false,
      createdAt: contact.createdAt?.toISOString?.() ?? contact.createdAt,
      updatedAt: contact.updatedAt?.toISOString?.() ?? contact.updatedAt,
      metadata: contact.metadata,
    }
  }

}
