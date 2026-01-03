import { authenticatedFetch } from '@/features/admin/api/admin-api'

export type CommunicationChannel = 'EMAIL' | 'SMS' | 'TELEGRAM' | 'WHATSAPP' | 'INSTAGRAM'

export interface CommunicationConfigChannel {
  id: number
  channel: CommunicationChannel
  provider: string
  isEnabled: boolean
  credentials?: Record<string, unknown> | null
  settings?: Record<string, unknown> | null
}

export interface CommunicationConfigResponse {
  success: boolean
  config: {
    id: number
    tenantId?: string | null
    name?: string | null
    isActive: boolean
    defaultFromEmail?: string | null
    defaultFromName?: string | null
    defaultReplyToEmail?: string | null
    adminEmail?: string | null
    channels: CommunicationConfigChannel[]
  }
}

export interface UpdateCommunicationConfigPayload {
  name?: string | null
  isActive?: boolean
  defaultFromEmail?: string | null
  defaultFromName?: string | null
  defaultReplyToEmail?: string | null
  adminEmail?: string | null
  metadata?: Record<string, unknown> | null
  channels?: Array<{
    channel: CommunicationChannel
    provider?: string
    isEnabled?: boolean
    credentials?: Record<string, unknown> | null
    settings?: Record<string, unknown> | null
  }>
}

export interface CommunicationMetricsResponse {
  success: boolean
  messagesSent24h: {
    total: number
    email: number
    sms: number
    telegram: number
    whatsapp: number
    instagram: number
  }
  deliveryRate: Record<string, number>
  recentErrors: Array<{
    id: string
    templateId: number | null
    templateName: string | null
    errorMessage: string | null
    timestamp: string
  }>
  messageVolume7d: Array<{
    date: string
    email: number
    sms: number
    telegram: number
    whatsapp: number
    instagram: number
  }>
  activeWorkflows: number
  configuredTemplates: number
  systemHealth: {
    status: string
    score: number
    issues: string[]
  }
}

export interface SendCommunicationPayload {
  channel: CommunicationChannel
  recipients: string[]
  subject?: string
  message?: string
  html?: string
  text?: string
  templateKey?: string
}

export interface SendCommunicationResponse {
  success: boolean
  summary: {
    total: number
    success: number
    failed: number
  }
  results: Array<{ recipient: string; success: boolean; error?: string }>
}

export interface CommunicationTemplateTranslation {
  id: number
  language: string
  subject?: string | null
  content: string
  createdAt: string
  updatedAt: string
}

export interface CommunicationTemplateRecord {
  id: number
  configId: number | null
  templateKey: string
  name: string
  description?: string | null
  channel: CommunicationChannel
  category?: string | null
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
  translations: CommunicationTemplateTranslation[]
}

export interface ListTemplatesResponse {
  success: boolean
  templates: CommunicationTemplateRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CommunicationComponentCategorySummary {
  id: number
  name: string
  description?: string | null
  icon?: string | null
  sortOrder: number
  componentCount: number
}

export interface CommunicationComponentSummary {
  id: number
  componentKey: string
  name: string
  description?: string | null
  channel?: CommunicationChannel | null
  componentType: string
  markup?: string | null
  variables?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  previewImage?: string | null
  categoryId?: number | null
  isActive: boolean
}

export interface TemplateCompositionItem {
  id: number
  componentId: number
  order: number
  slot?: string | null
  settings?: Record<string, unknown> | null
  component: CommunicationComponentSummary
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Request failed'
    throw new Error(message)
  }
  return data as T
}

export async function fetchCommunicationConfig(): Promise<CommunicationConfigResponse> {
  const response = await authenticatedFetch('/api/admin/communications/config')
  return handleResponse(response)
}

