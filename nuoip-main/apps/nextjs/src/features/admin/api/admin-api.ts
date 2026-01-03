import type {
  AdminStats,
  MemoryDetails,
  TenantRecord as Tenant,
  TenantInput as TenantPayload,
  TenantListResponse as TenantResponse,
  UserRecord as User,
  UserListResponse as UsersResponse,
  UserInput as CreateUserPayload,
  UserUpdateInput,
  CalibrationSessionSummary,
  CalibrationReportResponse,
  CalibrationAssessmentMode,
  CalibrationGroupingMode,
} from '@/lib/services/admin'
import type { FlowConfig, FlowConfigInput } from '@/lib/chatbot/flow-config/types'
import type { TenantPersonalization } from '@/lib/tenant/personalization'

export type TenantPersonalizationSettings = Partial<TenantPersonalization>

// Helper function to get auth token from localStorage (Zustand persist)
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return parsed?.state?.token || null
    }
  } catch (e) {
    console.error('Failed to get auth token:', e)
  }
  return null
}

// Helper function to make authenticated API calls to Next.js API routes
// These routes will proxy to NestJS backend with authentication
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken()
  const headers = new Headers(options.headers)

  // Add Authorization header if token exists
  // Next.js API routes will forward this to NestJS backend
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Ensure Content-Type is set for JSON requests
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  // Convert relative URLs to absolute URLs when running on the server
  let absoluteUrl = url
  if (typeof window === 'undefined' && url.startsWith('/')) {
    // Server-side: need absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      'http://localhost:3000'
    absoluteUrl = `${baseUrl}${url}`
  }

  // Call Next.js API routes (they proxy to NestJS backend)
  return fetch(absoluteUrl, {
    ...options,
    headers,
  })
}

// Re-export types for external use
export type { AdminStats, MemoryDetails }
export type { Tenant as Tenant, TenantPayload as TenantPayload }
export type { User as User, CreateUserPayload as CreateUserPayload }
export type UpdateUserRequestPayload = Partial<Omit<UserUpdateInput, 'id'>>
export interface DepartmentRecord {
  id: string
  name: string
  isDefault: boolean
}

