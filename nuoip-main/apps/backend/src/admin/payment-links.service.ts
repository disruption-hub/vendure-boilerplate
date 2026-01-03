import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { randomBytes, randomUUID } from 'crypto'
import type { paymentLink, paymentProduct, paymentTax, Prisma } from '@prisma/client'
// import { socketManagerRegistry } from '../lib/whatsapp/baileys/socket-manager-registry'
import { AdminSystemSettingsService } from './system-settings.service'
import { WhatsAppConnectionService } from '../modules/whatsapp/services/whatsapp.connection.service'

export interface PaymentLinkResponse {
  id: string
  token: string
  productId: string
  sessionId?: string | null
  tenantId?: string | null
  amountCents: number
  baseAmountCents: number
  taxAmountCents: number
  taxId?: string | null
  taxRateBps?: number | null
  currency: string
  status: string
  customerName?: string | null
  customerEmail?: string | null
  expiresAt?: string | null
  completedAt?: string | null
  lastStatusChangeAt?: string | null
  gatewayTransactionId?: string | null
  formToken?: string | null
  formTokenExpiresAt?: string | null
  channel: string
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  product: {
    id: string
    productCode: string
    name: string
    description?: string | null
    amountCents: number
    baseAmountCents: number
    taxAmountCents: number
    currency: string
    tax?: {
      id: string
      name: string
      countryCode: string
      currency: string
      rateBps: number
    } | null
  }
}

export interface PaymentLinkPayload {
  productId?: string
  productName?: string
  amountCents?: number
  currency?: string
  expiresInMinutes?: number
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerCountryCode?: string
  metadata?: Record<string, unknown>
  tenantId?: string
}

export interface PaymentLinkUpdatePayload {
  status?: string
}

