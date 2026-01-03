import { Controller, Get, Param, NotFoundException, Res, StreamableFile } from '@nestjs/common'
import { Public } from '../common/guards/auth.guard'
import { AdminTenantsService } from './tenants.service'
import { Response } from 'express'

@Controller('public/tenant-assets')
export class PublicTenantAssetsController {
    constructor(private readonly tenantsService: AdminTenantsService) { }

    @Get('logo/:id')
    @Public()
    async getTenantLogo(
        @Param('id') tenantId: string,
        @Res() res: Response,
    ) {
        try {
            const tenant = await this.tenantsService.getTenantById(tenantId)

            if (!tenant) {
                throw new NotFoundException('Tenant not found')
            }

            // Try to get logo from settings (Data URL)
            let logoUrl = null
            if (tenant.settings) {
                try {
                    const settings = typeof tenant.settings === 'string'
                        ? JSON.parse(tenant.settings)
                        : tenant.settings
                    if (settings?.branding?.logoUrl) {
                        logoUrl = settings.branding.logoUrl
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }

            // Fallback to top-level logoUrl if it's a Data URL
            if (!logoUrl && tenant.logoUrl && tenant.logoUrl.startsWith('data:')) {
                logoUrl = tenant.logoUrl
            }

            if (!logoUrl || !logoUrl.startsWith('data:')) {
                throw new NotFoundException('Logo not found or invalid format')
            }

            // Parse Data URL
            // Format: data:[<mediatype>][;base64],<data>
            const matches = logoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)

            if (!matches || matches.length !== 3) {
                throw new NotFoundException('Invalid logo data format')
            }

            const contentType = matches[1]
            const base64Data = matches[2]
            const buffer = Buffer.from(base64Data, 'base64')

            res.set({
                'Content-Type': contentType,
                'Content-Length': buffer.length,
                'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
            })

            res.send(buffer)
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error
            }
            console.error('[PublicTenantAssetsController] Error serving logo:', error)
            throw new NotFoundException('Logo not found')
        }
    }
}