export async function getTenantDepartments(tenantId: string): Promise<DepartmentRecord[]> {
  const url = `/api/admin/departments?tenantId=${encodeURIComponent(tenantId)}`
  const res = await authenticatedFetch(url, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (data?.success && Array.isArray(data.departments)) {
    return data.departments as DepartmentRecord[]
  }
  return []
}

export async function createDepartment(payload: { tenantId: string; name: string; description?: string; isDefault?: boolean }) {
  const res = await authenticatedFetch('/api/admin/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function updateDepartment(payload: { id: string; tenantId: string; name?: string; description?: string; isDefault?: boolean }) {
  const res = await authenticatedFetch('/api/admin/departments', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function deleteDepartment(payload: { id: string; tenantId: string }) {
  const res = await authenticatedFetch('/api/admin/departments', {
    method: 'DELETE',
    body: JSON.stringify(payload),
  })
  return res.json()
}
export type { CalibrationSessionSummary, CalibrationReportResponse }

export interface TenantChatContact {
  id: string
  tenantId: string
  type: 'BOT' | 'CONTACT' | 'GROUP'
  displayName: string
  phone?: string | null
  description?: string | null
  avatarUrl?: string | null
  isFlowbot: boolean
}

export type ChatbotAccessStatus = 'pending' | 'approved' | 'revoked'

export type TenantSignupRequestStatus = 'pending' | 'approved' | 'rejected'

export interface TenantSignupRequest {
  id: string
  companyName: string
  contactName: string
  email: string
  desiredSubdomain: string
  activationToken: string
  status: TenantSignupRequestStatus
  metadata?: Record<string, unknown> | null
  activationLink?: string | null
  createdAt: string
  updatedAt: string
}

export interface BrevoSettings {
  apiKey: string
  ccEmail?: string
}

export interface BrevoSettingsResponse {
  exists: boolean
  config: BrevoSettings | null
}

export interface OpenRouterSettings {
  apiKey: string
  baseUrl?: string
}

export interface OpenRouterSettingsResponse {
  exists: boolean
  config: OpenRouterSettings | null
}

export interface LabsMobileSettings {
  username: string
  token: string
  senderId?: string
  baseUrl?: string
}

export interface LabsMobileSettingsResponse {
  exists: boolean
  config: LabsMobileSettings | null
}

export interface RealtimeSettings {
  appId: string
  key: string
  secret: string
  publicHost: string
  publicPort: number
  internalHost?: string
  internalPort?: number
  useTLS: boolean
  enabled: boolean
}

export interface RealtimeSettingsResponse {
  exists: boolean
  config: RealtimeSettings | null
}

export interface RootDomainSettingsResponse {
  rootDomain: string
}

export interface LyraCredentialSettings {
  apiUser: string
  apiPassword: string
  publicKey: string
  hmacKey: string
  apiBaseUrl?: string
  scriptBaseUrl?: string
}

export interface LyraModeSettings {
  enabled: boolean
  credentials: LyraCredentialSettings | null
}

export interface LyraSettings {
  testMode: LyraModeSettings
  productionMode: LyraModeSettings
  activeMode: 'test' | 'production'
  language?: string
  successRedirectUrl?: string
  failureRedirectUrl?: string
  paymentMethods?: string[]
  theme?: 'neon' | 'classic'
}

export interface LyraSettingsResponse {
  exists: boolean
  config: LyraSettings | null
}

export interface AdminCalendarEventAttendee {
  email: string
  displayName: string | null
}

export interface AdminCalendarEvent {
  id: string
  title: string
  start: string
  end: string
  timeZone?: string
  location: string | null
  attendees: AdminCalendarEventAttendee[]
}

export interface AdminCalendarRange {
  start: string
  end: string
}

export interface AdminCalendarResponse {
  success: boolean
  events: AdminCalendarEvent[]
  range: AdminCalendarRange
  message?: string
}

export interface AdminLeadRecord {
  id: string
  name: string
  email: string
  phone: string
  status: string
  intent: string
  confidence: number | null
  createdAt: string
  metadata?: Record<string, unknown> | null
}

export interface AdminLeadsResponse {
  success: boolean
  leads: AdminLeadRecord[]
}

export interface ProductImage {
  id?: string
  url: string
  displayOrder: number
  isDefault: boolean
}

export interface PaymentProduct {
  id: string
  productCode: string
  name: string
  description: string
  amountCents: number
  baseAmountCents: number
  taxAmountCents: number
  priceIncludesTax: boolean
  currency: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  metadata: any
  taxId: string
  tax?: PaymentTax | null
  categoryId?: string
  trackStock?: boolean
  images?: ProductImage[]
}

export interface PaymentProductsResponse {
  success: boolean
  products: PaymentProduct[]
}

export interface PaymentProductPayload {
  productCode: string
  name: string
  description: string
  baseAmountCents: number
  currency: string
  isActive?: boolean
  metadata?: any
  taxId: string
  priceIncludesTax: boolean
  categoryId?: string
  trackStock?: boolean
  initialStock?: number
  initialStockLocationId?: string
  images?: string[] | Partial<ProductImage>[]
}

export type PaymentProductUpdatePayload = Partial<Omit<PaymentProductPayload, 'productCode'>> & {
  productCode?: string
}

export interface PaymentTax {
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

export interface PaymentTaxesResponse {
  success: boolean
  taxes: PaymentTax[]
  error?: string
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

export type PaymentTaxUpdatePayload = Partial<PaymentTaxPayload>

export type AdminPaymentLinkStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled'
export type AdminPaymentLinkChannel = 'chatbot' | 'admin' | 'api' | 'unknown'

export interface PaymentLinkProductSummary {
  id: string
  productCode: string
  name: string
  description?: string | null
  amountCents: number
  baseAmountCents: number
  taxAmountCents: number
  priceIncludesTax: boolean
  currency: string
  metadata?: Record<string, unknown> | null
  taxId?: string | null
  taxRateBps?: number | null
  taxName?: string | null
}

export interface PaymentLinkRecord {
  id: string
  token: string
  productId: string
  channel: AdminPaymentLinkChannel
  taxId?: string | null
  amountCents: number
  baseAmountCents: number
  taxAmountCents: number
  taxRateBps?: number | null
  currency: string
  status: AdminPaymentLinkStatus
  customerName?: string | null
  customerEmail?: string | null
  expiresAt?: string | null
  completedAt?: string | null
  lastStatusChangeAt?: string | null
  formToken?: string | null
  formTokenExpiresAt?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  product: PaymentLinkProductSummary
}

export interface PaymentCurrencySummary {
  currency: string
  linkCount: number
  totalAmountCents: number
  completedAmountCents: number
  completedCount: number
  averageTicketCents: number
}

export interface PaymentStatusBreakdownItem {
  status: AdminPaymentLinkStatus
  count: number
}

export interface PaymentChannelBreakdownItem {
  channel: AdminPaymentLinkChannel
  count: number
}

export interface PaymentReportSummary {
  totals: {
    totalLinks: number
    completedLinks: number
    completionRate: number
    totalAmountCents: number
    completedAmountCents: number
    averageTicketCents: number
    currencyTotals: PaymentCurrencySummary[]
  }
  statusBreakdown: PaymentStatusBreakdownItem[]
  channelBreakdown: PaymentChannelBreakdownItem[]
  recentLinks: PaymentLinkRecord[]
  generatedAt: string
}

export interface PaymentLinksResponse {
  success: boolean
  links: PaymentLinkRecord[]
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

export interface AdminError extends Error {
  status?: number
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      const text = await response.text().catch(() => '')
      console.error('Received HTML response instead of JSON:', text.substring(0, 200))
      const error: AdminError = new Error('The server returned an error page. Please try again later.')
      error.status = response.status
      throw error
    }

    // Try to extract error message from response body
    let errorMessage = response.statusText || 'Request failed'
    try {
      // First try to get text (response body can only be read once)
      const text = await response.text().catch(() => '')

      // Check if text contains HTML
      if (text && (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<!--'))) {
        console.error('Response body contains HTML:', text.substring(0, 200))
        errorMessage = 'The server returned an error page. Please try again later.'
      } else if (text) {
        // Try to parse as JSON (might be a JSON string)
        try {
          const parsed = JSON.parse(text)
          if (typeof parsed === 'string') {
            // If parsed result is a string, try parsing again (nested JSON string)
            try {
              const nestedParsed = JSON.parse(parsed)
              if (nestedParsed.message) {
                errorMessage = nestedParsed.message
              } else if (nestedParsed.error) {
                errorMessage = typeof nestedParsed.error === 'string' ? nestedParsed.error : nestedParsed.error.message || errorMessage
              }
            } catch {
              // Check if parsed string contains HTML
              if (parsed.includes('<!DOCTYPE') || parsed.includes('<html')) {
                errorMessage = 'The server returned an error page. Please try again later.'
              } else {
                errorMessage = parsed
              }
            }
          } else if (parsed.message) {
            errorMessage = parsed.message
          } else if (parsed.error) {
            errorMessage = typeof parsed.error === 'string' ? parsed.error : parsed.error.message || errorMessage
          }
        } catch {
          // Not JSON, use text as-is (truncate if too long, but sanitize HTML)
          if (text.length > 200) {
            errorMessage = text.substring(0, 200) + '...'
          } else {
            errorMessage = text
          }
        }
      }
    } catch {
      // Use default error message
    }

    // Final check: sanitize error message if it contains HTML
    if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html') || errorMessage.includes('<!--')) {
      errorMessage = 'The server returned an error page. Please try again later.'
    }

    const error: AdminError = new Error(errorMessage)
    error.status = response.status
    throw error
  }

  // Clone response to read body again for successful responses
  const clonedResponse = response.clone()
  return clonedResponse.json() as Promise<T>
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await authenticatedFetch('/api/admin/system-stats')
  return handleJsonResponse<AdminStats>(response)
}

export async function getMemoryDetails(): Promise<MemoryDetails> {
  const response = await authenticatedFetch('/api/admin/memory')
  return handleJsonResponse<MemoryDetails>(response)
}

export async function getTenants(): Promise<TenantResponse> {
  const response = await authenticatedFetch('/api/admin/tenants')
  return handleJsonResponse<TenantResponse>(response)
}

export async function createTenant(payload: TenantPayload): Promise<Tenant> {
  const response = await authenticatedFetch('/api/admin/tenants', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return handleJsonResponse<Tenant>(response)
}

export async function getTenant(id: string): Promise<Tenant> {
  const response = await authenticatedFetch(`/api/admin/tenants/${id}`, {
    method: 'GET',
  })

  return handleJsonResponse<Tenant>(response)
}

export async function updateTenant(id: string, payload: TenantPayload): Promise<Tenant> {
  const response = await authenticatedFetch(`/api/admin/tenants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  return handleJsonResponse<Tenant>(response)
}

export async function deleteTenant(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/tenants/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error: AdminError = new Error(response.statusText || 'Failed to delete tenant')
    error.status = response.status
    throw error
  }
}

export async function getUsers(): Promise<UsersResponse> {
  const response = await authenticatedFetch('/api/admin/users')
  return handleJsonResponse<UsersResponse>(response)
}

export async function getTenantChatContacts(tenantId: string): Promise<TenantChatContact[]> {
  if (!tenantId?.trim()) {
    return []
  }

  try {
    const response = await authenticatedFetch(`/api/admin/tenants/${encodeURIComponent(tenantId)}/contacts`)

    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      const text = await response.text()
      console.error('Received HTML response instead of JSON:', text.substring(0, 200))
      throw new Error('Failed to load contacts. The server returned an error page.')
    }

    const payload = await handleJsonResponse<{ success: boolean; contacts: TenantChatContact[] }>(response)

    if (!payload.success || !Array.isArray(payload.contacts)) {
      throw new Error('Unable to load tenant contacts')
    }

    return payload.contacts
  } catch (error) {
    // If error message contains HTML, sanitize it
    if (error instanceof Error) {
      const message = error.message
      if (message.includes('<!DOCTYPE') || message.includes('<html') || message.includes('<!--')) {
        throw new Error('Failed to load contacts. Please try again later.')
      }
    }
    throw error
  }
}

export async function getTenantSignupRequests(
  status: TenantSignupRequestStatus | 'all' = 'pending',
): Promise<TenantSignupRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  const response = await authenticatedFetch(`/api/admin/tenant-requests${query}`)
  const payload = await handleJsonResponse<{ success: boolean; requests: TenantSignupRequest[] }>(response)

  if (!payload.success || !Array.isArray(payload.requests)) {
    throw new Error('Unable to load tenant signup requests')
  }

  return payload.requests
}

export async function updateTenantSignupRequest(
  id: string,
  action: 'approve' | 'reject',
  options?: { reason?: string },
): Promise<TenantSignupRequest> {
  const response = await authenticatedFetch(`/api/admin/tenant-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ action, reason: options?.reason }),
  })

  const payload = await handleJsonResponse<TenantSignupRequest>(response)
  return payload
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await authenticatedFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; user: User }>(response)
  return data.user
}

export async function updateUser(id: string, payload: UpdateUserRequestPayload): Promise<User> {
  const response = await authenticatedFetch(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<User>(response)
  return data
}

export async function deleteUser(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error: AdminError = new Error(response.statusText || 'Failed to delete user')
    error.status = response.status
    throw error
  }
}

export async function revokeUserSessions(userId: string): Promise<void> {
  const response = await authenticatedFetch('/api/admin/users/revoke-sessions', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    const error: AdminError = new Error(response.statusText || 'Failed to revoke sessions')
    error.status = response.status
    throw error
  }
}

export async function getBrevoSettings(): Promise<BrevoSettingsResponse> {
  const response = await authenticatedFetch('/api/admin/system/brevo')
  return handleJsonResponse<BrevoSettingsResponse>(response)
}

export async function updateBrevoSettings(payload: BrevoSettings): Promise<BrevoSettings> {
  const response = await authenticatedFetch('/api/admin/system/brevo', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; config: BrevoSettings }>(response)
  return data.config
}

export async function getOpenRouterSettings(): Promise<OpenRouterSettingsResponse> {
  const response = await authenticatedFetch('/api/admin/system/openrouter')
  return handleJsonResponse<OpenRouterSettingsResponse>(response)
}

export async function updateOpenRouterSettings(payload: OpenRouterSettings): Promise<OpenRouterSettings> {
  const response = await authenticatedFetch('/api/admin/system/openrouter', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; config: OpenRouterSettings }>(response)
  return data.config
}

export async function getLabsMobileSettings(): Promise<LabsMobileSettingsResponse> {
  const response = await authenticatedFetch('/api/admin/system/labsmobile')
  return handleJsonResponse<LabsMobileSettingsResponse>(response)
}

export async function updateLabsMobileSettings(payload: LabsMobileSettings): Promise<LabsMobileSettings> {
  const response = await authenticatedFetch('/api/admin/system/labsmobile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; config: LabsMobileSettings }>(response)
  return data.config
}

export async function getRealtimeSettings(): Promise<RealtimeSettingsResponse> {
  const response = await authenticatedFetch('/api/admin/system/realtime')
  return handleJsonResponse<RealtimeSettingsResponse>(response)
}

export async function updateRealtimeSettings(payload: RealtimeSettings): Promise<RealtimeSettings> {
  const response = await authenticatedFetch('/api/admin/system/realtime', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; config: RealtimeSettings }>(response)
  return data.config
}

export async function getRootDomainSettings(): Promise<RootDomainSettingsResponse> {
  const response = await authenticatedFetch('/api/admin/system/root-domain')
  return handleJsonResponse<RootDomainSettingsResponse>(response)
}

export async function updateRootDomainSettings(rootDomain: string): Promise<RootDomainSettingsResponse> {
  const response = await authenticatedFetch('/api/admin/system/root-domain', {
    method: 'PUT',
    body: JSON.stringify({ rootDomain }),
  })

  return handleJsonResponse<RootDomainSettingsResponse>(response)
}

export async function getLyraSettings(): Promise<LyraSettingsResponse> {
  const response = await authenticatedFetch('/api/admin/system/lyra')
  return handleJsonResponse<LyraSettingsResponse>(response)
}

export async function updateLyraSettings(payload: LyraSettings): Promise<LyraSettings> {
  const response = await authenticatedFetch('/api/admin/system/lyra', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; config: LyraSettings }>(response)
  return data.config
}

export interface TenantPersonalizationResponse {
  personalization?: TenantPersonalizationSettings
}

export async function getTenantPersonalization(tenantId: string): Promise<TenantPersonalizationResponse> {
  try {
    const response = await authenticatedFetch(`/api/admin/tenant/preferences?tenantId=${tenantId}`)
    // Handle 404 gracefully - return empty personalization
    if (response.status === 404) {
      return { personalization: null } as TenantPersonalizationResponse
    }
    return handleJsonResponse<TenantPersonalizationResponse>(response)
  } catch (error) {
    // Return empty personalization on error
    console.warn('Failed to fetch tenant personalization, using fallback:', error)
    return { personalization: null } as TenantPersonalizationResponse
  }
}

export async function updateTenantPersonalization(tenantId: string, personalization: TenantPersonalizationSettings): Promise<TenantPersonalizationResponse> {
  const response = await authenticatedFetch('/api/admin/tenant/preferences', {
    method: 'PUT',
    body: JSON.stringify({ tenantId, personalization }),
  })

  return handleJsonResponse<TenantPersonalizationResponse>(response)
}


export async function getAdminCalendarEvents(params: {
  view?: 'day' | 'week' | 'month'
  date?: string
  tenantId?: string
} = {}): Promise<AdminCalendarResponse> {
  const searchParams = new URLSearchParams()
  if (params.view) {
    searchParams.set('view', params.view)
  }
  if (params.date) {
    searchParams.set('date', params.date)
  }
  if (params.tenantId) {
    searchParams.set('tenantId', params.tenantId)
  }

  const query = searchParams.toString()
  const response = await authenticatedFetch(`/api/admin/calendar/events${query ? `?${query}` : ''}`)
  return handleJsonResponse<AdminCalendarResponse>(response)
}

export async function getAdminLeads(limit?: number): Promise<AdminLeadsResponse> {
  const searchParams = new URLSearchParams()
  if (typeof limit === 'number') {
    searchParams.set('limit', String(limit))
  }

  const query = searchParams.toString()
  const response = await authenticatedFetch(`/api/admin/leads${query ? `?${query}` : ''}`)
  return handleJsonResponse<AdminLeadsResponse>(response)
}

export async function getPaymentProducts(): Promise<PaymentProductsResponse> {
  const response = await authenticatedFetch('/api/admin/payments/products')
  return handleJsonResponse<PaymentProductsResponse>(response)
}

export async function createPaymentProductApi(payload: PaymentProductPayload): Promise<PaymentProduct> {
  const response = await authenticatedFetch('/api/admin/payments/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; product: PaymentProduct }>(response)
  return data.product
}

export async function updatePaymentProductApi(id: string, payload: PaymentProductUpdatePayload): Promise<PaymentProduct> {
  const response = await authenticatedFetch(`/api/admin/payments/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; product: PaymentProduct }>(response)
  return data.product
}

export async function deletePaymentProductApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/payments/products/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error: AdminError = new Error(response.statusText || 'Failed to delete payment product')
    error.status = response.status
    throw error
  }
}

export async function getPaymentTaxes(): Promise<PaymentTaxesResponse> {
  const response = await authenticatedFetch('/api/admin/payments/taxes')
  return handleJsonResponse<PaymentTaxesResponse>(response)
}

export async function createPaymentTaxApi(payload: PaymentTaxPayload): Promise<PaymentTax> {
  const response = await authenticatedFetch('/api/admin/payments/taxes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; tax: PaymentTax }>(response)
  return data.tax
}

export async function updatePaymentTaxApi(id: string, payload: PaymentTaxUpdatePayload): Promise<PaymentTax> {
  const response = await authenticatedFetch(`/api/admin/payments/taxes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; tax: PaymentTax }>(response)
  return data.tax
}

export async function deletePaymentTaxApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/payments/taxes/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error: AdminError = new Error(response.statusText || 'Failed to delete payment tax')
    error.status = response.status
    throw error
  }
}

export async function getPaymentLinks(params: {
  status?: AdminPaymentLinkStatus | 'all'
  search?: string
  limit?: number
} = {}): Promise<PaymentLinksResponse> {
  const searchParams = new URLSearchParams()
  if (params.status) {
    searchParams.set('status', params.status)
  }
  if (params.search) {
    searchParams.set('search', params.search)
  }
  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit))
  }

  const query = searchParams.toString()
  const response = await authenticatedFetch(`/api/admin/payments/links${query ? `?${query}` : ''}`)
  return handleJsonResponse<PaymentLinksResponse>(response)
}