@Injectable()
export class AdminPaymentLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemSettingsService: AdminSystemSettingsService,
    private readonly connectionService: WhatsAppConnectionService,
  ) { }

  async getLinks(params: {
    tenantId?: string
    status?: string
    limit?: number
  } = {}): Promise<PaymentLinkResponse[]> {
    const where: any = {}

    if (params.tenantId) {
      where.tenantId = params.tenantId
    }

    if (params.status && params.status !== 'all') {
      where.status = params.status
    }

    const links = await this.prisma.paymentLink.findMany({
      where,
      include: {
        paymentProduct: {
          select: {
            id: true,
            name: true,
            amountCents: true,
            currency: true
          }
        },
        paymentTax: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: params.limit || 100,
    })

    return links.map(link => this.mapLinkToResponse({
      ...link,
      paymentProduct: link.paymentProduct,
      paymentTax: link.paymentTax
    }))
  }

  async getLinkById(id: string): Promise<PaymentLinkResponse> {
    const link = await this.prisma.paymentLink.findUnique({
      where: { id },
      include: {
        paymentProduct: {
          include: {
            paymentTax: true,
          },
        },
        paymentTax: true,
      },
    })

    if (!link) {
      throw new NotFoundException(`Payment link with ID ${id} not found`)
    }

    return this.mapLinkToResponse(link)
  }

  async createLink(payload: PaymentLinkPayload): Promise<PaymentLinkResponse> {
    // Fetch the product to get pricing and tax information
    let product: (paymentProduct & { paymentTax: paymentTax | null }) | null = null

    if (payload.productId) {
      product = await this.prisma.paymentProduct.findUnique({
        where: { id: payload.productId },
        include: {
          paymentTax: true,
        },
      })

      if (!product) {
        throw new NotFoundException(`Product with ID ${payload.productId} not found`)
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.productCode} is not active`)
      }
    } else {
      // Validate custom product requirements
      if (!payload.productName) {
        throw new BadRequestException('Product name is required for custom payment links')
      }
      if (!payload.amountCents) {
        throw new BadRequestException('Amount is required for custom payment links')
      }
    }

    // Determine amounts
    let amountCents = payload.amountCents
    let baseAmountCents = 0
    let taxAmountCents = 0
    let taxId: string | null = null
    let taxRateBps: number | null = null
    let currency = payload.currency || 'PEN'

    if (product) {
      amountCents = payload.amountCents ?? product.amountCents
      baseAmountCents = product.baseAmountCents
      taxAmountCents = product.taxAmountCents
      taxId = product.taxId
      taxRateBps = product.paymentTax?.rateBps ?? null
      currency = payload.currency ?? product.currency

      // If amount override is provided, recalculate tax
      if (payload.amountCents && payload.amountCents !== product.amountCents) {
        if (product.paymentTax) {
          const tax = product.paymentTax
          if (product.priceIncludesTax) {
            // Price includes tax, calculate base from total
            const rateMultiplier = 1 + tax.rateBps / 10_000
            baseAmountCents = Math.round(amountCents! / rateMultiplier)
            taxAmountCents = amountCents! - baseAmountCents
          } else {
            // Price excludes tax, add tax to base
            baseAmountCents = amountCents!
            taxAmountCents = Math.round((amountCents! * tax.rateBps) / 10_000)
            amountCents = baseAmountCents + taxAmountCents
          }
          taxRateBps = tax.rateBps
        } else {
          // No tax, amount is the base
          baseAmountCents = amountCents!
          taxAmountCents = 0
        }
      }
    } else {
      // Custom product logic (assume no tax for now)
      baseAmountCents = amountCents!
      taxAmountCents = 0
    }

    // Generate unique token
    const token = this.generateUniqueToken()

    // Calculate expiration
    let expiresAt: Date | null = null
    if (payload.expiresInMinutes && payload.expiresInMinutes > 0) {
      expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + payload.expiresInMinutes)
    }

    const link = await this.prisma.paymentLink.create({
      data: {
        id: randomUUID(),
        token,
        productId: payload.productId,
        productName: payload.productName,
        amountCents: amountCents!,
        baseAmountCents,
        taxAmountCents,
        taxId,
        taxRateBps,
        currency,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        customerPhone: payload.customerPhone,
        customerCountryCode: payload.customerCountryCode,
        expiresAt,
        metadata: (payload.metadata ?? {}) as Prisma.InputJsonValue,
        status: 'pending',
        channel: 'admin',
        tenantId: payload.tenantId,
        updatedAt: new Date(),
      },
      include: {
        paymentProduct: {
          include: {
            paymentTax: true,
          },
        },
        paymentTax: true,
      },
    })

    // Send WhatsApp message if phone number is provided
    if (payload.customerPhone && payload.tenantId) {
      try {
        // Find active session for tenant
        const session = await this.prisma.whatsAppSession.findFirst({
          where: {
            tenantId: payload.tenantId,
            status: 'CONNECTED',
          },
          orderBy: { lastSync: 'desc' },
        })

        if (session) {
          // Use new service to check connection and send message
          if (true) {
            const { rootDomain } = await this.systemSettingsService.getRootDomain()

            // Resolve correct base URL with subdomain support
            let baseUrl = `https://${rootDomain}`
            if (payload.tenantId) {
              const tenant = await this.prisma.tenant.findUnique({
                where: { id: payload.tenantId },
                select: { domain: true, subdomain: true, settings: true }
              })

              if (tenant) {
                if (tenant.domain) {
                  baseUrl = `https://${tenant.domain}`
                } else if (tenant.subdomain) {
                  baseUrl = `https://${tenant.subdomain}.${rootDomain}`
                }
              }
            }

            // Construct JID (remove + if present)
            const countryCode = payload.customerCountryCode?.replace('+', '') || ''
            const phone = payload.customerPhone.replace(/\D/g, '')
            const jid = `${countryCode}${phone}@s.whatsapp.net`
            const linkUrl = `${baseUrl}/pay/${token}`

            const messageText = `Hola ${payload.customerName || 'cliente'}, aquí tienes tu link de pago para ${payload.productName || product?.name}:\n\n${linkUrl}`

            await this.connectionService.sendMessage(session.sessionId, jid, messageText)
            console.log(`[createLink] Sent WhatsApp payment link to ${jid} via ConnectionService`)
          }
        } else {
          console.warn(`[createLink] No active WhatsApp session found for tenant ${payload.tenantId}`)
        }
      } catch (error) {
        console.error('[createLink] Failed to send WhatsApp message:', error)
        // Don't fail the request if WhatsApp sending fails
      }
    }

    return this.mapLinkToResponse(link)
  }

  async updateLinkStatus(id: string, status: string): Promise<PaymentLinkResponse> {
    const link = await this.prisma.paymentLink.findUnique({
      where: { id },
    })

    if (!link) {
      throw new NotFoundException(`Payment link with ID ${id} not found`)
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'expired', 'cancelled', 'failed']
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`)
    }

    const updateData: any = {
      status,
      lastStatusChangeAt: new Date(),
    }

    // Set completedAt if status is 'paid'
    if (status === 'paid') {
      updateData.completedAt = new Date()
    }

    const updated = await this.prisma.paymentLink.update({
      where: { id },
      data: updateData,
      include: {
        paymentProduct: {
          include: {
            paymentTax: true,
          },
        },
        paymentTax: true,
      },
    })

    return this.mapLinkToResponse(updated)
  }

  async deleteLink(id: string): Promise<void> {
    const link = await this.prisma.paymentLink.findUnique({
      where: { id },
    })

    if (!link) {
      throw new NotFoundException(`Payment link with ID ${id} not found`)
    }

    await this.prisma.paymentLink.delete({
      where: { id },
    })
  }

  private generateUniqueToken(): string {
    // Generate a URL-safe token
    const bytes = randomBytes(16)
    return bytes.toString('base64url')
  }

  private mapLinkToResponse(
    link: paymentLink & {
      paymentProduct?: (paymentProduct & { paymentTax?: paymentTax | null }) | null
      paymentTax?: paymentTax | null
    }
  ): PaymentLinkResponse {
    // Construct virtual product if relation is missing (custom link)
    const product = link.paymentProduct || {
      id: 'custom',
      productCode: 'CUSTOM',
      name: link.productName || 'Custom Product',
      description: 'Custom payment link',
      amountCents: link.amountCents,
      baseAmountCents: link.baseAmountCents,
      taxAmountCents: link.taxAmountCents,
      currency: link.currency,
      paymentTax: null,
      isActive: true,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      tenantId: link.tenantId || '',
      taxId: null
    }

    return {
      id: link.id,
      token: link.token,
      productId: link.productId || 'custom',
      sessionId: link.sessionId,
      tenantId: link.tenantId,
      amountCents: link.amountCents,
      baseAmountCents: link.baseAmountCents,
      taxAmountCents: link.taxAmountCents,
      taxId: link.taxId,
      taxRateBps: link.taxRateBps,
      currency: link.currency,
      status: link.status,
      customerName: link.customerName,
      customerEmail: link.customerEmail,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      completedAt: link.completedAt?.toISOString() ?? null,
      lastStatusChangeAt: link.lastStatusChangeAt?.toISOString() ?? null,
      gatewayTransactionId: link.gatewayTransactionId,
      formToken: link.formToken,
      formTokenExpiresAt: link.formTokenExpiresAt?.toISOString() ?? null,
      channel: link.channel,
      metadata: link.metadata as Record<string, unknown> | null,
      createdAt: link.createdAt.toISOString(),
      updatedAt: link.updatedAt.toISOString(),
      product: {
        id: product.id,
        productCode: product.productCode,
        name: product.name,
        description: product.description,
        amountCents: product.amountCents,
        baseAmountCents: product.baseAmountCents,
        taxAmountCents: product.taxAmountCents,
        currency: product.currency,
        tax: product.paymentTax
          ? {
            id: product.paymentTax.id,
            name: product.paymentTax.name,
            countryCode: product.paymentTax.countryCode,
            currency: product.paymentTax.currency,
            rateBps: product.paymentTax.rateBps,
          }
          : null,
      },
    }
  }
}

