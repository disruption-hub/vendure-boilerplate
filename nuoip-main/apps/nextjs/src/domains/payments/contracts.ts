import type { PaymentLinkRecord } from '@/lib/services/payments/payment-link-service'

export interface PaymentProduct {
  id: string
  name: string
  productCode: string
  keywords: string[]
  amountCents: number
  currency: string
  metadata: Record<string, unknown> | null
}

export interface PaymentLinkSummary {
  id: string
  token: string
}

export interface EnsurePaymentLinkParams {
  productId: string
  sessionId: string
  tenantId?: string | null
  amountCents: number
  currency: string
  customerName?: string | null
  customerEmail?: string | null
  metadata?: Record<string, unknown>
  selectedCustomerId?: string | null
  selectedCustomerType?: 'lead' | 'contact' | null
}

export interface EnsurePaymentLinkResult {
  linkId: string
  token: string
  existing: boolean
}

export interface FindExistingLinkParams {
  productId: string
  sessionId: string
  amountCents: number
  currency: string
  customerEmail: string | null
}

export interface CreatePaymentLinkParams {
  productId: string
  sessionId: string
  tenantId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  metadata?: Record<string, unknown>
}

export interface SyncPaymentLinkParams {
  sessionId?: string | null
  tenantId?: string | null
  selectedCustomerId?: string | null
  selectedCustomerType?: 'lead' | 'contact' | null
}

export interface PaymentGateway {
  resolveTenantBaseUrl(tenantId: string | null | undefined): Promise<string>
  listActiveProducts(): Promise<PaymentProduct[]>
  findExistingLink(params: FindExistingLinkParams): Promise<PaymentLinkSummary | null>
  createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkRecord>
  syncPaymentLinkToCrm(link: PaymentLinkRecord, params: SyncPaymentLinkParams): Promise<void>
}

export interface PaymentFacade {
  resolveTenantBaseUrl(tenantId: string | null | undefined): Promise<string>
  listActiveProducts(): Promise<PaymentProduct[]>
  ensurePaymentLink(params: EnsurePaymentLinkParams): Promise<EnsurePaymentLinkResult>
}