export async function getPaymentReports(params: {
  tenantId?: string
  limit?: number
  days?: number
} = {}): Promise<PaymentReportSummary> {
  const query = new URLSearchParams()

  if (params.tenantId) {
    query.set('tenantId', params.tenantId)
  }

  if (params.limit && Number.isFinite(params.limit)) {
    query.set('limit', String(params.limit))
  }

  if (params.days && Number.isFinite(params.days)) {
    query.set('days', String(params.days))
  }

  const suffix = query.size ? `?${query.toString()}` : ''
  const response = await authenticatedFetch(`/api/admin/payments/reports${suffix}`)
  const data = await handleJsonResponse<{ success: boolean; summary: PaymentReportSummary }>(response)
  return data.summary
}

export async function createPaymentLinkApi(payload: PaymentLinkPayload): Promise<PaymentLinkRecord> {
  const response = await authenticatedFetch('/api/admin/payments/links', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ success: boolean; link: PaymentLinkRecord }>(response)
  return data.link
}

export async function updatePaymentLinkStatusApi(
  id: string,
  status: AdminPaymentLinkStatus,
): Promise<PaymentLinkRecord> {
  const response = await authenticatedFetch(`/api/admin/payments/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

  const data = await handleJsonResponse<{ success: boolean; link: PaymentLinkRecord }>(response)
  return data.link
}

export async function deletePaymentLinkApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/payments/links/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error: AdminError = new Error(response.statusText || 'Failed to delete payment link')
    error.status = response.status
    throw error
  }
}

export type ScheduleRecurringType = 'daily' | 'weekly' | 'monthly'

export interface ScheduleSlotInput {
  startTime: string
  endTime: string
  duration?: number
  bufferTime?: number
  maxBookings?: number | null
  priority?: number
}

export interface ScheduleTemplateInput {
  name: string
  description?: string | null
  tenantId?: string
  isActive?: boolean
  recurringType: ScheduleRecurringType
  recurringDays: number[]
  timeZone: string
  slots: ScheduleSlotInput[]
}

export interface ScheduleTemplate extends Omit<ScheduleTemplateInput, 'slots'> {
  id: string
  createdAt: string
  updatedAt: string
  slots: Array<ScheduleSlotInput & { id: string; isActive: boolean; createdAt: string; updatedAt: string }>
  exceptions: Array<{
    id: string
    exceptionType: 'blocked' | 'modified' | 'additional'
    date: string
    startTime?: string | null
    endTime?: string | null
    newStartTime?: string | null
    newEndTime?: string | null
    reason?: string | null
  }>
}

export interface ScheduleExceptionInput {
  templateId: string
  date: string
  startTime?: string | null
  endTime?: string | null
  exceptionType?: 'blocked' | 'modified' | 'additional'
  reason?: string | null
}

export interface ScheduleExceptionResponse {
  success: boolean
  exception: {
    id: string
    templateId: string | null
    exceptionType: 'blocked' | 'modified' | 'additional'
    date: string
    startTime?: string | null
    endTime?: string | null
    newStartTime?: string | null
    newEndTime?: string | null
    reason?: string | null
  }
}

export async function getScheduleTemplates(tenantId?: string): Promise<ScheduleTemplate[]> {
  const params = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''
  const response = await authenticatedFetch(`/api/admin/schedule${params}`)
  const data = await response.json()

  if (!response.ok || data?.success !== true) {
    const message = typeof data?.error === 'string' ? data.error : 'Failed to fetch schedule templates'
    const error: AdminError = new Error(message)
    error.status = response.status
    throw error
  }

  return Array.isArray(data.data) ? (data.data as ScheduleTemplate[]) : []
}

export async function createScheduleTemplate(payload: ScheduleTemplateInput): Promise<ScheduleTemplate> {
  const response = await authenticatedFetch('/api/admin/schedule', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok || data?.success !== true) {
    const message = typeof data?.error === 'string' ? data.error : 'Failed to create schedule template'
    const error: AdminError = new Error(message)
    error.status = response.status
    throw error
  }

  return data.data as ScheduleTemplate
}

export async function updateScheduleTemplate(id: string, payload: Partial<ScheduleTemplateInput>): Promise<ScheduleTemplate> {
  const response = await authenticatedFetch(`/api/admin/schedule/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok || data?.success !== true) {
    const message = typeof data?.error === 'string' ? data.error : 'Failed to update schedule template'
    const error: AdminError = new Error(message)
    error.status = response.status
    throw error
  }

  return data.data as ScheduleTemplate
}

