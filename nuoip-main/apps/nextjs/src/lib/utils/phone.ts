export interface PhoneNormalizationResult {
  phone: string // Raw phone number with country code
  normalized: string // Normalized phone number (same as phone for consistency)
  countryCode?: string // Country code if available
}

// Legacy interface for chatbot auth service compatibility
export interface NormalizedPhone {
  normalized: string
  raw: string
  countryCode?: string
}

export interface CountryOption {
  isoCode: string
  dialCode: string
  label: string
  flag: string
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { isoCode: 'PE', dialCode: '+51', label: 'Perú', flag: '🇵🇪' },
  { isoCode: 'US', dialCode: '+1', label: 'United States', flag: '🇺🇸' },
  { isoCode: 'MX', dialCode: '+52', label: 'México', flag: '🇲🇽' },
  { isoCode: 'CO', dialCode: '+57', label: 'Colombia', flag: '🇨🇴' },
  { isoCode: 'CL', dialCode: '+56', label: 'Chile', flag: '🇨🇱' },
  { isoCode: 'AR', dialCode: '+54', label: 'Argentina', flag: '🇦🇷' },
  { isoCode: 'ES', dialCode: '+34', label: 'España', flag: '🇪🇸' },
  { isoCode: 'BR', dialCode: '+55', label: 'Brasil', flag: '🇧🇷' },
  { isoCode: 'CA', dialCode: '+1', label: 'Canada', flag: '🇨🇦' },
  { isoCode: 'GB', dialCode: '+44', label: 'United Kingdom', flag: '🇬🇧' },
]

export const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0]

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

export function prepareCountryCodeForRequest(value?: string | null): string | undefined {
  const sanitized = sanitizeCountryCode(value)
  return sanitized ?? undefined
}

/**
 * Normalizes a phone number with optional country code
 * Unified function for both admin and chatbot auth systems
 */
export function normalizePhoneNumber(phone: string, countryCode?: string): PhoneNormalizationResult | null {
  if (!phone?.trim()) {
    return null
  }

  const trimmedPhone = phone.trim()
  const sanitizedCountryCode = sanitizeCountryCode(countryCode) ?? undefined

  // Handle international format (+XX...)
  if (trimmedPhone.startsWith('+')) {
    const digitsOnly = trimmedPhone.replace(/[^0-9]/g, '')
    if (!digitsOnly || digitsOnly.length < 8 || digitsOnly.length > 15) {
      return null
    }
    return {
      phone: `+${digitsOnly}`,
      normalized: `+${digitsOnly}`,
      countryCode: sanitizedCountryCode,
    }
  }

  // Handle 00 prefix (international dialing)
  if (trimmedPhone.startsWith('00')) {
    const digitsOnly = trimmedPhone.slice(2).replace(/[^0-9]/g, '')
    if (!digitsOnly || digitsOnly.length < 8 || digitsOnly.length > 15) {
      return null
    }
    return {
      phone: `+${digitsOnly}`,
      normalized: `+${digitsOnly}`,
      countryCode: sanitizedCountryCode,
    }
  }

  // Handle national format with country code
  if (sanitizedCountryCode) {
    const ccDigits = sanitizedCountryCode.slice(1)

    const phoneDigits = trimmedPhone.replace(/[^0-9]/g, '').replace(/^0+/, '')
    if (!phoneDigits) {
      return null
    }

    const combined = `${ccDigits}${phoneDigits}`
    if (combined.length < 8 || combined.length > 15) {
      return null
    }

    return {
      phone: `+${combined}`,
      normalized: `+${combined}`,
      countryCode: sanitizedCountryCode,
    }
  }

  // Handle national format without country code - assume international
  const digitsOnly = trimmedPhone.replace(/[^0-9]/g, '')
  if (!digitsOnly || digitsOnly.length < 8 || digitsOnly.length > 15) {
    return null
  }

  return {
    phone: `+${digitsOnly}`,
    normalized: `+${digitsOnly}`,
  }
}

/**
 * Normalizes a phone number with validation (throws errors)
 * Legacy function for chatbot auth service compatibility
 */
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
    if (digits.length < 8 || digits.length > 15) {
      throw new Error('Phone number must contain 8-15 digits')
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
    if (combined.length < 8 || combined.length > 15) {
      throw new Error('Phone number must contain 8-15 digits')
    }
    return {
      normalized: `+${combined}`,
      raw: `+${combined}`,
      countryCode: sanitizedCountryCode,
    }
  }

  const sanitized = numberDigits.replace(/^0+/, '') || numberDigits
  if (sanitized.length < 8 || sanitized.length > 15) {
    throw new Error('Phone number must contain 8-15 digits')
  }
  return {
    normalized: `+${sanitized}`,
    raw: `+${sanitized}`,
  }
}

/**
 * Validates if a phone number is properly formatted
 */
export function isValidPhoneNumber(phone: string, countryCode?: string): boolean {
  return normalizePhoneNumber(phone, countryCode) !== null
}

/**
 * Extracts country code from phone number if it's in international format
 */
export function extractCountryCode(phone: string): { phone: string; countryCode: string | null } {
  if (!phone?.startsWith('+')) {
    return { phone, countryCode: null }
  }

  // Try to match against known country codes
  for (const country of COUNTRY_OPTIONS) {
    const dialCode = country.dialCode.slice(1) // Remove +
    if (phone.slice(1).startsWith(dialCode)) {
      const remaining = phone.slice(1 + dialCode.length)
      if (remaining) {
        return {
          phone: remaining,
          countryCode: country.dialCode,
        }
      }
    }
  }

  return { phone: phone.slice(1), countryCode: null }
}
