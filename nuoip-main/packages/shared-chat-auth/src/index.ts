import { randomBytes } from 'crypto'
import type {
  ChatAuthLanguage,
  ChatAuthProfile,
  ChatAuthProfileInput,
  ChatAuthSession,
  ChatAuthUser,
} from '@ipnuo/domain'

export type ChatAuthErrorCode =
  | 'CONFIG_NOT_FOUND'
  | 'INVALID_PHONE'
  | 'RATE_LIMITED'
  | 'INVALID_CODE'
  | 'EXPIRED'
  | 'NOT_FOUND'
  | 'SESSION_INVALID'
  | 'MISSING_VERIFICATION'
  | 'SMS_DELIVERY_FAILED'
  | 'ACCESS_DENIED'
  | 'PROFILE_INVALID'

export class ChatAuthError extends Error {
  constructor(message: string, public readonly code: ChatAuthErrorCode) {
    super(message)
    this.name = 'ChatAuthError'
  }
}

export interface NormalizedPhone {
  normalized: string
  raw: string
  countryCode?: string
}

const PHONE_MIN_LENGTH = 8
const PHONE_MAX_LENGTH = 25

export function sanitizeCountryCode(value?: string | null): string | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (/^0x[0-9a-f]+$/i.test(trimmed)) {
    const hexPayload = trimmed.slice(2)

    const decimalGuess = Number.parseInt(hexPayload, 10)
    if (Number.isFinite(decimalGuess) && decimalGuess > 0) {
      return `+${decimalGuess}`
    }

    const parsed = Number.parseInt(trimmed, 16)
    if (Number.isFinite(parsed) && parsed > 0) {
      return `+${parsed}`
    }

    return null
  }

  const digits = trimmed.replace(/[^0-9]/g, '')
  if (!digits) {
    return null
  }

  const numericValue = Number.parseInt(digits, 10)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null
  }

  return `+${numericValue}`
}

export function normalizePhoneNumberStrict(phone: string, countryCode?: string): NormalizedPhone {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number is required')
  }

  let trimmed = phone.trim()
  if (!trimmed) {
    throw new Error('Phone number is required')
  }

  const sanitizedCountryCode = sanitizeCountryCode(countryCode)
  if (countryCode && !sanitizedCountryCode) {
    throw new Error('Invalid country code')
  }

  if (trimmed.startsWith('00')) {
    trimmed = `+${trimmed.slice(2)}`
  }

  if (trimmed.startsWith('+')) {
    const digits = trimmed.replace(/[^0-9]/g, '')
    if (digits.length < PHONE_MIN_LENGTH || digits.length > PHONE_MAX_LENGTH) {
      throw new Error(`Phone number must contain ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digits`)
    }
    return {
      normalized: `+${digits}`,
      raw: `+${digits}`,
    }
  }

  const numberDigits = trimmed.replace(/[^0-9]/g, '')
  if (!numberDigits) {
    throw new Error('Phone number must contain digits')
  }

  if (sanitizedCountryCode) {
    const ccDigits = sanitizedCountryCode.slice(1)

    const national = numberDigits.replace(/^0+/, '') || numberDigits
    const combined = `${ccDigits}${national}`
    if (combined.length < PHONE_MIN_LENGTH || combined.length > PHONE_MAX_LENGTH) {
      throw new Error(`Phone number must contain ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digits`)
    }
    return {
      normalized: `+${combined}`,
      raw: `+${combined}`,
      countryCode: sanitizedCountryCode,
    }
  }

  const sanitized = numberDigits.replace(/^0+/, '') || numberDigits
  if (sanitized.length < PHONE_MIN_LENGTH || sanitized.length > PHONE_MAX_LENGTH) {
    throw new Error(`Phone number must contain ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digits`)
  }

  return {
    normalized: `+${sanitized}`,
    raw: `+${sanitized}`,
  }
}

export function normalizePhoneNumber(phone: string, countryCode?: string): NormalizedPhone {
  try {
    return normalizePhoneNumberStrict(phone, countryCode)
  } catch (error) {
    throw new ChatAuthError(error instanceof Error ? error.message : 'Invalid phone number', 'INVALID_PHONE')
  }
}

export function generateOtpCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000)
  return String(code)
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function generatePublicVerificationId(): string {
  return randomBytes(18).toString('hex')
}

export function calculateExpiry(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}

export function calculateSessionExpiry(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

export function ensureVerificationId(verificationId: string | undefined): string {
  if (!verificationId || typeof verificationId !== 'string') {
    throw new ChatAuthError('Verification identifier is required', 'MISSING_VERIFICATION')
  }
  return verificationId.trim()
}

export function resolveLanguage(language?: ChatAuthLanguage): ChatAuthLanguage {
  return language === 'en' ? 'en' : 'es'
}

export function isProfileComplete(user: { displayName?: string | null; email?: string | null }): boolean {
  const name = typeof user.displayName === 'string' ? user.displayName.trim() : ''
  const email = typeof user.email === 'string' ? user.email.trim() : ''
  return Boolean(name && email)
}

export function mapProfile(user: {
  id: string
  displayName: string | null
  email: string | null
  tenantId: string | null
  phone: string
  countryCode?: string | null
}): ChatAuthProfile {
  return {
    id: user.id,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    tenantId: user.tenantId,
    phone: user.phone,
    countryCode: user.countryCode ?? null,
    profileComplete: isProfileComplete(user),
  }
}

export function mapUser(
  user: {
    id: string
    phone: string | null
    normalizedPhone: string | null
    countryCode: string | null
    tenantId: string | null
    displayName: string | null
    email: string | null
  },
  linkedUser?: {
    id?: string | null
    name?: string | null
    email?: string | null
    tenantId?: string | null
    phone?: string | null
    normalizedPhone?: string | null
  } | null,
): ChatAuthUser {
  const phoneValue = user.phone ?? linkedUser?.phone ?? linkedUser?.normalizedPhone ?? user.normalizedPhone ?? ''
  const normalizedPhone = user.normalizedPhone ?? linkedUser?.normalizedPhone ?? phoneValue
  const displayName = user.displayName ?? linkedUser?.name ?? null
  const email = user.email ?? linkedUser?.email ?? null
  const tenantId = linkedUser?.tenantId ?? user.tenantId ?? null

  return {
    id: user.id,
    phone: phoneValue,
    normalizedPhone,
    countryCode: user.countryCode ?? null,
    tenantId: tenantId ?? null,
    displayName: displayName ?? null,
    email: email ?? null,
    profileComplete: isProfileComplete({ displayName, email }),
    linkedUserId: linkedUser?.id ?? null,
  }
}

export type { ChatAuthProfile, ChatAuthProfileInput, ChatAuthSession, ChatAuthUser }