export async function deleteScheduleTemplate(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/schedule/${id}`, {
    method: 'DELETE',
  })

  let data: any = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok || data?.success !== true) {
    const message = typeof data?.error === 'string' ? data.error : 'Failed to delete schedule template'
    const error: AdminError = new Error(message)
    error.status = response.status
    throw error
  }
}

export async function createScheduleException(payload: ScheduleExceptionInput): Promise<ScheduleExceptionResponse> {
  const response = await authenticatedFetch('/api/admin/schedule/exception', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return handleJsonResponse<ScheduleExceptionResponse>(response)
}

export async function deleteScheduleException(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/schedule/exception/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'Failed to delete schedule exception')
    const error: AdminError = new Error(text || 'Failed to delete schedule exception')
    error.status = response.status
    throw error
  }
}

export async function getCalibrationSessions(limit = 10): Promise<CalibrationSessionSummary[]> {
  const params = new URLSearchParams()
  if (typeof limit === 'number') {
    params.set('limit', String(limit))
  }

  const query = params.toString()
  const response = await authenticatedFetch(`/api/admin/calibration/sessions${query ? `?${query}` : ''}`)
  const data = await handleJsonResponse<{ sessions: CalibrationSessionSummary[] }>(response)
  return data.sessions
}

export interface FlowCalibrationReportParams {
  mode?: CalibrationAssessmentMode
  grouping?: CalibrationGroupingMode
  sessionId?: string
  tenantId?: string
  targetDate?: string
  startDate?: string
  endDate?: string
  includeUnobservedExpected?: boolean
  summarizeWithLLM?: boolean
}

export async function getFlowCalibrationReport(params: FlowCalibrationReportParams): Promise<CalibrationReportResponse> {
  const searchParams = new URLSearchParams()

  if (params.sessionId) {
    searchParams.set('sessionId', params.sessionId)
  }
  if (params.tenantId) {
    searchParams.set('tenantId', params.tenantId)
  }
  if (params.mode) {
    searchParams.set('mode', params.mode)
  }
  if (params.grouping) {
    searchParams.set('grouping', params.grouping)
  }
  if (params.targetDate) {
    searchParams.set('targetDate', params.targetDate)
  }
  if (params.startDate) {
    searchParams.set('startDate', params.startDate)
  }
  if (params.endDate) {
    searchParams.set('endDate', params.endDate)
  }
  if (params.includeUnobservedExpected) {
    searchParams.set('includeUnobservedExpected', 'true')
  }
  if (params.summarizeWithLLM) {
    searchParams.set('summarizeWithLLM', 'true')
  }

  const query = searchParams.toString()
  const response = await authenticatedFetch(`/api/admin/calibration/report${query ? `?${query}` : ''}`)
  return handleJsonResponse<CalibrationReportResponse>(response)
}

export async function getChatbotFlowConfig(): Promise<FlowConfig> {
  const response = await authenticatedFetch('/api/admin/chatbot/flow')
  const data = await handleJsonResponse<{ config: FlowConfig }>(response)
  return data.config
}

export async function updateChatbotFlowConfig(payload: FlowConfigInput): Promise<FlowConfig> {
  const response = await authenticatedFetch('/api/admin/chatbot/flow', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const data = await handleJsonResponse<{ config: FlowConfig }>(response)
  return data.config
}

// ----------------------------------------------------------------------
// Catalog Categories API
// ----------------------------------------------------------------------

export type CatalogItemType = 'PRODUCT' | 'SERVICE'

export interface CatalogCategory {
  id: string
  tenantId: string
  name: string
  description: string | null
  type: CatalogItemType
  parentId: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  parent?: CatalogCategory
  children?: CatalogCategory[]
  _count?: {
    paymentProducts: number
    children: number
  }
}

export interface CreateCategoryPayload {
  name: string
  description?: string
  type: CatalogItemType
  parentId?: string
  metadata?: Record<string, unknown>
}

export interface UpdateCategoryPayload {
  name?: string
  description?: string
  type?: CatalogItemType
  parentId?: string
  metadata?: Record<string, unknown>
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const res = await authenticatedFetch('/api/admin/catalog/categories', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch categories')
  }
  return res.json()
}

export async function createCatalogCategory(data: CreateCategoryPayload): Promise<CatalogCategory> {
  const res = await authenticatedFetch('/api/admin/catalog/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to create category')
  }

  return res.json()
}

export async function updateCatalogCategory(id: string, data: UpdateCategoryPayload): Promise<CatalogCategory> {
  const res = await authenticatedFetch(`/api/admin/catalog/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to update category')
  }

  return res.json()
}

