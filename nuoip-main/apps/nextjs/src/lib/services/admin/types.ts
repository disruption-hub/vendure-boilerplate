// Type definitions for admin services
export interface AdminStats {
  totalUsers: number
  totalTenants: number
  activeSessions: number
  [key: string]: any
}

export interface MemoryDetails {
  [key: string]: any
}

export interface TenantRecord {
  id: string
  name: string
  [key: string]: any
}

export interface TenantInput {
  [key: string]: any
}

export interface TenantListResponse {
  tenants: TenantRecord[]
  [key: string]: any
}

export interface UserRecord {
  id: string
  email: string
  [key: string]: any
}

export interface UserListResponse {
  users: UserRecord[]
  [key: string]: any
}

export interface UserInput {
  [key: string]: any
}

export interface UserUpdateInput {
  [key: string]: any
}

export interface CalibrationSessionSummary {
  [key: string]: any
}

export interface CalibrationReportResponse {
  [key: string]: any
}

export type CalibrationAssessmentMode = string
export type CalibrationGroupingMode = string

// Get OpenRouter configuration from environment variables only
// Database access should go through the backend
export const getOpenRouterConfig = async (): Promise<{ apiKey: string; baseUrl?: string } | null> => {
  const apiKey = process.env.OPENROUTER_API_KEY
  const baseUrl = process.env.OPENROUTER_BASE_URL

  if (!apiKey) {
    console.warn('[getOpenRouterConfig] OPENROUTER_API_KEY environment variable not set')
    return null
  }

  return {
    apiKey,
    baseUrl: baseUrl || 'https://openrouter.ai/api/v1',
  }
}

// Lyra payment types
export interface LyraCredentialSet {
  [key: string]: any
}

export interface LyraPaymentConfig {
  [key: string]: any
}
