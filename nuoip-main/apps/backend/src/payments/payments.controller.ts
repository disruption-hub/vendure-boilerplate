import {
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { Response } from 'express'
import { PrismaService } from '../prisma/prisma.service'
import { AdminSystemSettingsService, type LyraSettings } from '../admin/system-settings.service'
import {
  computeLyraFormTokenFingerprint,
  isReusableLyraFormToken,
  withUpdatedLyraFormTokenContext,
} from './lyra-form-token-context'

function generateToken(length = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemSettings: AdminSystemSettingsService,
  ) { }

  @Get('products/active')
  async getActiveProducts() {
    const products = await this.prisma.paymentProduct.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        productCode: true,
        metadata: true,
        amountCents: true,
        currency: true,
      },
    })

    return products
  }

  @Get('links/find')
  async findPaymentLink(
    @Query('productId') productId: string,
    @Query('sessionId') sessionId: string,
    @Query('amountCents') amountCents: string,
    @Query('currency') currency: string,
    @Query('customerEmail') customerEmail?: string,
  ) {
    if (!productId || !sessionId || !amountCents || !currency) {
      throw new HttpException('Missing required parameters', HttpStatus.BAD_REQUEST)
    }

    const existingLink = await this.prisma.paymentLink.findFirst({
      where: {
        productId,
        sessionId,
        amountCents: parseInt(amountCents, 10),
        currency: currency.toUpperCase(),
        status: { in: ['pending', 'processing'] },
        ...(customerEmail ? { customerEmail } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, token: true },
    })

    // Return null instead of 404 - "not found" is a valid result, not an error
    if (!existingLink) {
      return null
    }

    return existingLink
  }

  @Post('links/create')
  async createPaymentLink(@Body() payload: {
    productId: string;
    sessionId?: string;
    tenantId?: string | null;
    customerName?: string | null;
    customerEmail?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const { productId, ...options } = payload

    const product = await this.prisma.paymentProduct.findUnique({
      where: { id: productId },
      include: {
        paymentTax: true, // Include tax to get the rate
      },
    })

    if (!product) {
      throw new HttpException(`Product not found: ${productId}`, HttpStatus.NOT_FOUND)
    }

    const token = generateToken()

    // Get tax rate from product's associated tax rule
    const taxRateBps = product.paymentTax?.rateBps ?? null

    const paymentLink = await this.prisma.paymentLink.create({
      data: {
        token,
        productId,
        sessionId: options.sessionId,
        tenantId: options.tenantId,
        amountCents: product.amountCents,
        baseAmountCents: product.baseAmountCents,
        taxAmountCents: product.taxAmountCents,
        taxRateBps: taxRateBps,
        currency: product.currency,
        customerName: options.customerName,
        customerEmail: options.customerEmail,
        metadata: (options.metadata || {}) as any,
        status: 'pending',
        channel: 'chatbot',
      },
      select: {
        id: true,
        token: true,
      },
    })

    return paymentLink
  }

  @Get('link/:token')
  async getPaymentLinkByToken(@Param('token') token: string) {
    const link = await this.prisma.paymentLink.findUnique({
      where: { token },
      include: {
        paymentProduct: {
          select: {
            id: true,
            productCode: true,
            name: true,
            description: true,
            paymentProductImages: {
              select: {
                url: true,
                isDefault: true,
                displayOrder: true,
              },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!link) {
      return { error: 'Payment link not found' }
    }

    // Fetch tenant info separately using tenantId
    let tenant = null
    if (link.tenantId) {
      const tenantData = await this.prisma.tenant.findUnique({
        where: { id: link.tenantId },
        select: {
          id: true,
          name: true,
          displayName: true,
          logoUrl: true,
          logoWidth: true,
          logoHeight: true,
          settings: true, // Needed for logo fallback
        },
      })
      if (tenantData) {
        // Extract logo from settings if not present in top-level field (fallback for existing tenants)
        let logoUrl = tenantData.logoUrl
        if (!logoUrl && tenantData.settings) {
          try {
            const settings = typeof tenantData.settings === 'string'
              ? JSON.parse(tenantData.settings)
              : tenantData.settings as any
            if (settings?.branding?.logoUrl) {
              logoUrl = settings.branding.logoUrl
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }

        tenant = {
          name: tenantData.name,
          displayName: tenantData.displayName,
          logoUrl: logoUrl,
          logoWidth: tenantData.logoWidth,
          logoHeight: tenantData.logoHeight,
        }
      }
    }

    // Handle optional product (custom link)
    // Map paymentProductImages to images for consistency
    const rawProduct = link.paymentProduct
    const productImages = rawProduct?.paymentProductImages || []

    const product = rawProduct ? {
      name: rawProduct.name,
      productCode: rawProduct.productCode,
      description: rawProduct.description,
      images: productImages,
    } : {
      name: link.productName || 'Custom Product',
      productCode: 'CUSTOM',
      description: null,
      images: [],
    }

    // Get default image (first one or one marked as default)
    const defaultImage = product.images.find((img: any) => img.isDefault)
      || product.images[0]

    return {
      id: link.id,
      token: link.token,
      product: {
        name: product.name,
        productCode: product.productCode,
        description: product.description || null,
        imageUrl: defaultImage?.url || null,
        images: product.images,
      },
      amountCents: link.amountCents,
      baseAmountCents: link.baseAmountCents,
      taxAmountCents: link.taxAmountCents,
      taxRateBps: link.taxRateBps,
      currency: link.currency,
      status: link.status,
      customerName: link.customerName,
      customerEmail: link.customerEmail,
      customerPhone: link.customerPhone,
      customerCountryCode: link.customerCountryCode,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      tenant,
    }
  }

  /**
   * Get tenant info by orderId (extracted from Lyra response)
   * OrderId format: order_{linkId}_{timestamp}
   */
  @Get('order/:orderId/tenant')
  async getTenantByOrderId(@Param('orderId') orderId: string) {
    try {
      // Extract link ID from orderId format: order_{linkId}_{timestamp}
      const match = orderId.match(/^order_(.+?)_\d+$/)
      if (!match) {
        throw new HttpException('Invalid orderId format', HttpStatus.BAD_REQUEST)
      }

      const linkId = match[1]
      const link = await this.prisma.paymentLink.findUnique({
        where: { id: linkId },
        select: { tenantId: true },
      })

      if (!link || !link.tenantId) {
        throw new HttpException('Payment link or tenant not found', HttpStatus.NOT_FOUND)
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: link.tenantId },
        select: {
          id: true,
          name: true,
          displayName: true,
          logoUrl: true,
          logoWidth: true,
          logoHeight: true,
          domain: true,
          websiteUrl: true,
          settings: true, // Get settings to extract paymentReturnHomeUrl (Railway-safe)
          // paymentReturnHomeUrl: true, // Removed - Prisma client cache issue on Railway
        },
      })

      if (!tenant) {
        throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND)
      }

      // Extract paymentReturnHomeUrl from settings (Railway-safe fallback)
      const tenantSettings = tenant.settings as any
      const paymentReturnHomeUrl = tenantSettings?.paymentReturnHomeUrl || null

      // Extract logo from settings if not present in top-level field (fallback for existing tenants)
      let logoUrl = tenant.logoUrl
      if (!logoUrl && tenantSettings?.branding?.logoUrl) {
        logoUrl = tenantSettings.branding.logoUrl
      }

      return {
        id: tenant.id,
        name: tenant.name,
        displayName: tenant.displayName,
        logoUrl: logoUrl,
        logoWidth: tenant.logoWidth,
        logoHeight: tenant.logoHeight,
        domain: tenant.domain,
        websiteUrl: tenant.websiteUrl,
        paymentReturnHomeUrl,
      }
    } catch (error) {
      console.error('[getTenantByOrderId] Error:', error)
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException('Failed to fetch tenant info', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Handle GET redirect from Lyra after successful payment
   * Returns HTML that redirects to the success page
   */
  @Get('lyra/redirect/success')
  @Header('Content-Type', 'text/html')
  async handleSuccessRedirectGet(@Query() query: any, @Res() res: Response) {
    return this.handleSuccessRedirect(null, query, res)
  }

  /**
   * Handle POST redirect from Lyra after successful payment
   * Returns HTML that redirects to the success page
   */
  @Post('lyra/redirect/success')
  @Header('Content-Type', 'text/html')
  async handleSuccessRedirectPost(@Body() body: any, @Res() res: Response) {
    return this.handleSuccessRedirect(body, null, res)
  }

  /**
   * Internal method to handle redirect logic (shared by GET and POST)
   */
  private async handleSuccessRedirect(@Body() body: any, @Query() query: any, @Res() res: Response) {
    try {
      // Parse body or query params - could be form-encoded, JSON, or query string
      let searchParams = new URLSearchParams()

      // First, check query params (for GET requests)
      if (query && typeof query === 'object') {
        for (const [key, value] of Object.entries(query)) {
          if (typeof value === 'string') {
            searchParams.append(key, value)
          } else if (value !== null && value !== undefined) {
            searchParams.append(key, String(value))
          }
        }
      }

      // Then, check body (for POST requests)
      if (body && typeof body === 'object') {
        // Handle kr-answer specially - it might be nested or at root level
        let krAnswer = body['kr-answer'] || body.kr_answer

        // If kr-answer exists, encode it as base64 JSON (Lyra format)
        if (krAnswer) {
          try {
            const jsonString = typeof krAnswer === 'string' ? krAnswer : JSON.stringify(krAnswer)
            // If it's already base64 (doesn't start with { or [), use it; otherwise encode it
            const base64 = (jsonString.startsWith('{') || jsonString.startsWith('['))
              ? Buffer.from(jsonString).toString('base64')
              : jsonString
            searchParams.append('kr-answer', base64)
          } catch (e) {
            console.warn('[handleSuccessRedirect] Failed to encode kr-answer:', e)
            searchParams.append('kr-answer', typeof krAnswer === 'string' ? krAnswer : JSON.stringify(krAnswer))
          }
        }

        // Add other fields (skip kr-answer as it's already handled)
        for (const [key, value] of Object.entries(body)) {
          if (key === 'kr-answer' || key === 'kr_answer') {
            continue // Already handled above
          }
          if (typeof value === 'string') {
            searchParams.append(key, value)
          } else if (value !== null && value !== undefined) {
            searchParams.append(key, JSON.stringify(value))
          }
        }
      }

      // Build redirect URL
      const redirectUrl = `/payments/lyra/browser-success?${searchParams.toString()}`

      // Return HTML that does client-side redirect
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <script>window.location.href="${redirectUrl}";</script>
</head>
<body>
  <p>Redirecting to payment success page... <a href="${redirectUrl}">Click here if not redirected</a></p>
</body>
</html>`

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
      return res.send(html)
    } catch (error) {
      console.error('[handleSuccessRedirect] Error:', error)
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/payments/lyra/browser-success">
  <script>window.location.href="/payments/lyra/browser-success";</script>
</head>
<body>
  <p>Redirecting... <a href="/payments/lyra/browser-success">Click here</a></p>
</body>
</html>`
      return res.send(html)
    }
  }

  /**
   * Handle GET redirect from Lyra after failed payment
   * Returns HTML that redirects to the failure page
   */
  @Get('lyra/redirect/failure')
  @Header('Content-Type', 'text/html')
  async handleFailureRedirectGet(@Query() query: any, @Res() res: Response) {
    return this.handleFailureRedirect(null, query, res)
  }

  /**
   * Handle POST redirect from Lyra after failed payment
   * Returns HTML that redirects to the failure page
   */
  @Post('lyra/redirect/failure')
  @Header('Content-Type', 'text/html')
  async handleFailureRedirectPost(@Body() body: any, @Res() res: Response) {
    return this.handleFailureRedirect(body, null, res)
  }

  /**
   * Internal method to handle redirect logic (shared by GET and POST)
   */
  private async handleFailureRedirect(@Body() body: any, @Query() query: any, @Res() res: Response) {
    try {
      // Parse body or query params - could be form-encoded, JSON, or query string
      let searchParams = new URLSearchParams()

      // First, check query params (for GET requests)
      if (query && typeof query === 'object') {
        for (const [key, value] of Object.entries(query)) {
          if (typeof value === 'string') {
            searchParams.append(key, value)
          } else if (value !== null && value !== undefined) {
            searchParams.append(key, String(value))
          }
        }
      }

      // Then, check body (for POST requests)
      if (body && typeof body === 'object') {
        // Handle kr-answer specially - it might be nested or at root level
        let krAnswer = body['kr-answer'] || body.kr_answer

        // If kr-answer exists, encode it as base64 JSON (Lyra format)
        if (krAnswer) {
          try {
            const jsonString = typeof krAnswer === 'string' ? krAnswer : JSON.stringify(krAnswer)
            // If it's already base64 (doesn't start with { or [), use it; otherwise encode it
            const base64 = (jsonString.startsWith('{') || jsonString.startsWith('['))
              ? Buffer.from(jsonString).toString('base64')
              : jsonString
            searchParams.append('kr-answer', base64)
          } catch (e) {
            console.warn('[handleFailureRedirect] Failed to encode kr-answer:', e)
            searchParams.append('kr-answer', typeof krAnswer === 'string' ? krAnswer : JSON.stringify(krAnswer))
          }
        }

        // Add other fields (skip kr-answer as it's already handled)
        for (const [key, value] of Object.entries(body)) {
          if (key === 'kr-answer' || key === 'kr_answer') {
            continue // Already handled above
          }
          if (typeof value === 'string') {
            searchParams.append(key, value)
          } else if (value !== null && value !== undefined) {
            searchParams.append(key, JSON.stringify(value))
          }
        }
      }

      // Build redirect URL
      const redirectUrl = `/payments/lyra/browser-failure?${searchParams.toString()}`

      // Return HTML that does client-side redirect
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <script>window.location.href="${redirectUrl}";</script>
</head>
<body>
  <p>Redirecting to payment failure page... <a href="${redirectUrl}">Click here if not redirected</a></p>
</body>
</html>`

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
      return res.send(html)
    } catch (error) {
      console.error('[handleFailureRedirect] Error:', error)
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/payments/lyra/browser-failure">
  <script>window.location.href="/payments/lyra/browser-failure";</script>
</head>
<body>
  <p>Redirecting... <a href="/payments/lyra/browser-failure">Click here</a></p>
</body>
</html>`
      return res.send(html)
    }
  }

  /**
   * Resolve backend base URL dynamically.
   * Priority: 1. BACKEND_URL env var, 2. RAILWAY_PUBLIC_DOMAIN, 3. RAILWAY_STATIC_URL, 4. fallback
   */
  private resolveBackendBaseUrl(): string {
    // Priority 1: Explicit BACKEND_URL
    if (process.env.BACKEND_URL) {
      return process.env.BACKEND_URL.replace(/\/+$/, '')
    }

    // Priority 2: NEXT_PUBLIC_BACKEND_URL (shared between frontend and backend)
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, '')
    }

    // Priority 3: Railway public domain
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    }

    // Priority 4: Railway static URL
    if (process.env.RAILWAY_STATIC_URL) {
      return process.env.RAILWAY_STATIC_URL.replace(/\/+$/, '')
    }

    // Priority 5: Vercel URL (if backend is on Vercel, though unlikely)
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }

    // Fallback: Default Railway production URL
    return 'https://nuoip-production.up.railway.app'
  }

  /**
   * Resolve tenant base URL for payment redirects.
   * Priority: 1. tenant.domain, 2. tenant.subdomain + rootDomain, 3. env ROOT_DOMAIN
   */
  private async resolveTenantBaseUrl(tenantId: string | null): Promise<string> {
    const rootDomain = process.env.ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'flowcast.chat'

    if (tenantId) {
      try {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { domain: true, subdomain: true },
        })

        if (tenant) {
          if (tenant.domain) {
            return `https://${tenant.domain}`
          }
          if (tenant.subdomain) {
            return `https://${tenant.subdomain}.${rootDomain}`
          }
        }
      } catch (error) {
        console.warn('[resolveTenantBaseUrl] Error fetching tenant:', error)
      }
    }

    return `https://${rootDomain}`
  }

  /**
   * Get Lyra settings for a tenant. NO global fallback - each tenant must have their own config.
   * Payment links are tenant-exclusive configurations and require tenant-specific Lyra settings.
   * Throws error if tenantId is missing or tenant doesn't have Lyra configuration.
   */
  private async getTenantLyraSettings(tenantId: string | null): Promise<LyraSettings> {
    if (!tenantId) {
      throw new HttpException(
        'Payment link must be associated with a tenant. tenantId is required for payment processing.',
        HttpStatus.BAD_REQUEST,
      )
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, settings: true },
    })

    if (!tenant) {
      throw new HttpException(
        `Tenant not found: ${tenantId}`,
        HttpStatus.NOT_FOUND,
      )
    }

    if (!tenant.settings || typeof tenant.settings !== 'object') {
      console.error('[getTenantLyraSettings] Tenant has no settings object:', {
        tenantId,
        tenantName: tenant.name,
        settingsType: typeof tenant.settings,
        settingsValue: tenant.settings,
      })
      throw new HttpException(
        `Tenant "${tenant.name}" has no settings configured. Each tenant must have its own Lyra payment configuration in settings.lyraConfig. Please configure Lyra settings for this tenant.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const settings = tenant.settings as any
    console.log('[getTenantLyraSettings] Tenant settings structure:', {
      tenantId,
      tenantName: tenant.name,
      settingsKeys: Object.keys(settings || {}),
      hasLyraConfig: !!settings?.lyraConfig,
      lyraConfigType: typeof settings?.lyraConfig,
      lyraConfigKeys: settings?.lyraConfig && typeof settings.lyraConfig === 'object' && !Array.isArray(settings.lyraConfig)
        ? Object.keys(settings.lyraConfig)
        : 'INVALID - not an object',
      fullSettingsPreview: JSON.stringify(settings).substring(0, 1000),
    })

    // Additional validation and logging for debugging malformed settings
    if (settings?.lyraConfig) {
      if (Array.isArray(settings.lyraConfig)) {
        console.error('[getTenantLyraSettings] lyraConfig is an array (should be object):', settings.lyraConfig)
      } else if (typeof settings.lyraConfig !== 'object') {
        console.error('[getTenantLyraSettings] lyraConfig is not an object:', typeof settings.lyraConfig, settings.lyraConfig)
      }
    }

    // Check multiple possible locations for lyraConfig
    let lyraConfig = settings?.lyraConfig

    // If not found, check if it's nested differently or has a different structure
    if (!lyraConfig && settings) {
      // Try to find any Lyra-related keys
      const allKeys = Object.keys(settings)
      console.log('[getTenantLyraSettings] Searching for Lyra config in all settings keys:', allKeys)

      // Check if there's a paymentConfig or similar
      if (settings.paymentConfig?.lyra) {
        lyraConfig = settings.paymentConfig.lyra
        console.log('[getTenantLyraSettings] Found Lyra config in paymentConfig.lyra')
      }
    }

    // NO FALLBACK TO GLOBAL - Each tenant MUST have its own isolated configuration
    if (!lyraConfig) {
      console.error('[getTenantLyraSettings] Tenant settings missing lyraConfig:', {
        tenantId,
        tenantName: tenant.name,
        availableKeys: Object.keys(settings || {}),
        settingsPreview: JSON.stringify(settings).substring(0, 1000),
      })
      throw new HttpException(
        `Tenant "${tenant.name}" has no Lyra payment configuration. Each tenant must have its own isolated Lyra configuration in settings.lyraConfig. Please copy the global configuration to this tenant using the admin dashboard, or configure tenant-specific settings.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    console.log('[getTenantLyraSettings] Found tenant-specific Lyra config:', {
      tenantId,
      tenantName: tenant.name,
      hasTestMode: !!lyraConfig.testMode,
      hasProductionMode: !!lyraConfig.productionMode,
      activeMode: lyraConfig.activeMode,
    })

    return lyraConfig as LyraSettings
  }

  /**
   * Initialize Lyra (IzyPay) smart form configuration for a given payment link token.
   * This is Step 1 (backend): expose all data the frontend needs to render the embedded card form.
   * 
   * Lyra credentials are fetched ONLY from tenant settings. Each tenant must have their own config.
   * Payment links without a tenantId will be rejected.
   */
  @Post('link/:token/lyra-form')
  async createLyraFormForPaymentLink(@Param('token') token: string) {
    try {
      console.log('[createLyraFormForPaymentLink] Starting for token:', token)

      const link = await this.prisma.paymentLink.findUnique({
        where: { token },
        include: {
          paymentProduct: true,
        },
      })

      if (!link) {
        console.error('[createLyraFormForPaymentLink] Payment link not found for token:', token)
        throw new HttpException('Payment link not found', HttpStatus.NOT_FOUND)
      }

      // Validate that payment link has a tenantId
      if (!link.tenantId) {
        console.error('[createLyraFormForPaymentLink] Payment link has no tenantId:', link.id)
        throw new HttpException(
          'This payment link is not associated with a tenant. Payment processing requires tenant-specific configuration.',
          HttpStatus.BAD_REQUEST,
        )
      }

      console.log('[createLyraFormForPaymentLink] Link found:', {
        id: link.id,
        amountCents: link.amountCents,
        tenantId: link.tenantId,
      })

      // Get Lyra config from tenant settings (no global fallback)
      const lyraConfig = await this.getTenantLyraSettings(link.tenantId)

      console.log('[createLyraFormForPaymentLink] Lyra config loaded from tenant:', {
        tenantId: link.tenantId,
        activeMode: lyraConfig.activeMode,
      })

      const { activeMode = 'test' } = lyraConfig as LyraSettings
      const mode: 'test' | 'production' = activeMode === 'production' ? 'production' : 'test'
      // Access the correct property: testMode or productionMode
      const modeConfig = mode === 'production'
        ? (lyraConfig as LyraSettings).productionMode
        : (lyraConfig as LyraSettings).testMode

      console.log('[createLyraFormForPaymentLink] Mode config:', {
        mode,
        enabled: modeConfig?.enabled,
        hasCredentials: !!modeConfig?.credentials,
      })

      // Log which credentials are being used (without exposing sensitive data)
      if (modeConfig?.credentials) {
        const creds = modeConfig.credentials as unknown as Record<string, string>
        const publicKeyPreview = creds.publicKey ? creds.publicKey.substring(0, 50) : 'missing'
        const isTestKey = publicKeyPreview.toLowerCase().includes('test')
        console.log(`[createLyraFormForPaymentLink] ✅ Using ${mode.toUpperCase()} mode credentials:`, {
          mode: mode.toUpperCase(),
          isTestCredentials: mode === 'test' || isTestKey,
          apiUser: creds.apiUser ? `${creds.apiUser.substring(0, 4)}...` : 'missing',
          hasApiPassword: !!creds.apiPassword,
          hasHmacKey: !!creds.hmacKey,
          publicKey: publicKeyPreview + '...',
          publicKeyContainsTest: isTestKey,
          scriptBaseUrl: creds.scriptBaseUrl || 'missing',
          apiBaseUrl: creds.apiBaseUrl || 'missing',
        })
      } else {
        console.warn(`[createLyraFormForPaymentLink] ⚠️ No credentials found for ${mode} mode`)
      }

      if (!modeConfig?.enabled || !modeConfig.credentials) {
        console.error('[createLyraFormForPaymentLink] Lyra mode not configured:', {
          mode,
          enabled: modeConfig?.enabled,
          hasCredentials: !!modeConfig?.credentials,
        })
        throw new HttpException(
          `Lyra ${mode} mode is not fully configured. Please enable and configure credentials in Admin → System Settings → Lyra Payment Gateway.`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      const credentials = modeConfig.credentials as unknown as Record<string, string>
      const scriptBaseUrl = credentials.scriptBaseUrl
      const publicKey = credentials.publicKey

      console.log('[createLyraFormForPaymentLink] Credentials check:', {
        hasScriptBaseUrl: !!scriptBaseUrl,
        hasPublicKey: !!publicKey,
        scriptBaseUrl: scriptBaseUrl?.substring(0, 50) + '...',
      })

      if (!scriptBaseUrl || !publicKey) {
        console.error('[createLyraFormForPaymentLink] Missing required credentials:', {
          scriptBaseUrl: !!scriptBaseUrl,
          publicKey: !!publicKey,
        })
        throw new HttpException(
          'Lyra credentials are missing scriptBaseUrl or publicKey. Please check your Lyra configuration.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      const expectedFingerprint = computeLyraFormTokenFingerprint({
        mode,
        apiBaseUrl: credentials.apiBaseUrl,
        scriptBaseUrl,
        publicKey,
        apiUser: credentials.apiUser,
      })

      // Extract payment details and config
      const amountCents = link.amountCents
      const currency = link.currency.toUpperCase()
      const language = (lyraConfig.language || 'en-EN') as string
      const theme = (lyraConfig.theme || 'neon') as 'neon' | 'classic'
      const paymentMethods =
        Array.isArray(lyraConfig.paymentMethods) && lyraConfig.paymentMethods.length > 0
          ? lyraConfig.paymentMethods
          : ['CARDS']

      // Check if we have a valid formToken (not expired, expires in 15 minutes)
      let formToken = link.formToken
      const formTokenExpiresAt = link.formTokenExpiresAt
      const now = new Date()
      const isFormTokenValid = isReusableLyraFormToken({
        formToken,
        formTokenExpiresAt,
        now,
        expectedContext: { mode, fingerprint: expectedFingerprint },
        metadata: link.metadata,
      })

      if (!isFormTokenValid) {
        console.log('[createLyraFormForPaymentLink] Generating new formToken via Lyra API...')

        // Generate formToken by calling Lyra's Charge/CreatePayment API
        const apiUser = credentials.apiUser
        const apiPassword = credentials.apiPassword
        const apiEndpoint = credentials.apiBaseUrl

        if (!apiUser || !apiPassword) {
          console.error('[createLyraFormForPaymentLink] Missing API credentials:', {
            hasApiUser: !!apiUser,
            hasApiPassword: !!apiPassword,
          })
          throw new HttpException(
            'Lyra API credentials (apiUser, apiPassword) are missing. Please check your Lyra configuration.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          )
        }

        if (!apiEndpoint) {
          console.error('[createLyraFormForPaymentLink] Missing API endpoint URL')
          throw new HttpException(
            'Lyra API endpoint URL (apiBaseUrl) is missing. Please configure it in Admin → System Settings → Lyra Payment Gateway.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          )
        }

        // Build the payment request payload
        // Note: URLs de redirección se configuran en el frontend con KR.setFormConfig(), NO aquí
        const orderId = `order_${link.id}_${Date.now()}`
        const amount = amountCents // Lyra expects amount in smallest currency unit (cents)

        const paymentData: any = {
          orderId,
          amount,
          currency: currency.toUpperCase(),
          customer: {
            email: link.customerEmail || 'customer@example.com',
            reference: link.customerName || `customer_${link.id}`,
            billingDetails: {
              language: language.split('-')[0] || 'en',
              phoneNumber: link.customerPhone ? `${link.customerCountryCode || ''}${link.customerPhone}`.replace(/[^0-9+]/g, '') : undefined,
              firstName: link.customerName?.split(' ')[0] || 'Customer',
              lastName: link.customerName?.split(' ').slice(1).join(' ') || 'Name',
              category: 'PRIVATE',
            },
          },
          transactionOptions: {
            cardOptions: {
              retry: 1,
            },
          },
        }

        // Add payment methods if specified (only if not default CARDS)
        if (paymentMethods && paymentMethods.length > 0 && !paymentMethods.includes('CARDS')) {
          paymentData.paymentMethods = paymentMethods
        }

        console.log('[createLyraFormForPaymentLink] Calling Lyra API:', {
          apiEndpoint,
          orderId,
          amount,
          currency,
        })

        try {
          // Add Basic Auth header
          const authHeader = `Basic ${Buffer.from(`${apiUser}:${apiPassword}`).toString('base64')}`
          const finalResponse = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify(paymentData),
          })

          if (!finalResponse.ok) {
            const errorText = await finalResponse.text()
            console.error('[createLyraFormForPaymentLink] Lyra API error:', {
              status: finalResponse.status,
              statusText: finalResponse.statusText,
              error: errorText,
            })
            throw new HttpException(
              `Lyra API error: ${finalResponse.status} ${finalResponse.statusText}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            )
          }

          const lyraData = await finalResponse.json()
          console.log('[createLyraFormForPaymentLink] Lyra API response:', {
            status: lyraData.status,
            hasAnswer: !!lyraData.answer,
            hasFormToken: !!lyraData.answer?.formToken,
          })

          if (lyraData.status !== 'SUCCESS' || !lyraData.answer?.formToken) {
            const errorCode = lyraData.answer?.errorCode || 'UNKNOWN'
            const errorMessage = lyraData.answer?.errorMessage || 'Failed to create formToken'
            console.error('[createLyraFormForPaymentLink] Lyra API returned error:', {
              status: lyraData.status,
              errorCode,
              errorMessage,
            })

            // Provide more helpful error messages for common issues
            let userMessage = `Lyra API error ${errorCode}: ${errorMessage}`
            if (errorCode === 'INT_905') {
              userMessage = 'Lyra API credentials are invalid. Please check your apiUser and apiPassword in Admin → System Settings → Lyra Payment Gateway → Production Mode credentials.'
            } else if (errorCode === 'INT_901') {
              userMessage = 'Lyra API endpoint not found. Please verify your apiBaseUrl in the Lyra configuration.'
            }

            throw new HttpException(
              userMessage,
              HttpStatus.INTERNAL_SERVER_ERROR,
            )
          }

          formToken = lyraData.answer.formToken

          // Store formToken in database with 15-minute expiration
          const expiresAt = new Date()
          expiresAt.setMinutes(expiresAt.getMinutes() + 15)

          const nextMetadata = withUpdatedLyraFormTokenContext(link.metadata, {
            mode,
            fingerprint: expectedFingerprint,
            generatedAt: now.toISOString(),
          })

          await this.prisma.paymentLink.update({
            where: { id: link.id },
            data: {
              formToken,
              formTokenExpiresAt: expiresAt,
              metadata: nextMetadata as any,
            },
          })

          console.log('[createLyraFormForPaymentLink] FormToken generated and stored:', {
            formTokenPreview: formToken.substring(0, 20) + '...',
            expiresAt: expiresAt.toISOString(),
          })
        } catch (apiError) {
          console.error('[createLyraFormForPaymentLink] Error calling Lyra API:', apiError)
          if (apiError instanceof HttpException) {
            throw apiError
          }
          throw new HttpException(
            `Failed to generate formToken from Lyra API: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          )
        }
      } else {
        console.log('[createLyraFormForPaymentLink] Reusing existing valid formToken:', {
          formTokenPreview: formToken.substring(0, 20) + '...',
          expiresAt: formTokenExpiresAt.toISOString(),
        })
      }

      // Build absolute URLs for success/failure redirects
      // IMPORTANT: Use tenant frontend domain (subdomain) to avoid CSP form-action violations
      // The frontend API routes will proxy to the backend redirect endpoints
      // This ensures form submissions go to the same domain (CSP 'self' requirement)
      const tenantBaseUrl = await this.resolveTenantBaseUrl(link.tenantId)

      console.log('[createLyraFormForPaymentLink] Tenant base URL resolved:', {
        tenantBaseUrl,
        tenantId: link.tenantId,
        hasBackendUrl: !!process.env.BACKEND_URL,
        hasRailwayPublicDomain: !!process.env.RAILWAY_PUBLIC_DOMAIN,
        hasRailwayStaticUrl: !!process.env.RAILWAY_STATIC_URL,
      })

      // Use frontend API routes (same domain as the payment page) to avoid CSP violations
      // These routes will proxy to the backend redirect endpoints
      const successUrl = `${tenantBaseUrl}/api/payments/lyra/redirect/success`
      const failureUrl = `${tenantBaseUrl}/api/payments/lyra/redirect/failure`

      console.log('[createLyraFormForPaymentLink] Redirect URLs:', {
        successUrl,
        failureUrl,
        tenantBaseUrl,
      })

      console.log('[createLyraFormForPaymentLink] Returning config:', {
        mode,
        amountCents,
        currency,
        hasFormToken: !!formToken,
        formTokenPreview: formToken?.substring(0, 20) + '...',
      })

      return {
        success: true,
        linkId: link.id,
        token: link.token,
        mode,
        amountCents,
        currency,
        formToken,
        publicKey,
        scriptBaseUrl,
        language,
        theme,
        successUrl,
        failureUrl,
        paymentMethods,
      }
    } catch (error) {
      console.error('[createLyraFormForPaymentLink] Error:', error)
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        `Failed to initialize Lyra form: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * Lyra webhook endpoint to receive payment notifications
   * This endpoint receives IPN (Instant Payment Notification) callbacks from Lyra
   */
  @Post('lyra/webhook')
  async handleLyraWebhook(
    @Body() body: any,
    @Query('mode') mode?: string,
  ) {
    try {
      // Log full body structure for debugging
      // Note: Lyra sends properties with hyphens (kr-answer), so we need bracket notation
      const krAnswer = body?.['kr-answer'] || body?.kr_answer

      console.log('[handleLyraWebhook] Received webhook:', {
        mode: mode || 'unknown',
        hasBody: !!body,
        bodyType: typeof body,
        bodyKeys: body ? Object.keys(body) : [],
        fullBody: JSON.stringify(body).substring(0, 1000), // Log first 1000 chars
        hasKrAnswer: !!krAnswer,
        orderIdFromKrAnswer: krAnswer?.orderDetails?.orderId,
        orderId: body?.orderDetails?.orderId,
        orderIdAlt: body?.orderId,
        orderIdAlt2: body?.order?.orderId,
        transactionStatus: body?.transactions?.[0]?.status || krAnswer?.orderStatus,
        status: body?.status || krAnswer?.orderStatus,
      })

      // Extract order ID from webhook payload - try multiple possible locations
      // Lyra sends orderId in kr-answer.orderDetails.orderId (with hyphen in property name)
      // OrderId format: order_{linkId}_{timestamp}
      const orderId =
        krAnswer?.orderDetails?.orderId ||  // Primary location: kr-answer.orderDetails.orderId
        body?.orderDetails?.orderId ||      // Alternative: direct orderDetails
        body?.orderId ||                     // Alternative: direct orderId
        body?.order?.orderId                 // Alternative: nested order.orderId

      if (!orderId) {
        // Log the full body structure to help debug
        console.error('[handleLyraWebhook] Missing orderId in webhook payload. Full body structure:', {
          bodyKeys: body ? Object.keys(body) : [],
          bodyString: JSON.stringify(body).substring(0, 500),
          bodyType: typeof body,
        })

        // Return 200 OK to prevent Lyra from retrying, but log the error
        // This is important because Lyra might send test/validation requests
        return {
          success: false,
          message: 'Missing orderId in webhook payload',
          received: {
            bodyKeys: body ? Object.keys(body) : [],
            hasBody: !!body,
          },
        }
      }

      // Extract link ID from orderId
      const match = orderId.match(/^order_(.+?)_\d+$/)
      if (!match) {
        console.error('[handleLyraWebhook] Invalid orderId format:', orderId)
        throw new HttpException('Invalid orderId format', HttpStatus.BAD_REQUEST)
      }

      const linkId = match[1]
      const transaction = body?.transactions?.[0]
      // Get transaction status from kr-answer if available, otherwise from body
      const transactionStatus =
        krAnswer?.orderStatus ||           // Primary: from kr-answer.orderStatus
        transaction?.status ||             // Alternative: from transactions array
        body?.status                       // Fallback: from body.status

      // Find the payment link
      const link = await this.prisma.paymentLink.findUnique({
        where: { id: linkId },
        select: { id: true, status: true, tenantId: true },
      })

      if (!link) {
        console.error('[handleLyraWebhook] Payment link not found:', linkId)
        throw new HttpException('Payment link not found', HttpStatus.NOT_FOUND)
      }

      // Update payment link status based on transaction status
      let newStatus = link.status
      if (transactionStatus === 'PAID' || transactionStatus === 'SUCCESS') {
        newStatus = 'completed'
      } else if (transactionStatus === 'FAILED' || transactionStatus === 'REFUSED') {
        newStatus = 'failed'
      } else if (transactionStatus === 'PENDING') {
        newStatus = 'processing'
      }

      // Update payment link if status changed
      if (newStatus !== link.status) {
        await this.prisma.paymentLink.update({
          where: { id: link.id },
          data: {
            status: newStatus,
            updatedAt: new Date(),
          },
        })

        console.log('[handleLyraWebhook] Payment link status updated:', {
          linkId: link.id,
          oldStatus: link.status,
          newStatus,
          transactionStatus,
        })
      }

      // Create or update payment transaction record
      // Try to get transaction UUID from multiple locations
      const transactionUuid =
        krAnswer?.transactions?.[0]?.uuid ||
        transaction?.uuid ||
        body?.transactions?.[0]?.uuid ||
        body?.transactionId ||
        body?.['transaction-id']

      // Get order details from kr-answer if available, otherwise from body
      const orderDetails = krAnswer?.orderDetails || body?.orderDetails

      if (transactionUuid) {
        // Use gatewayId (which is the transaction UUID from Lyra) and paymentLinkId for uniqueness
        // First try to find existing transaction by gatewayId
        const existing = await this.prisma.paymentTransaction.findFirst({
          where: {
            gatewayId: transactionUuid,
            paymentLinkId: link.id,
          },
        })

        if (existing) {
          // Update existing transaction
          await this.prisma.paymentTransaction.update({
            where: { id: existing.id },
            data: {
              status: newStatus,
              rawResponse: body as any,
            },
          })

          console.log('[handleLyraWebhook] Payment transaction record updated:', {
            transactionId: transactionUuid,
            status: newStatus,
          })
        } else {
          // Create new transaction
          await this.prisma.paymentTransaction.create({
            data: {
              paymentLinkId: link.id,
              gatewayId: transactionUuid,
              status: newStatus,
              rawResponse: body as any,
            },
          })

          console.log('[handleLyraWebhook] Payment transaction record created:', {
            transactionId: transactionUuid,
            status: newStatus,
          })
        }
      } else {
        console.warn('[handleLyraWebhook] No transaction UUID found, skipping transaction record creation')
      }

      // Return success response (Lyra expects 200 OK)
      return {
        success: true,
        message: 'Webhook processed successfully',
        linkId: link.id,
        status: newStatus,
      }
    } catch (error) {
      console.error('[handleLyraWebhook] Error processing webhook:', error)
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        `Failed to process webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}