export async function deleteCatalogCategory(id: string): Promise<void> {
  const res = await authenticatedFetch(`/api/admin/catalog/categories/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to delete category')
  }
}

// ----------------------------------------------------------------------
// Inventory API
// ----------------------------------------------------------------------

export interface StockLocation {
  id: string
  tenantId: string
  name: string
  description: string | null
  isDefault: boolean
  address: string | null
  isActive: boolean
  type: 'PHYSICAL' | 'DIGITAL'
  createdAt: string
  updatedAt: string
}

export interface StockEntry {
  id: string
  productId: string
  locationId: string
  quantity: number
  reserved: number
  available: number
  isUnlimited: boolean
  location?: StockLocation
}

export interface CreateStockLocationPayload {
  name: string
  description?: string
  isDefault?: boolean
  address?: string
  type?: 'PHYSICAL' | 'DIGITAL'
}

export interface UpdateStockLocationPayload {
  name?: string
  description?: string
  isDefault?: boolean
  address?: string
  isActive?: boolean
  type?: 'PHYSICAL' | 'DIGITAL'
}

export interface AdjustStockPayload {
  productId: string
  locationId: string
  quantityChange?: number
  reservedChange?: number
  reason?: string
  referenceId?: string
  isUnlimited?: boolean
}

export async function getStockLocations(): Promise<StockLocation[]> {
  const res = await authenticatedFetch('/api/catalog/inventory/locations', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch stock locations')
  }
  return res.json()
}

export async function createStockLocation(data: CreateStockLocationPayload): Promise<StockLocation> {
  const res = await authenticatedFetch('/api/catalog/inventory/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to create stock location')
  }
  return res.json()
}

export async function updateStockLocation(id: string, data: UpdateStockLocationPayload): Promise<StockLocation> {
  const res = await authenticatedFetch(`/api/catalog/inventory/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to update stock location')
  }
  return res.json()
}

