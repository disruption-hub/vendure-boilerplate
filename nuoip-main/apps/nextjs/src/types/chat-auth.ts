// Local type definitions for chat auth (to avoid @ipnuo/domain dependency in Vercel builds)
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
    userId?: string | null
    tenantId?: string | null
  }
  user?: {
    id: string
    phone: string
    normalizedPhone: string
    countryCode?: string | null
    name?: string | null
    displayName?: string | null
    email?: string | null
    profileComplete?: boolean
    linkedUserId?: string | null
    tenantId?: string | null
  } | null
}

