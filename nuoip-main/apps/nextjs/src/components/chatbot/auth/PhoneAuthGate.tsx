'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OtpInput } from '@/components/ui/OtpInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
  prepareCountryCodeForRequest,
  sanitizeCountryCode,
} from '@/lib/utils/phone'
import { FlowBotIcon } from '@/components/ui/FlowBotIcon'
import type { TenantCustomization } from '@/types/tenant-customization'
import { useChatAuthStore } from '@/stores/chat-auth-store'

const RESEND_INTERVAL_SECONDS = 60

interface PhoneAuthGateProps {
  tenantId?: string
  redirectUrl?: string
  variant?: 'default' | 'compact-embedded'
  tenantLogoUrl?: string | null
  customization?: TenantCustomization | null
}

export function PhoneAuthGate({ tenantId, redirectUrl, variant = 'default', tenantLogoUrl, customization }: PhoneAuthGateProps) {
  const {
    status,
    requestOtp,
    verifyOtp,
    syncSession,
    loadSession,
    clearError,
    error,
    isHydrated,
    sessionToken,
    lastRequestedAt,
    lastPhoneInput,
    lastCountryCode,
    normalizedPhone,
    saveProfile,
    profileSaving,
    displayName,
    email,
    fetchProfile,
    normalizeCountryCode,
  } = useChatAuthStore()

  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY.dialCode)
  const [selectedCountryIso, setSelectedCountryIso] = useState<string>(DEFAULT_COUNTRY.isoCode)
  const [customCountryCode, setCustomCountryCode] = useState<string>('')
  const [isCustomCountry, setIsCustomCountry] = useState(false)
  const [code, setCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const profileFetchRequested = useRef(false)
  const sessionLoadAttempted = useRef(false)
  const redirectHandled = useRef(false)
  const verifyOtpInProgress = useRef(false)
  const router = useRouter()

  // Load existing session on mount
  useEffect(() => {
    if (!sessionLoadAttempted.current && isHydrated && status === 'loading' && sessionToken) {
      sessionLoadAttempted.current = true
      void loadSession()
    }
  }, [isHydrated, status, sessionToken, loadSession])

  const normalizedLastCountryCode = useMemo(() => sanitizeCountryCode(lastCountryCode), [lastCountryCode])

  useEffect(() => {
    if (lastCountryCode == null) {
      return
    }

    if (normalizedLastCountryCode !== lastCountryCode) {
      normalizeCountryCode()
    }
  }, [lastCountryCode, normalizedLastCountryCode, normalizeCountryCode])

  useEffect(() => {
    if (lastPhoneInput) {
      setPhone(prev => (prev ? prev : lastPhoneInput))
    } else if (normalizedPhone) {
      setPhone(prev => (prev ? prev : normalizedPhone))
    }

    if (normalizedLastCountryCode) {
      const match = COUNTRY_OPTIONS.find(option => option.dialCode === normalizedLastCountryCode)
      const nextIsCustom = !match
      const nextIso = match ? match.isoCode : 'CUSTOM'
      const nextDial = match ? match.dialCode : normalizedLastCountryCode
      const nextCustom = match ? '' : normalizedLastCountryCode

      setIsCustomCountry(prev => (prev === nextIsCustom ? prev : nextIsCustom))
      setSelectedCountryIso(prev => (prev === nextIso ? prev : nextIso))
      setCustomCountryCode(prev => (prev === nextCustom ? prev : nextCustom))
      setCountryCode(prev => (prev === nextDial ? prev : nextDial))
    }
  }, [lastPhoneInput, normalizedPhone, normalizedLastCountryCode])

  const countryOptions = useMemo(() => COUNTRY_OPTIONS, [])
  const awaitingProfile = status === 'profile_pending'
  const awaitingCode = (status === 'otp_requested' || status === 'verifying') && !awaitingProfile
  const isLoading = status === 'loading' || status === 'verifying' || profileSaving

  useEffect(() => {
    if (!redirectUrl) {
      return
    }
    if (redirectHandled.current) {
      return
    }
    // Only redirect when fully authenticated, not when profile is pending
    if (status === 'authenticated') {
      // Don't redirect if we're already on the target page
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const targetPath = redirectUrl.split('?')[0] // Remove query params for comparison

      // Only redirect if we're not already on the target page
      if (currentPath !== targetPath) {
        redirectHandled.current = true
        console.log('[PhoneAuthGate] Redirecting to:', redirectUrl)
        router.replace(redirectUrl)
      } else {
        // We're already on the target page, just mark as handled
        redirectHandled.current = true
      }
    }
  }, [status, redirectUrl, router])

  useEffect(() => {
    if (status === 'otp_requested') {
      setCode('')
      verifyOtpInProgress.current = false
    }
    if (status === 'authenticated' || status === 'profile_pending') {
      verifyOtpInProgress.current = false
    }
  }, [status])

  useEffect(() => {
    if (!awaitingProfile) {
      profileFetchRequested.current = false
      setFullName('')
      setEmailAddress('')
      return
    }

    if (!profileFetchRequested.current && !displayName && !email) {
      profileFetchRequested.current = true
      void fetchProfile()
    }

    if (displayName && !fullName) {
      setFullName(displayName)
    }

    if (email && !emailAddress) {
      setEmailAddress(email)
    }
  }, [awaitingProfile, displayName, email, fetchProfile, fullName, emailAddress])

  const [resendAvailableIn, setResendAvailableIn] = useState(0)

  // Update countdown in real time
  useEffect(() => {
    if (!lastRequestedAt) {
      setResendAvailableIn(0)
      return
    }

    const updateCountdown = () => {
      const elapsed = Math.floor((Date.now() - lastRequestedAt) / 1000)
      const remaining = RESEND_INTERVAL_SECONDS - elapsed
      const newValue = remaining > 0 ? remaining : 0
      setResendAvailableIn(newValue)
    }

    // Update immediately
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [lastRequestedAt])

  const formRef = useRef<HTMLFormElement>(null)
  const autoSubmitAttempted = useRef<string>('')

  useEffect(() => {
    if (code.length === 6 && !isLoading && status === 'otp_requested' && code !== autoSubmitAttempted.current && !verifyOtpInProgress.current) {
      autoSubmitAttempted.current = code

      const submitForm = () => {
        if (code.length === 6 && !isLoading && status === 'otp_requested' && code === autoSubmitAttempted.current && !verifyOtpInProgress.current) {
          if (formRef.current) {
            const submitButton = formRef.current.querySelector<HTMLButtonElement>('button[type="submit"]')
            if (submitButton && !submitButton.disabled) {
              submitButton.click()
            }
          }
        }
      }

      const timeout1 = setTimeout(submitForm, 150)
      const timeout2 = setTimeout(submitForm, 400)

      return () => {
        clearTimeout(timeout1)
        clearTimeout(timeout2)
      }
    } else if (code.length < 6) {
      autoSubmitAttempted.current = ''
    }
  }, [code, isLoading, status])

  const handleRequestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()

    const normalizedCountryCode = prepareCountryCodeForRequest(countryCode)

    const host = typeof window !== 'undefined' ? window.location.host : undefined
    const synced = await syncSession({
      phone,
      countryCode: normalizedCountryCode,
      tenantId,
      host,
      sessionToken,
    })

    if (synced) {
      return
    }

    const currentHost = typeof window !== 'undefined' ? window.location.host : undefined
    await requestOtp({ phone, countryCode: normalizedCountryCode, tenantId, host: currentHost })
  }

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()

    if (verifyOtpInProgress.current || isLoading) {
      return
    }

    verifyOtpInProgress.current = true
    try {
      await verifyOtp(code)
    } finally {
      setTimeout(() => {
        verifyOtpInProgress.current = false
      }, 1000)
    }
  }

  if (status === 'loading' && isHydrated) {
    if (variant === 'compact-embedded') {
      return (
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <h2 className="text-base font-semibold text-gray-900">Cargando autenticación…</h2>
          <p className="text-sm text-gray-600">Preparando tu sesión segura.</p>
        </div>
      )
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl bg-white px-6 py-10 text-center shadow-[0_22px_54px_-28px_rgba(0,0,0,0.15)]">
        <h2 className="text-lg font-semibold text-gray-900">Cargando autenticación…</h2>
        <p className="text-sm text-gray-600">Preparando la sesión segura del chatbot.</p>
      </div>
    )
  }

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    await saveProfile({ displayName: fullName, email: emailAddress })
  }

  const heading = awaitingProfile
    ? 'Completa tu perfil'
    : awaitingCode
      ? 'Ingresa tu código'
      : 'Confirma tu número'

  const description = awaitingProfile
    ? 'Ingresa tu nombre completo y correo electrónico para personalizar tu experiencia con FlowCast.'
    : awaitingCode
      ? 'Escribe el código de 6 dígitos que enviamos a tu teléfono.'
      : 'Ingresa tu número de teléfono para continuar.'

  const wrapperClass = variant === 'compact-embedded'
    ? 'chatbot-theme flex w-full flex-col bg-white'
    : 'chatbot-theme flex min-h-full w-full items-center justify-center bg-white px-4 py-10'

  const containerClass = variant === 'compact-embedded'
    ? 'w-full space-y-5'
    : 'w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-[0_28px_62px_-30px_rgba(0,0,0,0.15)] backdrop-blur'

  const headingContainerClass = variant === 'compact-embedded'
    ? 'space-y-2.5 text-left'
    : 'mb-8 space-y-3 text-center'

  const headingClass = variant === 'compact-embedded'
    ? 'text-lg sm:text-xl font-semibold text-gray-900'
    : 'text-xl sm:text-2xl font-semibold text-gray-900'

  const descriptionClass = variant === 'compact-embedded'
    ? 'text-xs sm:text-sm text-gray-600'
    : 'mt-2 text-xs sm:text-sm text-gray-600'

  const formSpacingClass = variant === 'compact-embedded' ? 'space-y-3 sm:space-y-4' : 'space-y-4 sm:space-y-5'

  const buttonBaseClass = variant === 'compact-embedded'
    ? 'h-10 sm:h-11 w-full rounded-full text-sm font-semibold transition'
    : 'h-11 sm:h-12 w-full rounded-full text-sm sm:text-base font-semibold transition'

  const primaryButtonStyle = customization ? {
    backgroundColor: customization.primaryButton.background,
    color: customization.primaryButton.text,
  } : undefined

  const primaryButtonClass = customization
    ? buttonBaseClass
    : `${buttonBaseClass} bg-[#25d366] text-gray-900 hover:bg-[#1ebe5b]`

  const alertMarginClass = variant === 'compact-embedded' ? 'mb-3 sm:mb-4' : 'mb-4 sm:mb-5'

  const inputFieldStyle = customization ? {
    backgroundColor: customization.inputFields.background,
    borderColor: customization.inputFields.border,
    color: customization.inputFields.text,
  } : undefined

  const inputFieldClass = customization
    ? 'h-12 rounded-2xl border'
    : 'h-12 rounded-2xl border border-gray-300 bg-[#f5f1ed] text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:ring-gray-900/20'

  return (
    <div className={wrapperClass} style={{ background: 'white' }}>
      <div className={containerClass}>
        <div className={variant === 'compact-embedded' ? 'mb-0 flex justify-center' : 'mb-1 flex justify-center'}>
          {(() => {
            console.log('[PhoneAuthGate] Rendering logo section:', {
              tenantLogoUrl: tenantLogoUrl || 'null/undefined',
              hasLogo: !!tenantLogoUrl,
              logoType: typeof tenantLogoUrl,
            })
            return null
          })()}
          {tenantLogoUrl ? (() => {
            // Convert relative URLs to absolute backend URLs or use as-is for data URLs and absolute URLs
            let logoSrc = tenantLogoUrl
            if (logoSrc.startsWith('/api/public/')) {
              // Relative path - convert to absolute URL
              const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                process.env.BACKEND_URL ||
                'https://nuoip-production.up.railway.app'
              const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')
              // Use Next.js API route to proxy the asset
              logoSrc = logoSrc // Keep relative path - Next.js will handle it via our API route
            } else if (!logoSrc.startsWith('http') && !logoSrc.startsWith('data:')) {
              // If it's a relative path that doesn't start with /api, make it absolute
              if (logoSrc.startsWith('/')) {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                  process.env.BACKEND_URL ||
                  'https://nuoip-production.up.railway.app'
                const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')
                logoSrc = `${normalizedBackendUrl}${logoSrc}`
              }
            }

            return (
              <div className="flex h-28 w-28 sm:h-36 sm:w-36 md:h-40 md:w-40 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc}
                  alt="Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    console.error('[PhoneAuthGate] Logo failed to load:', tenantLogoUrl)
                    // If image fails to load, hide it and show default icon
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.logo-fallback')) {
                      const fallback = document.createElement('div')
                      fallback.className = 'logo-fallback'
                      fallback.innerHTML = '<svg class="h-full w-full text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>'
                      parent.appendChild(fallback)
                    }
                  }}
                  onLoad={() => {
                    console.log('[PhoneAuthGate] Logo loaded successfully:', tenantLogoUrl)
                  }}
                />
              </div>
            )
          })() : (
            <div className="flex h-28 w-28 sm:h-36 sm:w-36 md:h-40 md:w-40 items-center justify-center">
              <FlowBotIcon variant="glyph" size={96} className="text-gray-700" />
            </div>
          )}
        </div>
        <div className={headingContainerClass}>
          <h2 className={headingClass}>{heading}</h2>
          <p className={descriptionClass}>{description}</p>
        </div>

        {error ? (
          <Alert variant="destructive" className={`${alertMarginClass} border-red-200 bg-red-50 !text-gray-900`}>
            <AlertDescription className="!text-gray-900">{error}</AlertDescription>
          </Alert>
        ) : null}

        {awaitingProfile ? (
          <form onSubmit={handleSaveProfile} className={formSpacingClass}>
            <div className="space-y-2.5">
              <Label htmlFor="chat-auth-full-name" className="text-sm font-medium text-gray-900">Nombre completo</Label>
              <Input
                id="chat-auth-full-name"
                name="fullName"
                placeholder="Tu nombre y apellidos"
                value={fullName}
                onChange={event => setFullName(event.target.value)}
                disabled={isLoading}
                required
                className={inputFieldClass}
                style={inputFieldStyle}
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="chat-auth-email" className="text-sm font-medium text-gray-900">Correo electrónico</Label>
              <Input
                id="chat-auth-email"
                name="email"
                type="email"
                placeholder="tu@correo.com"
                value={emailAddress}
                onChange={event => setEmailAddress(event.target.value)}
                disabled={isLoading}
                required
                className={inputFieldClass}
                style={inputFieldStyle}
              />
            </div>
            <Button
              type="submit"
              className={primaryButtonClass}
              style={primaryButtonStyle}
              disabled={isLoading || !fullName.trim() || !emailAddress.trim()}
              onMouseEnter={(e) => {
                if (customization && !isLoading && fullName.trim() && emailAddress.trim()) {
                  e.currentTarget.style.backgroundColor = customization.primaryButton.hover
                }
              }}
              onMouseLeave={(e) => {
                if (customization) {
                  e.currentTarget.style.backgroundColor = customization.primaryButton.background
                }
              }}
            >
              {profileSaving ? 'Guardando…' : 'Guardar y continuar'}
            </Button>
          </form>
        ) : !awaitingCode ? (
          <form onSubmit={handleRequestOtp} className={formSpacingClass}>
            <div className="space-y-2.5">
              <Label htmlFor="chat-auth-country" className="text-sm font-medium text-gray-900">Código de país</Label>
              <Select
                value={isCustomCountry ? 'CUSTOM' : selectedCountryIso}
                onValueChange={value => {
                  if (value === 'CUSTOM') {
                    setIsCustomCountry(true)
                    setSelectedCountryIso('CUSTOM')
                    setCustomCountryCode(prev => (prev ? prev : '+'))
                    setCountryCode(prev => (prev ? prev : '+'))
                    return
                  }

                  const match = countryOptions.find(option => option.isoCode === value)
                  if (match) {
                    setIsCustomCountry(false)
                    setSelectedCountryIso(match.isoCode)
                    setCustomCountryCode('')
                    setCountryCode(match.dialCode)
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="chat-auth-country"
                  className={inputFieldClass}
                  style={inputFieldStyle}
                >
                  <SelectValue placeholder="Selecciona un país" className="!text-slate-900" />
                </SelectTrigger>
                <SelectContent
                  className="max-h-60 border !text-slate-900 shadow-lg"
                  style={inputFieldStyle}
                >
                  {countryOptions.map(option => (
                    <SelectItem
                      key={option.isoCode}
                      value={option.isoCode}
                      className="rounded-xl !text-slate-900 hover:bg-gray-100 focus:bg-gray-100"
                    >
                      {`${option.flag} ${option.label} (${option.dialCode})`}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="CUSTOM"
                    className="rounded-xl !text-slate-900 hover:bg-gray-100 focus:bg-gray-100"
                  >
                    🏳️ Código personalizado…
                  </SelectItem>
                </SelectContent>
              </Select>
              {isCustomCountry && (
                <Input
                  id="chat-auth-custom-country"
                  name="customCountryCode"
                  placeholder="Ej. +51"
                  value={customCountryCode}
                  onChange={event => {
                    const nextRaw = event.target.value
                    const digits = nextRaw.replace(/[^0-9+]/g, '')
                    let normalized = digits
                    if (normalized && !normalized.startsWith('+')) {
                      normalized = `+${normalized.replace(/^\+/, '')}`
                    }
                    if (!normalized) {
                      normalized = '+'
                    }
                    setCustomCountryCode(prev => (prev === normalized ? prev : normalized))
                    setCountryCode(prev => (prev === normalized ? prev : normalized))
                    setSelectedCountryIso('CUSTOM')
                  }}
                  disabled={isLoading}
                  className={inputFieldClass}
                  style={inputFieldStyle}
                />
              )}
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="chat-auth-phone" className="text-sm font-medium text-gray-900">Número de teléfono</Label>
              <Input
                id="chat-auth-phone"
                name="phone"
                type="tel"
                placeholder="Tu número móvil"
                value={phone}
                onChange={event => setPhone(event.target.value)}
                disabled={isLoading}
                required
                className={inputFieldClass}
                style={inputFieldStyle}
              />
            </div>
            <Button
              type="submit"
              className={primaryButtonClass}
              style={primaryButtonStyle}
              disabled={isLoading || !phone.trim()}
              onMouseEnter={(e) => {
                if (customization && !isLoading && phone.trim()) {
                  e.currentTarget.style.backgroundColor = customization.primaryButton.hover
                }
              }}
              onMouseLeave={(e) => {
                if (customization) {
                  e.currentTarget.style.backgroundColor = customization.primaryButton.background
                }
              }}
            >
              {isLoading ? 'Enviando código…' : 'Enviar código por SMS'}
            </Button>
          </form>
        ) : (
          <form ref={formRef} onSubmit={handleVerifyOtp} className={formSpacingClass}>
            <div className="space-y-2.5">
              <Label htmlFor="chat-auth-code" className="text-sm font-medium text-gray-900">Código de verificación</Label>
              <OtpInput
                value={code}
                onChange={setCode}
                length={6}
                disabled={isLoading}
                className="justify-center"
                colors={customization?.otpForm}
                onComplete={(completedCode) => {
                  if (completedCode.length === 6 && !isLoading && !verifyOtpInProgress.current) {
                    verifyOtpInProgress.current = true
                    void verifyOtp(completedCode).finally(() => {
                      setTimeout(() => {
                        verifyOtpInProgress.current = false
                      }, 1000)
                    })
                  }
                }}
              />
            </div>
            <Button
              type="submit"
              className={primaryButtonClass}
              style={primaryButtonStyle}
              disabled={isLoading || code.trim().length < 4}
              onMouseEnter={(e) => {
                if (customization && !isLoading && code.trim().length >= 4) {
                  e.currentTarget.style.backgroundColor = customization.primaryButton.hover
                }
              }}
              onMouseLeave={(e) => {
                if (customization) {
                  e.currentTarget.style.backgroundColor = customization.primaryButton.background
                }
              }}
            >
              {isLoading ? 'Verificando…' : 'Confirmar código'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              {resendAvailableIn > 0 ? (
                <span>Podrás reenviar un nuevo código en {resendAvailableIn} s.</span>
              ) : (
                <button
                  type="button"
                  className="font-medium text-gray-900 underline underline-offset-4 transition hover:text-gray-700"
                  onClick={() => {
                    const resendCountryCode =
                      sanitizeCountryCode(lastCountryCode ?? countryCode) ?? undefined

                    void requestOtp({
                      phone: lastPhoneInput ?? phone,
                      countryCode: resendCountryCode,
                      tenantId,
                    })
                  }}
                  disabled={isLoading}
                >
                  Reenviar código
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PhoneAuthGate

