import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AdminSystemSettingsService } from './system-settings.service'
import { randomUUID } from 'crypto'
import type { paymentProduct, paymentTax, Prisma } from '@prisma/client'

export interface PaymentProductResponse {
  id: string
  productCode: string
  name: string
  description?: string | null
  amountCents: number
  baseAmountCents: number
  taxAmountCents: number
  priceIncludesTax: boolean
  currency: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown> | null
  taxId?: string | null
  tax?: PaymentTaxResponse | null
  categoryId?: string | null
  trackStock?: boolean
  initialStock?: number
  images: PaymentProductImageResponse[]
}

export interface PaymentTaxResponse {
  id: string
  name: string
  description?: string | null
  countryCode: string
  currency: string
  rateBps: number
  isDefault: boolean
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface PaymentProductImageResponse {
  id: string
  url: string
  displayOrder: number
  isDefault: boolean
}

export interface PaymentProductPayload {
  productCode: string
  name: string
  description?: string | null
  baseAmountCents: number
  currency: string
  isActive?: boolean
  metadata?: Record<string, unknown>
  taxId?: string | null
  priceIncludesTax?: boolean
  categoryId?: string | null
  trackStock?: boolean
  initialStock?: number
  initialStockLocationId?: string | null
  images?: {
    url: string
    isDefault?: boolean
    displayOrder?: number
  }[]
}

export interface PaymentTaxPayload {
  name: string
  description?: string | null
  countryCode: string
  currency: string
  rateBps: number
  isDefault?: boolean
  metadata?: Record<string, unknown>
}

@Injectable()
export class AdminPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemSettingsService: AdminSystemSettingsService,
  ) { }

  /**
   * Generate a product description using OpenRouter AI
   */
  async generateProductDescription(productName: string): Promise<string | null> {
    try {
      const settings = await this.systemSettingsService.getOpenRouterSettings()
      if (!settings?.apiKey) {
        console.log('[Payments] OpenRouter not configured, skipping AI description')
        return null
      }

      const prompt = `Generate a concise 1-2 sentence marketing description for a product called "${productName}". Make it appealing and professional. Only output the description text, nothing else.`

      const response = await fetch(settings.baseUrl || 'https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        console.error('[Payments] OpenRouter API error:', response.status)
        return null
      }

      const data = await response.json()
      const description = data.choices?.[0]?.message?.content?.trim()

      if (description) {
        console.log(`[Payments] Generated AI description for "${productName}": ${description.substring(0, 50)}...`)
        return description
      }
      return null
    } catch (error) {
      console.error('[Payments] Error generating AI description:', error)
      return null
    }
  }

  // Payment Products
  async getProducts(tenantId: string): Promise<PaymentProductResponse[]> {
    const products = await this.prisma.paymentProduct.findMany({
      where: {
        tenantId
      },
      include: {
        paymentTax: true,
        paymentProductImages: true,
        catalogCategory: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return products.map(p => this.mapProductToResponse(p))
  }

  async getProductById(id: string): Promise<PaymentProductResponse> {
    const product = await this.prisma.paymentProduct.findUnique({
      where: { id },
      include: {
        paymentTax: true,
        paymentProductImages: true,
      },
    })

    if (!product) {
      throw new NotFoundException(`Payment product with ID ${id} not found`)
    }

    return this.mapProductToResponse(product)
  }

  async createProduct(tenantId: string, payload: PaymentProductPayload): Promise<PaymentProductResponse> {
    // Check if product code already exists
    const existing = await this.prisma.paymentProduct.findUnique({
      where: {
        tenantId_productCode: {
          tenantId,
          productCode: payload.productCode
        }
      },
    })

    if (existing) {
      throw new ConflictException(`A product with code "${payload.productCode}" already exists`)
    }

    // Calculate tax if taxId is provided
    let taxAmountCents = 0
    let amountCents = payload.baseAmountCents
    let baseAmountCents = payload.baseAmountCents // Before tax amount

    if (payload.taxId) {
      const tax = await this.prisma.paymentTax.findUnique({
        where: { id: payload.taxId },
      })

      if (!tax) {
        throw new NotFoundException(`Tax with ID ${payload.taxId} not found`)
      }

      const priceIncludesTax = payload.priceIncludesTax ?? true
      if (priceIncludesTax) {
        // Price includes tax, so payload.baseAmountCents IS the total
        amountCents = payload.baseAmountCents

        // Calculate base from total: base = total / (1 + rate)
        const rateMultiplier = 1 + tax.rateBps / 10_000
        const calculatedBase = Math.round(payload.baseAmountCents / rateMultiplier)

        taxAmountCents = payload.baseAmountCents - calculatedBase
        baseAmountCents = calculatedBase
      } else {
        // Price excludes tax, so payload.baseAmountCents IS the base
        baseAmountCents = payload.baseAmountCents
        amountCents = payload.baseAmountCents // logic seems to rely on payload which is technically wrong variable naming convention by user but we stick to it
        taxAmountCents = Math.round((payload.baseAmountCents * tax.rateBps) / 10_000)
        amountCents = payload.baseAmountCents + taxAmountCents
      }
    }

    const product = await this.prisma.paymentProduct.create({
      data: {
        id: randomUUID(),
        productCode: payload.productCode,
        tenant: { connect: { id: tenantId } },
        updatedAt: new Date(),
        name: payload.name,
        description: payload.description,
        baseAmountCents: baseAmountCents, // Use calculated base
        taxAmountCents,
        amountCents,

        currency: payload.currency,
        isActive: payload.isActive ?? true,
        priceIncludesTax: payload.priceIncludesTax ?? true,
        ...(payload.taxId ? { paymentTax: { connect: { id: payload.taxId } } } : {}),
        metadata: payload.metadata as Prisma.InputJsonValue,
        ...(payload.categoryId ? { catalogCategory: { connect: { id: payload.categoryId } } } : {}),
        trackStock: payload.trackStock ?? false,
        paymentProductImages: {
          create: payload.images?.map((img: any, index: number) => {
            if (typeof img === 'string') {
              return { id: randomUUID(), url: img, isDefault: index === 0, displayOrder: index, updatedAt: new Date() }
            }
            return {
              id: randomUUID(),
              url: img.url,
              isDefault: img.isDefault ?? index === 0,
              displayOrder: img.displayOrder ?? index,
              updatedAt: new Date(),
            }
          }) || [],
        },
      },
      include: {
        paymentTax: true,
        paymentProductImages: true,
      },
    })

    // Handle initial stock if requested
    if (payload.trackStock && payload.initialStock && payload.initialStock > 0) {
      if (tenantId) {
        let locationId: string | null = null

        // Use provided locationId if available
        if (payload.initialStockLocationId) {
          const providedLocation = await this.prisma.stockLocation.findFirst({
            where: {
              id: payload.initialStockLocationId,
              tenantId,
              isActive: true
            },
          })
          if (providedLocation) {
            locationId = providedLocation.id
          }
        }

        // Fallback to default location if no locationId provided or not found
        if (!locationId) {
          const defaultLocation = await this.prisma.stockLocation.findFirst({
            where: { tenantId, isDefault: true, isActive: true },
          })
          if (defaultLocation) {
            locationId = defaultLocation.id
          }
        }

        // Fallback to any active location
        if (!locationId) {
          const anyLocation = await this.prisma.stockLocation.findFirst({
            where: { tenantId, isActive: true },
          })
          if (anyLocation) {
            locationId = anyLocation.id
          }
        }

        if (locationId) {
          await this.prisma.stockEntry.create({
            data: {
              id: randomUUID(),
              tenantId,
              paymentProduct: { connect: { id: product.id } },
              stockLocation: { connect: { id: locationId } },
              quantity: payload.initialStock,
              updatedAt: new Date(),
            },
          })
        }
      }
    }

    return this.mapProductToResponse(product)
  }

  async updateProduct(id: string, payload: Partial<PaymentProductPayload>): Promise<PaymentProductResponse> {
    const existing = await this.prisma.paymentProduct.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new NotFoundException(`Payment product with ID ${id} not found`)
    }

    // If productCode is being updated, check for conflicts
    if (payload.productCode && payload.productCode !== existing.productCode) {
      const conflict = await this.prisma.paymentProduct.findUnique({
        where: {
          tenantId_productCode: {
            tenantId: existing.tenantId,
            productCode: payload.productCode
          }
        },
      })

      if (conflict) {
        throw new ConflictException(`A product with code "${payload.productCode}" already exists`)
      }
    }

    // Calculate tax if taxId is provided or being updated
    let taxAmountCents = existing.taxAmountCents
    let amountCents = existing.amountCents
    let baseAmountCents = payload.baseAmountCents ?? existing.baseAmountCents

    const taxId = payload.taxId !== undefined ? payload.taxId : existing.taxId
    const priceIncludesTax = payload.priceIncludesTax !== undefined ? payload.priceIncludesTax : existing.priceIncludesTax

    if (taxId) {
      const tax = await this.prisma.paymentTax.findUnique({
        where: { id: taxId },
      })

      if (!tax) {
        throw new NotFoundException(`Tax with ID ${taxId} not found`)
      }

      if (priceIncludesTax) {
        // Price includes tax, so baseAmountCents (from payload/existing) is the TOTAL
        // BUT wait, existing.baseAmountCents in DB *should* be pre-tax. 
        // Logic complication: payload.baseAmountCents comes from frontend form which treats "Base Price" as "Entered Price".
        // If priceIncludesTax is true, "Entered Price" = TOTAL.
        // If priceIncludesTax is false, "Entered Price" = BASE.

        let enteredPrice = payload.baseAmountCents

        // If we didn't get a new price, we need to reconstruct the "Entered Price" from existing DB values
        // If existing product was tax-inclusive, existing.amountCents was the entered price.
        // If existing product was tax-exclusive, existing.baseAmountCents was the entered price.
        if (enteredPrice === undefined) {
          if (existing.priceIncludesTax) {
            enteredPrice = existing.amountCents
          } else {
            enteredPrice = existing.baseAmountCents
          }
        }

        // Now calculate new values from the (potentially new) entered price (TOTAL)
        amountCents = enteredPrice
        const rateMultiplier = 1 + tax.rateBps / 10_000
        const calculatedBase = Math.round(enteredPrice / rateMultiplier)

        taxAmountCents = enteredPrice - calculatedBase
        baseAmountCents = calculatedBase

      } else {
        // Price excludes tax
        // enteredPrice = BASE

        let enteredPrice = payload.baseAmountCents
        if (enteredPrice === undefined) {
          if (existing.priceIncludesTax) {
            // Switching from Inclusive -> Exclusive without changing price?
            // That's ambiguous. Assuming payload.baseAmountCents is provided if price changes.
            // If not provided, we should probably stick to existing base?
            enteredPrice = existing.baseAmountCents
          } else {
            enteredPrice = existing.baseAmountCents
          }
        }

        baseAmountCents = enteredPrice
        taxAmountCents = Math.round((enteredPrice * tax.rateBps) / 10_000)
        amountCents = enteredPrice + taxAmountCents
      }
    } else {
      // No tax
      // enteredPrice = TOTAL = BASE
      if (payload.baseAmountCents !== undefined) {
        baseAmountCents = payload.baseAmountCents
        amountCents = payload.baseAmountCents
      } else {
        // Keep existing base (which should match amount if no tax was present, or we just remove tax)
        // If we remove tax, amount should equal base
        baseAmountCents = existing.baseAmountCents
        amountCents = existing.baseAmountCents
      }
      taxAmountCents = 0
    }

    const product = await this.prisma.paymentProduct.update({
      where: { id },
      data: {
        ...(payload.productCode && { productCode: payload.productCode }),
        ...(payload.name && { name: payload.name }),
        ...(payload.description !== undefined && { description: payload.description }),
        baseAmountCents,
        taxAmountCents,
        amountCents,
        ...(payload.priceIncludesTax !== undefined && { priceIncludesTax: payload.priceIncludesTax }),
        ...(payload.currency && { currency: payload.currency }),
        ...(payload.isActive !== undefined && { isActive: payload.isActive }),
        ...(payload.taxId !== undefined && (payload.taxId
          ? { paymentTax: { connect: { id: payload.taxId } } }
          : { paymentTax: { disconnect: true } })),
        ...(payload.categoryId !== undefined && (payload.categoryId
          ? { catalogCategory: { connect: { id: payload.categoryId } } }
          : { catalogCategory: { disconnect: true } })),
        ...(payload.trackStock !== undefined && { trackStock: payload.trackStock }),
        ...(payload.metadata !== undefined && { metadata: payload.metadata as any }),
        ...(payload.images && {
          paymentProductImages: {
            deleteMany: {},
            create: payload.images?.map((img: any, index: number) => {
              if (typeof img === 'string') {
                return { id: randomUUID(), url: img, isDefault: index === 0, displayOrder: index, updatedAt: new Date() }
              }
              return {
                id: randomUUID(),
                url: img.url,
                isDefault: img.isDefault ?? index === 0,
                displayOrder: img.displayOrder ?? index,
                updatedAt: new Date(),
              }
            }) || [],
          },
        }),
      },
      include: {
        paymentTax: true,
        paymentProductImages: true,
      },
    })

    return this.mapProductToResponse(product)
  }

  async deleteProduct(id: string): Promise<void> {
    const existing = await this.prisma.paymentProduct.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new NotFoundException(`Payment product with ID ${id} not found`)
    }

    await this.prisma.paymentProduct.delete({
      where: { id },
    })
  }

  // Payment Taxes
  async getTaxes(): Promise<PaymentTaxResponse[]> {
    const taxes = await this.prisma.paymentTax.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return taxes.map(tax => this.mapTaxToResponse(tax))
  }

  async getTaxById(id: string): Promise<PaymentTaxResponse> {
    const tax = await this.prisma.paymentTax.findUnique({
      where: { id },
    })

    if (!tax) {
      throw new NotFoundException(`Payment tax with ID ${id} not found`)
    }

    return this.mapTaxToResponse(tax)
  }

  async createTax(payload: PaymentTaxPayload): Promise<PaymentTaxResponse> {
    // If this is set as default, unset other defaults for the same country/currency
    if (payload.isDefault) {
      await this.prisma.paymentTax.updateMany({
        where: {
          countryCode: payload.countryCode,
          currency: payload.currency,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const tax = await this.prisma.paymentTax.create({
      data: {
        id: randomUUID(),
        updatedAt: new Date(),
        name: payload.name,
        description: payload.description,
        countryCode: payload.countryCode,
        currency: payload.currency,
        rateBps: payload.rateBps,
        isDefault: payload.isDefault ?? false,
        metadata: (payload.metadata ?? {}) as Prisma.InputJsonValue,
      },
    })

    return this.mapTaxToResponse(tax)
  }

  async updateTax(id: string, payload: Partial<PaymentTaxPayload>): Promise<PaymentTaxResponse> {
    const existing = await this.prisma.paymentTax.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new NotFoundException(`Payment tax with ID ${id} not found`)
    }

    // If setting as default, unset other defaults
    if (payload.isDefault === true) {
      const countryCode = payload.countryCode ?? existing.countryCode
      const currency = payload.currency ?? existing.currency

      await this.prisma.paymentTax.updateMany({
        where: {
          countryCode,
          currency,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      })
    }

    const tax = await this.prisma.paymentTax.update({
      where: { id },
      data: {
        ...(payload.name && { name: payload.name }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.countryCode && { countryCode: payload.countryCode }),
        ...(payload.currency && { currency: payload.currency }),
        ...(payload.rateBps !== undefined && { rateBps: payload.rateBps }),
        ...(payload.isDefault !== undefined && { isDefault: payload.isDefault }),
        ...(payload.metadata !== undefined && { metadata: payload.metadata as Prisma.InputJsonValue }),
      },
    })

    return this.mapTaxToResponse(tax)
  }

  async deleteTax(id: string): Promise<void> {
    const existing = await this.prisma.paymentTax.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new NotFoundException(`Payment tax with ID ${id} not found`)
    }

    await this.prisma.paymentTax.delete({
      where: { id },
    })
  }

  // Helper methods
  private mapProductToResponse(product: paymentProduct & { paymentTax?: paymentTax | null }): PaymentProductResponse {
    // Check for paymentProductImages first, fall back to explicit mapping if needed
    const images = (product as any).paymentProductImages || (product as any).images || []

    return {
      id: product.id,
      productCode: product.productCode,
      name: product.name,
      description: product.description,
      amountCents: product.amountCents,
      baseAmountCents: product.baseAmountCents,
      taxAmountCents: product.taxAmountCents,
      priceIncludesTax: product.priceIncludesTax,
      currency: product.currency,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      metadata: product.metadata as Record<string, unknown> | null,
      taxId: product.taxId,
      tax: product.paymentTax ? this.mapTaxToResponse(product.paymentTax) : null,
      categoryId: product.categoryId,
      trackStock: product.trackStock,
      images: images.map((img: any) => ({
        id: img.id,
        url: img.url,
        displayOrder: img.displayOrder,
        isDefault: img.isDefault,
      })),
    }
  }

  private mapTaxToResponse(tax: paymentTax): PaymentTaxResponse {
    return {
      id: tax.id,
      name: tax.name,
      description: tax.description,
      countryCode: tax.countryCode,
      currency: tax.currency,
      rateBps: tax.rateBps,
      isDefault: tax.isDefault,
      metadata: tax.metadata as Record<string, unknown> | null,
      createdAt: tax.createdAt.toISOString(),
      updatedAt: tax.updatedAt.toISOString(),
    }
  }
}