export async function updateCommunicationConfigRequest(payload: UpdateCommunicationConfigPayload): Promise<CommunicationConfigResponse> {
  const response = await authenticatedFetch('/api/admin/communications/config', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function fetchCommunicationMetrics(): Promise<CommunicationMetricsResponse> {
  const response = await authenticatedFetch('/api/admin/communications/dashboard/metrics', {
    cache: 'no-store',
  })
  return handleResponse(response)
}

export async function sendCommunicationMessage(payload: SendCommunicationPayload): Promise<SendCommunicationResponse> {
  const response = await authenticatedFetch('/api/admin/communications/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function listCommunicationTemplates(page = 1): Promise<ListTemplatesResponse> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', '20')
  const response = await authenticatedFetch(`/api/admin/communications/templates?${params.toString()}`)
  return handleResponse(response)
}

export async function createCommunicationTemplate(payload: Partial<CommunicationTemplateRecord> & { translations: CommunicationTemplateTranslation[] }): Promise<{ success: boolean; template: CommunicationTemplateRecord }> {
  const response = await authenticatedFetch('/api/admin/communications/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function updateCommunicationTemplateRequest(id: number, payload: Partial<CommunicationTemplateRecord> & { translations?: CommunicationTemplateTranslation[] }): Promise<{ success: boolean; template: CommunicationTemplateRecord }> {
  const response = await authenticatedFetch(`/api/admin/communications/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function deleteCommunicationTemplateRequest(id: number): Promise<{ success: boolean }> {
  const response = await authenticatedFetch(`/api/admin/communications/templates/${id}`, {
    method: 'DELETE',
  })
  return handleResponse(response)
}

export async function renderTemplatePreview(payload: { templateId?: number; templateKey?: string; language?: string; variables?: Record<string, unknown> }): Promise<{
  success: boolean
  html: string
  subject: string | null
  languageUsed: string
}> {
  const response = await authenticatedFetch('/api/admin/communications/templates/render-preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function listComponentCategoriesRequest(): Promise<CommunicationComponentCategorySummary[]> {
  const response = await authenticatedFetch('/api/admin/communications/components/categories')
  const data = await handleResponse<{ success: boolean; data: CommunicationComponentCategorySummary[] }>(response)
  return data.data
}

export async function createComponentCategoryRequest(payload: {
  name: string
  description?: string | null
  icon?: string | null
  sortOrder?: number
}): Promise<CommunicationComponentCategorySummary> {
  const response = await authenticatedFetch('/api/admin/communications/components/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const data = await handleResponse<{ success: boolean; data: CommunicationComponentCategorySummary }>(response)
  return data.data
}

export async function updateComponentCategoryRequest(id: number, payload: {
  name?: string
  description?: string | null
  icon?: string | null
  sortOrder?: number
}): Promise<CommunicationComponentCategorySummary> {
  const response = await authenticatedFetch(`/api/admin/communications/components/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  const data = await handleResponse<{ success: boolean; data: CommunicationComponentCategorySummary }>(response)
  return data.data
}

export async function deleteComponentCategoryRequest(id: number): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/communications/components/categories/${id}`, {
    method: 'DELETE',
  })
  await handleResponse<{ success: boolean }>(response)
}

export async function listComponentsRequest(params: {
  search?: string
  categoryId?: number
  channel?: CommunicationChannel
  includeInactive?: boolean
} = {}): Promise<CommunicationComponentSummary[]> {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set('search', params.search)
  if (params.categoryId) searchParams.set('categoryId', String(params.categoryId))
  if (params.channel) searchParams.set('channel', params.channel)
  if (params.includeInactive) searchParams.set('includeInactive', 'true')

  const response = await authenticatedFetch(`/api/admin/communications/components?${searchParams.toString()}`)
  const data = await handleResponse<{ success: boolean; data: CommunicationComponentSummary[] }>(response)
  return data.data
}

export async function createComponentRequest(payload: {
  componentKey: string
  name: string
  componentType: string
  description?: string | null
  categoryId?: number | null
  channel?: CommunicationChannel | null
  markup?: string | null
  variables?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  previewImage?: string | null
  isActive?: boolean
  sortOrder?: number
}): Promise<CommunicationComponentSummary> {
  const response = await authenticatedFetch('/api/admin/communications/components', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const data = await handleResponse<{ success: boolean; data: CommunicationComponentSummary }>(response)
  return data.data
}

export async function updateComponentRequest(id: number, payload: Partial<Omit<Parameters<typeof createComponentRequest>[0], 'componentKey' | 'name' | 'componentType'>> & {
  componentKey?: string
  name?: string
  componentType?: string
}): Promise<CommunicationComponentSummary> {
  const response = await authenticatedFetch(`/api/admin/communications/components/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  const data = await handleResponse<{ success: boolean; data: CommunicationComponentSummary }>(response)
  return data.data
}

export async function deleteComponentRequest(id: number): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/communications/components/${id}`, {
    method: 'DELETE',
  })
  await handleResponse<{ success: boolean }>(response)
}

export async function getTemplateCompositionRequest(templateId: number): Promise<TemplateCompositionItem[]> {
  console.log('[API] getTemplateCompositionRequest called with:', { templateId })
  
  try {
    // Try the alternative endpoint first with query param (avoids params issue)
    console.log('[API] Trying alternative GET endpoint with query param')
    const response = await authenticatedFetch(`/api/admin/communications/template-composition?templateId=${templateId}`)
    
    if (!response.ok) {
      console.warn('[API] Alternative GET endpoint failed with status:', response.status)
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log('[API] GET successful (alternative endpoint):', { count: data.data?.length })
    return data.data
  } catch (error) {
    console.log('[API] Trying original GET endpoint:', error)
    // Fallback to original endpoint
    const response = await authenticatedFetch(`/api/admin/communications/templates/${templateId}/components`)
    
    const data = await handleResponse<{ success: boolean; data: TemplateCompositionItem[] }>(response)
    console.log('[API] GET successful (original endpoint):', { count: data.data?.length })
    return data.data
  }
}

export async function updateTemplateCompositionRequest(
  templateId: number,
  items: Array<{ componentId: number; order?: number; slot?: string | null; settings?: Record<string, unknown> | null }>,
): Promise<TemplateCompositionItem[]> {
  console.log('[API] updateTemplateCompositionRequest called with:', { templateId, itemsCount: items.length })
  
  // Try the simplified endpoint first (most reliable)
  try {
    console.log('[API] Trying SIMPLIFIED endpoint (POST /api/admin/save-template-composition)')
    const response = await authenticatedFetch('/api/admin/save-template-composition', {
      method: 'POST',
      body: JSON.stringify({ templateId, items }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[API] Simplified endpoint failed with status:', response.status, errorData)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log('[API] Simplified endpoint successful:', data)
    return data.data
  } catch (simplifiedError) {
    console.warn('[API] Simplified endpoint failed, trying alternative:', simplifiedError)
    
    // Fallback to alternative endpoint
    try {
      console.log('[API] Trying alternative endpoint (POST /api/admin/communications/template-composition)')
      const response = await authenticatedFetch('/api/admin/communications/template-composition', {
        method: 'POST',
        body: JSON.stringify({ templateId, items }),
      })
      
      const data = await handleResponse<{ success: boolean; data: TemplateCompositionItem[] }>(response)
      console.log('[API] Alternative endpoint successful')
      return data.data
    } catch (alternativeError) {
      console.warn('[API] Alternative endpoint failed, trying original:', alternativeError)
      
      // Final fallback to original endpoint
      try {
        console.log('[API] Trying original endpoint (PUT /api/admin/communications/templates/:id/components)')
        const response = await authenticatedFetch(`/api/admin/communications/templates/${templateId}/components`, {
          method: 'PUT',
          body: JSON.stringify({ items }),
        })
        const data = await handleResponse<{ success: boolean; data: TemplateCompositionItem[] }>(response)
        console.log('[API] Original endpoint successful')
        return data.data
      } catch (originalError) {
        console.error('[API] ALL THREE endpoints failed')
        throw originalError
      }
    }
  }
}
