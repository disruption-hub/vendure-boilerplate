'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { initializeLyraSmartForm, type LyraTheme } from '@/lib/payments/lyra-smart-form'

interface PaymentLinkData {
  id: string
  token: string
  product: {
    name: string
    productCode: string
  }
  amountCents: number
  baseAmountCents: number
  taxAmountCents: number
  taxRateBps?: number | null
  currency: string
  status: string
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  customerCountryCode?: string | null
  expiresAt?: string | null
  tenantId?: string | null
}

interface TenantInfo {
  id: string
  name: string
  logoUrl?: string | null
}

interface LyraFormConfigResponse {
  success: boolean
  linkId: string
  token: string
  mode: 'test' | 'production'
  amountCents: number
  currency: string
  formToken: string
  publicKey: string
  scriptBaseUrl: string
  language: string
  theme: LyraTheme
  successUrl: string
  failureUrl: string
  paymentMethods: string[]
}

function formatCurrency(amountCents: number, currency: string): string {
  const amount = amountCents / 100
  try {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export default function PaymentLinkPage() {
  const params = useParams()
  const token = params?.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkData, setLinkData] = useState<PaymentLinkData | null>(null)
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [lyraError, setLyraError] = useState<string | null>(null)
  const [lyraLoading, setLyraLoading] = useState(false)

  const lyraContainerRef = useRef<HTMLDivElement | null>(null)
  const lyraHandleRef = useRef<{ removeForms: () => Promise<void> } | null>(null)

  // Load payment link details
  useEffect(() => {
    if (!token) {
      setError('Invalid payment link')
      setLoading(false)
      return
    }

    const fetchLink = async () => {
      try {
        const response = await fetch(`/api/payments/link/${token}`)
        if (!response.ok) {
          throw new Error('Payment link not found')
        }
        const data = (await response.json()) as PaymentLinkData & { tenant?: TenantInfo }
        setLinkData(data)
        if (data.tenant) {
          setTenant(data.tenant)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment link')
      } finally {
        setLoading(false)
      }
    }

    void fetchLink()
  }, [token])

  // Initialize Lyra smart form once link data is loaded
  useEffect(() => {
    const setupLyraForm = async () => {
      if (!linkData || !token || !lyraContainerRef.current) {
        return
      }

      try {
        setLyraLoading(true)
        setLyraError(null)

        // Tear down any previous forms to avoid duplicate embeds
        if (lyraHandleRef.current) {
          await lyraHandleRef.current.removeForms().catch(() => undefined)
          lyraHandleRef.current = null
        }

        const response = await fetch(`/api/payments/link/${token}/lyra-form`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })

        const data = (await response.json()) as LyraFormConfigResponse | { error?: string }

        if (!response.ok || !(data as LyraFormConfigResponse).success) {
          const message =
            'error' in data && typeof data.error === 'string'
              ? data.error
              : 'Failed to initialize payment form'
          throw new Error(message)
        }

        const cfg = data as LyraFormConfigResponse

        const handle = await initializeLyraSmartForm({
          container: lyraContainerRef.current,
          formSelector: '#lyra-smart-form',
          scriptBaseUrl: cfg.scriptBaseUrl,
          publicKey: cfg.publicKey,
          formToken: cfg.formToken,
          theme: cfg.theme,
          language: cfg.language,
          successUrl: cfg.successUrl,
          failureUrl: cfg.failureUrl,
        })

        lyraHandleRef.current = handle
      } catch (err) {
        console.error('[PaymentLinkPage] Failed to initialize Lyra form:', err)
        setLyraError(err instanceof Error ? err.message : 'Failed to initialize payment form')
      } finally {
        setLyraLoading(false)
      }
    }

    void setupLyraForm()

    return () => {
      if (lyraHandleRef.current) {
        void lyraHandleRef.current.removeForms().catch(() => undefined)
      }
    }
  }, [linkData, token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto mb-4" />
          <p className="text-white font-medium">Loading payment...</p>
        </div>
      </div>
    )
  }

  if (error || !linkData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Link Not Found</h1>
          <p className="text-white">{error || 'The payment link you are looking for does not exist or has expired.'}</p>
        </div>
      </div>
    )
  }

  const isPaid = linkData.status === 'paid' || linkData.status === 'completed'

  return (
    <div className="min-h-screen flex flex-col md:flex-row payment-page">
      {/* Left Panel - Order Summary (Black) */}
      <div
        className="md:w-[45%] lg:w-1/2 bg-black p-5 sm:p-8 md:p-10 lg:p-12 flex flex-col min-h-[40vh] md:min-h-screen payment-left-panel"
        style={{ color: '#ffffff' }}
      >
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full" style={{ color: '#ffffff' }}>
          {/* Tenant Logo or Default */}
          <div className="mb-6 md:mb-8">
            {tenant?.logoUrl ? (
              <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6">
                <Image
                  src={tenant.logoUrl}
                  alt={tenant.name || 'Company Logo'}
                  fill
                  className="object-contain brightness-0 invert"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            )}
            {tenant?.name && (
              <p className="text-white text-lg md:text-xl font-semibold mb-2" style={{ color: '#ffffff' }}>{tenant.name}</p>
            )}
            <h1 className="text-white text-sm uppercase tracking-wider" style={{ color: '#ffffff' }}>Payment</h1>
          </div>

          {/* Product Info */}
          <div className="space-y-4 md:space-y-6" style={{ color: '#ffffff' }}>
            <div style={{ color: '#ffffff' }}>
              <p className="text-white text-xs md:text-sm mb-1" style={{ color: '#ffffff' }}>Product</p>
              <h2 className="text-white text-xl md:text-2xl font-semibold" style={{ color: '#ffffff' }}>{linkData.product.name}</h2>
            </div>

            {/* Amount Breakdown */}
            <div className="bg-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/20" style={{ color: '#ffffff' }}>
              {/* Show breakdown only if there's tax */}
              {linkData.taxAmountCents > 0 ? (
                <div className="space-y-1.5">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center" style={{ color: '#ffffff' }}>
                    <p className="text-white/60 text-[10px] md:text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Subtotal</p>
                    <p className="text-white/60 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {formatCurrency(linkData.baseAmountCents, linkData.currency)}
                    </p>
                  </div>
                  {/* Tax */}
                  <div className="flex justify-between items-center" style={{ color: '#ffffff' }}>
                    <p className="text-white/60 text-[10px] md:text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      IGV {linkData.taxRateBps ? `(${(linkData.taxRateBps / 100).toFixed(0)}%)` : ''}
                    </p>
                    <p className="text-white/60 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {formatCurrency(linkData.taxAmountCents, linkData.currency)}
                    </p>
                  </div>
                  {/* Divider */}
                  <div className="border-t border-white/20 pt-2 mt-1">
                    {/* Total */}
                    <div className="flex justify-between items-center" style={{ color: '#ffffff' }}>
                      <p className="text-white text-[10px] md:text-xs" style={{ color: '#ffffff' }}>Total</p>
                      <p className="text-white text-base sm:text-lg md:text-xl font-bold tracking-tight" style={{ color: '#ffffff' }}>
                        {formatCurrency(linkData.amountCents, linkData.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Simple display if no tax */
                <>
                  <p className="text-white text-[10px] md:text-xs mb-1" style={{ color: '#ffffff' }}>Total Amount</p>
                  <p className="text-white text-lg sm:text-xl md:text-2xl font-bold tracking-tight" style={{ color: '#ffffff' }}>
                    {formatCurrency(linkData.amountCents, linkData.currency)}
                  </p>
                </>
              )}
            </div>

            {/* Customer Info */}
            {(linkData.customerName || linkData.customerEmail || linkData.customerPhone) && (
              <div className="space-y-2 md:space-y-3" style={{ color: '#ffffff' }}>
                {linkData.customerName && (
                  <div className="flex items-center gap-3" style={{ color: '#ffffff' }}>
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0" style={{ color: '#ffffff' }}>
                      <p className="text-white text-[10px] md:text-xs" style={{ color: '#ffffff' }}>Customer</p>
                      <p className="text-white font-medium text-sm md:text-base truncate" style={{ color: '#ffffff' }}>{linkData.customerName}</p>
                    </div>
                  </div>
                )}
                {linkData.customerEmail && (
                  <div className="flex items-center gap-3" style={{ color: '#ffffff' }}>
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0" style={{ color: '#ffffff' }}>
                      <p className="text-white text-[10px] md:text-xs" style={{ color: '#ffffff' }}>Email</p>
                      <p className="text-white font-medium text-sm md:text-base truncate" style={{ color: '#ffffff' }}>{linkData.customerEmail}</p>
                    </div>
                  </div>
                )}
                {linkData.customerPhone && (
                  <div className="flex items-center gap-3" style={{ color: '#ffffff' }}>
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="min-w-0" style={{ color: '#ffffff' }}>
                      <p className="text-white text-[10px] md:text-xs" style={{ color: '#ffffff' }}>Phone</p>
                      <p className="text-white font-medium text-sm md:text-base truncate" style={{ color: '#ffffff' }}>{linkData.customerCountryCode} {linkData.customerPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Badge - Hidden on mobile, shown on desktop */}
          <div className="hidden md:block mt-8 pt-6 border-t border-white/20" style={{ color: '#ffffff' }}>
            <div className="flex items-center gap-2 text-white text-xs" style={{ color: '#ffffff' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span style={{ color: '#ffffff' }}>Secured payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Payment Form (White) */}
      <div className="md:w-[55%] lg:w-1/2 bg-white p-5 sm:p-8 md:p-10 lg:p-12 flex flex-col flex-1">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          {isPaid ? (
            /* Payment Success State */
            <div className="text-center py-8 md:py-12">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Payment Complete</h2>
              <p className="text-gray-600 text-sm md:text-base">Thank you for your payment. A confirmation has been sent to your email.</p>
            </div>
          ) : (
            /* Payment Form */
            <>
              <div className="mb-5 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">Payment Details</h2>
                <p className="text-gray-500 text-sm md:text-base">Enter your card information to complete the payment</p>
              </div>

              {/* Lyra Payment Form Container */}
              <div className="space-y-4 md:space-y-6">
                <div
                  ref={lyraContainerRef}
                  className="bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200 min-h-[280px] md:min-h-[300px]"
                >
                  <div id="lyra-smart-form" className="kr-smart-form" data-kr-card-form-expanded="true" />
                </div>

                {lyraLoading && (
                  <div className="flex items-center justify-center gap-3 py-3 md:py-4">
                    <div className="h-4 w-4 md:h-5 md:w-5 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />
                    <p className="text-gray-500 text-xs md:text-sm">Loading secure payment form...</p>
                  </div>
                )}

                {lyraError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4">
                    <div className="flex items-start gap-2 md:gap-3">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-red-800 font-medium text-xs md:text-sm">Payment form error</p>
                        <p className="text-red-600 text-xs md:text-sm mt-1">{lyraError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-gray-400 text-[10px] md:text-xs">
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>PCI Compliant</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure Payment</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
