import { Body, Controller, Get, Patch, Post, Put, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import { PrismaService } from '../prisma/prisma.service'
import {
  AdminSystemSettingsService,
  RootDomainSettings,
  BrevoSettings,
  OpenRouterSettings,
  LabsMobileSettings,
  RealtimeSettings,
  VapidSettings,
  LyraSettings,
} from './system-settings.service'

@Controller('admin/system')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSystemSettingsController {
  constructor(
    private readonly systemSettingsService: AdminSystemSettingsService,
    private readonly prisma: PrismaService
  ) {}

  // Root Domain
  @Get('root-domain')
  async getRootDomain(): Promise<RootDomainSettings> {
    return this.systemSettingsService.getRootDomain()
  }

  @Put('root-domain')
  async updateRootDomain(@Body() body: { rootDomain: string }): Promise<RootDomainSettings> {
    return this.systemSettingsService.updateRootDomain(body.rootDomain)
  }

  // Brevo
  @Get('brevo')
  async getBrevoSettings(): Promise<{ exists: boolean; config: BrevoSettings | null }> {
    const config = await this.systemSettingsService.getBrevoSettings()
    return { exists: config !== null, config }
  }

  @Put('brevo')
  async updateBrevoSettings(@Body() body: BrevoSettings): Promise<{ config: BrevoSettings }> {
    const config = await this.systemSettingsService.updateBrevoSettings(body)
    return { config }
  }

  // OpenRouter
  @Get('openrouter')
  async getOpenRouterSettings(): Promise<{ exists: boolean; config: OpenRouterSettings | null }> {
    const config = await this.systemSettingsService.getOpenRouterSettings()
    return { exists: config !== null, config }
  }

  @Put('openrouter')
  async updateOpenRouterSettings(@Body() body: OpenRouterSettings): Promise<{ config: OpenRouterSettings }> {
    const config = await this.systemSettingsService.updateOpenRouterSettings(body)
    return { config }
  }

  // LabsMobile
  @Get('labsmobile')
  async getLabsMobileSettings(): Promise<{ exists: boolean; config: LabsMobileSettings | null }> {
    const config = await this.systemSettingsService.getLabsMobileSettings()
    return { exists: config !== null, config }
  }

  @Put('labsmobile')
  async updateLabsMobileSettings(@Body() body: LabsMobileSettings): Promise<{ config: LabsMobileSettings }> {
    const config = await this.systemSettingsService.updateLabsMobileSettings(body)
    return { config }
  }

  // Realtime (Soketi)
  @Get('realtime')
  async getRealtimeSettings(): Promise<{ exists: boolean; config: RealtimeSettings | null }> {
    const config = await this.systemSettingsService.getRealtimeSettings()
    return { exists: config !== null, config }
  }

  @Put('realtime')
  async updateRealtimeSettings(@Body() body: RealtimeSettings): Promise<{ config: RealtimeSettings }> {
    const config = await this.systemSettingsService.updateRealtimeSettings(body)
    return { config }
  }

  // VAPID
  @Get('vapid')
  async getVapidSettings(): Promise<{ 
    success: boolean
    hasKeys: boolean
    publicKey?: string
    privateKey?: string
    subject?: string
    createdAt?: string
    updatedAt?: string
  }> {
    const config = await this.systemSettingsService.getVapidSettings()
    
    if (!config) {
      return { success: true, hasKeys: false }
    }
    
    // Get the config record to get timestamps
    const configRecord = await this.prisma.systemConfig.findUnique({
      where: { key: 'vapid_config' },
    })
    
    return {
      success: true,
      hasKeys: true,
      publicKey: config.publicKey,
      privateKey: config.privateKey, // Include private key in response for admin
      subject: config.subject,
      createdAt: configRecord?.createdAt?.toISOString(),
      updatedAt: configRecord?.updatedAt?.toISOString(),
    }
  }

  @Post('vapid')
  async generateVapidKeys(@Body() body: { email?: string }): Promise<{ success: boolean; message: string; config: VapidSettings }> {
    const config = await this.systemSettingsService.generateVapidKeys(body.email)
    return { 
      success: true, 
      message: 'VAPID keys generated successfully',
      config 
    }
  }

  @Patch('vapid')
  async testVapidKeys(): Promise<{ success: boolean; message: string }> {
    const result = await this.systemSettingsService.testVapidKeys()
    return {
      success: result.valid,
      message: result.message,
    }
  }

  @Put('vapid')
  async updateVapidSettings(@Body() body: VapidSettings): Promise<{ success: boolean; message: string; config: VapidSettings }> {
    const config = await this.systemSettingsService.updateVapidSettings(body)
    return { 
      success: true,
      message: 'VAPID keys updated successfully',
      config 
    }
  }

  // Lyra
  @Get('lyra')
  async getLyraSettings(): Promise<{ exists: boolean; config: LyraSettings | null }> {
    const config = await this.systemSettingsService.getLyraSettings()
    
    // Debug logging
    if (config) {
      console.log('[getLyraSettings Controller] Returning config with:')
      console.log('  - testMode:', config.testMode ? { enabled: config.testMode.enabled, hasCredentials: !!config.testMode.credentials } : 'missing')
      console.log('  - productionMode:', config.productionMode ? { enabled: config.productionMode.enabled, hasCredentials: !!config.productionMode.credentials } : 'missing')
      if (config.productionMode?.credentials) {
        console.log('  - productionMode credentials keys:', Object.keys(config.productionMode.credentials))
      }
    }
    
    return { exists: config !== null, config }
  }

  @Put('lyra')
  async updateLyraSettings(@Body() body: LyraSettings): Promise<{ success: boolean; config: LyraSettings }> {
    const config = await this.systemSettingsService.updateLyraSettings(body)
    return { success: true, config }
  }
}

