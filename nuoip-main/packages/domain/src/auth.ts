export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminLoginResponse {
  token: string
  user: {
    id: string
    email: string
    role?: string
    tenantId?: string
  }
}

export interface ChatOtpRequest {
  phone: string
  countryCode?: string | null
  tenantId?: string | null
  host?: string | null
  language?: 'es' | 'en'
  preferredChannel?: 'SMS' | 'WHATSAPP' | 'TELEGRAM' | 'INSTAGRAM'
  whatsappNumber?: string | null
  telegramChatId?: string | null
  instagramUserId?: string | null
  sessionToken?: string | null
}

export interface ChatOtpResponse {
  success: boolean
  verificationId: string
  expiresAt: string
  normalizedPhone: string
  countryCode?: string | null
}

export interface ChatOtpVerifyRequest {
  code: string
  verificationId: string
}

export interface ChatOtpVerifyResponse {
  success: boolean
  session: {
    token: string
    sessionId: string
    expiresAt: string
  }
  user: ChatAuthUser
}

export type ChatAuthLanguage = 'es' | 'en'

export interface ChatAuthSession {
  token: string
  sessionId: string
  expiresAt: string
}

export interface ChatAuthUser {
  id: string
  phone: string
  normalizedPhone: string
  countryCode?: string | null
  tenantId?: string | null
  displayName?: string | null
  email?: string | null
  profileComplete: boolean
  linkedUserId?: string | null
}

export interface ChatAuthProfileInput {
  displayName: string
  email: string
}

export interface ChatAuthProfile {
  id: string
  displayName: string | null
  email: string | null
  tenantId: string | null
  phone: string
  countryCode?: string | null
  profileComplete: boolean
}

export interface RequestOtpResult {
  verificationId: string
  expiresAt: string
  normalizedPhone: string
  countryCode?: string | null
}

export interface VerifyOtpResult {
  session: ChatAuthSession
  user: ChatAuthUser
}
