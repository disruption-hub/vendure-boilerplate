// NOTE: Database access removed - functions that require DB should call backend endpoints
import { getRootDomainConfig } from '@/lib/services/admin'
import { createPaymentLinkForProduct } from '@/lib/services/payments/payment-link-service'
import { syncPaymentLinkToCRM } from '@/lib/services/payments/payment-link-crm-sync'
import { createLogger } from '@/lib/utils/logger'
import type { PaymentProduct } from '../contracts'
import type {
  PaymentGateway,
  PaymentLinkSummary,
  FindExistingLinkParams,
  CreatePaymentLinkParams,
  SyncPaymentLinkParams,
} from '../contracts'

interface CachedProducts {
  expiresAt: number
  products: PaymentProduct[]
}

const PRODUCT_CACHE_TTL_MS = 60_000
const BASE_URL_CACHE_TTL_MS = 5 * 60 * 1000

const FALLBACK_ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() || 'flowcast.chat'

const logger = createLogger('payments.chatbot-gateway')

let cachedProducts: CachedProducts | null = null
const tenantBaseUrlCache = new Map<string, { value: string; expiresAt: number }>()

function normalizeHostname(candidate: string | null | undefined): string | null {
  if (!candidate || typeof candidate !== 'string') {
    return null
  }

  const trimmed = candidate.trim()
  if (!trimmed) {
    return null
  }

  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return url.host.toLowerCase()
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').split('/')[0]?.toLowerCase() || null
  }
}

function normalizeKeywordsFromMetadata(metadata: Record<string, unknown> | null): string[] {
  if (!metadata) return []
  const raw = metadata.keywords
  if (Array.isArray(raw)) {
    return raw
      .map(keyword => (typeof keyword === 'string' ? keyword.trim().toLowerCase() : ''))
      .filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map(keyword => keyword.trim().toLowerCase())
      .filter(Boolean)
  }
  return []
}

async function resolveTenantBaseUrl(tenantId: string | null | undefined): Promise<string> {
  const cacheKey = tenantId || '__default__'
  const cached = tenantBaseUrlCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  let rootDomain = FALLBACK_ROOT_DOMAIN

  try {
    rootDomain = await getRootDomainConfig()
  } catch (error) {
    logger.warn('Falling back to default root domain for payment links', {
      tenantId: tenantId ?? 'system',
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }

  // NOTE: Tenant domain lookup requires database access, which should go through backend
  // For now, use root domain as fallback
  const baseHost = rootDomain

  const absoluteUrl = `https://${baseHost.replace(/\/$/, '')}`
  const normalized = absoluteUrl.replace(/\/$/, '')

  tenantBaseUrlCache.set(cacheKey, {
    value: normalized,
    expiresAt: Date.now() + BASE_URL_CACHE_TTL_MS,
  })

  return normalized
}

async function listActiveProducts(): Promise<PaymentProduct[]> {
  if (cachedProducts && cachedProducts.expiresAt > Date.now()) {
    return cachedProducts.products
  }

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const fullUrl = `${backendUrl}/api/v1/payments/products/active`

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      logger.error('Failed to fetch products from backend', { status: response.status })
      return []
    }

    const products = await response.json()

    const normalized: PaymentProduct[] = products.map((product: any) => {
      const metadata = (product.metadata as Record<string, unknown> | null) ?? null
      const baseKeywords = [product.name, product.productCode]
        .map((value: string) => value.trim().toLowerCase())
        .filter(Boolean)
      const metadataKeywords = normalizeKeywordsFromMetadata(metadata)

      return {
        id: product.id,
        name: product.name,
        productCode: product.productCode,
        metadata,
        amountCents: product.amountCents,
        currency: product.currency,
        keywords: Array.from(new Set([...baseKeywords, ...metadataKeywords])),
      }
    })

    cachedProducts = {
      products: normalized,
      expiresAt: Date.now() + PRODUCT_CACHE_TTL_MS,
    }

    return normalized
  } catch (error) {
    logger.error('Error fetching products from backend', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      backendUrl: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
    })
    return []
  }
}

async function findExistingLink(params: FindExistingLinkParams): Promise<PaymentLinkSummary | null> {
  const { productId, sessionId, amountCents, currency, customerEmail } = params

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const queryParams = new URLSearchParams({
      productId,
      sessionId,
      amountCents: amountCents.toString(),
      currency: currency.toUpperCase(),
      ...(customerEmail ? { customerEmail } : {}),
    })

    const response = await fetch(`${backendUrl}/api/v1/payments/links/find?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      logger.error('Failed to find payment link from backend', { status: response.status })
      return null
    }

    const link = await response.json()
    
    // Handle null response (link not found) - this is now a valid 200 response
    if (!link) {
      return null
    }
    
    return {
      id: link.id,
      token: link.token,
    }
  } catch (error) {
    logger.error('Error finding payment link from backend', { error })
    return null
  }
}

function createPaymentLink(params: CreatePaymentLinkParams) {
  const { productId, ...options } = params
  // Filter out null values to match CreatePaymentLinkOptions interface
  const filteredOptions = Object.fromEntries(
    Object.entries(options).filter(([_, value]) => value !== null)
  ) as typeof options
  return createPaymentLinkForProduct(productId, filteredOptions)
}

async function syncLinkToCrm(link: Parameters<typeof syncPaymentLinkToCRM>[0], params: SyncPaymentLinkParams) {
  await syncPaymentLinkToCRM(link, params)
}

export function createChatbotPaymentGateway(): PaymentGateway {
  return {
    resolveTenantBaseUrl,
    listActiveProducts,
    findExistingLink,
    createPaymentLink,
    syncPaymentLinkToCrm: syncLinkToCrm,
  }
}