export async function deleteStockLocation(id: string): Promise<void> {
  const res = await authenticatedFetch(`/api/catalog/inventory/locations/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to delete stock location')
  }
}

export async function getProductStock(productId: string): Promise<StockEntry[]> {
  const res = await authenticatedFetch(`/api/catalog/inventory/stock/${productId}`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch product stock')
  }
  return res.json()
}

export async function adjustStock(data: AdjustStockPayload): Promise<StockEntry> {
  const res = await authenticatedFetch('/api/catalog/inventory/stock/adjust', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    // Handle 401 errors gracefully without triggering logout
    if (res.status === 401) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.message || 'Authentication required. Please refresh the page and try again.')
    }
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to adjust stock')
  }
  return res.json()
}

export interface ProductWithStock {
  id: string
  name: string
  productCode: string
  trackStock: boolean
  category?: {
    id: string
    name: string
    type: 'PRODUCT' | 'SERVICE'
  } | null
  stocks: StockEntry[]
}

export async function getAllProductsWithStock(): Promise<ProductWithStock[]> {
  const res = await authenticatedFetch('/api/catalog/inventory/products', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch products with stock')
  }
  return res.json()
}

export interface StockMovement {
  id: string
  tenantId: string
  productId: string
  product: {
    id: string
    name: string
    productCode: string
  }
  locationId?: string | null
  location?: {
    id: string
    name: string
  } | null
  fromLocationId?: string | null
  fromLocation?: {
    id: string
    name: string
  } | null
  toLocationId?: string | null
  toLocation?: {
    id: string
    name: string
  } | null
  type: 'ADJUSTMENT' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'RESERVATION' | 'RELEASE' | 'SALE' | 'RETURN'
  quantityChange: number
  reservedChange: number
  quantityBefore: number
  quantityAfter: number
  reservedBefore: number
  reservedAfter: number
  reason?: string | null
  referenceId?: string | null
  performedById?: string | null
  createdAt: string
}

export async function getStockMovements(filters?: { productId?: string; locationId?: string; limit?: number }): Promise<StockMovement[]> {
  const params = new URLSearchParams()
  if (filters?.productId) params.append('productId', filters.productId)
  if (filters?.locationId) params.append('locationId', filters.locationId)
  if (filters?.limit) params.append('limit', filters.limit.toString())

  const queryString = params.toString()
  const url = queryString ? `/api/catalog/inventory/movements?${queryString}` : '/api/catalog/inventory/movements'
  const res = await authenticatedFetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch stock movements')
  }
  return res.json()
}

// ----------------------------------------------------------------------
// Delivery API
// ----------------------------------------------------------------------

export interface DeliveryMethod {
  id: string
  tenantId: string
  name: string
  description?: string
  priceCents: number
  currency: string
  isActive: boolean
  rules?: DeliveryPriceRule[]
  createdAt: string
  updatedAt: string
}

export interface DeliveryPriceRule {
  id: string
  deliveryMethodId: string
  condition: string
  value: number
  priceCents: number
}

export interface CreateDeliveryMethodPayload {
  name: string
  description?: string
  priceCents: number
  currency?: string
  isActive?: boolean
  rules?: {
    condition: string
    value: number
    priceCents: number
  }[]
}

export async function getDeliveryMethods(): Promise<DeliveryMethod[]> {
  const res = await authenticatedFetch('/api/admin/delivery/methods', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch delivery methods')
  return res.json()
}

export async function createDeliveryMethod(data: CreateDeliveryMethodPayload): Promise<DeliveryMethod> {
  const res = await authenticatedFetch('/api/admin/delivery/methods', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create delivery method')
  return res.json()
}

export async function updateDeliveryMethod(id: string, data: Partial<CreateDeliveryMethodPayload>): Promise<DeliveryMethod> {
  const res = await authenticatedFetch(`/api/admin/delivery/methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update delivery method')
  return res.json()
}

export async function deleteDeliveryMethod(id: string): Promise<void> {
  const res = await authenticatedFetch(`/api/admin/delivery/methods/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete delivery method')
}



