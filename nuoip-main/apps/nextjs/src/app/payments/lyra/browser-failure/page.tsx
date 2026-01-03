'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface TransactionInfo {
  orderId?: string
  errorCode?: string
  errorMessage?: string
  tenant?: {
    id: string
    name: string
    logoUrl?: string | null
    domain?: string | null
    websiteUrl?: string | null
    paymentReturnHomeUrl?: string | null
  } | null
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  )
}

function FailureContent() {
  const searchParams = useSearchParams()
  const [transactionInfo, setTransactionInfo] = useState<TransactionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTransactionInfo = async () => {
      // Try to extract error info from Lyra response
      const krAnswer = searchParams?.get('kr-answer')

      let orderId: string | undefined
      let errorCode: string | undefined
      let errorMessage: string | undefined

      if (krAnswer) {
        try {
          const decoded = JSON.parse(atob(krAnswer))
          orderId = decoded.orderDetails?.orderId
          errorCode = decoded.transactions?.[0]?.errorCode || decoded.errorCode
          errorMessage = decoded.transactions?.[0]?.errorMessage || decoded.errorMessage
        } catch (e) {
          console.error('Failed to parse kr-answer:', e)
        }
      }

      // Fetch tenant info if we have an orderId
      let tenant = null
      if (orderId) {
        try {
          const response = await fetch(`/api/payments/order/${orderId}/tenant`)
          if (response.ok) {
            tenant = await response.json()
          }
        } catch (e) {
          console.error('Failed to fetch tenant info:', e)
        }
      }

      setTransactionInfo({
        orderId,
        errorCode,
        errorMessage,
        tenant,
      })

      setLoading(false)
    }

    void loadTransactionInfo()
  }, [searchParams])

  if (loading) {
    return <LoadingState />
  }

  // Prioritize paymentReturnHomeUrl, then websiteUrl, then domain, then default to /
  const homeUrl = transactionInfo?.tenant?.paymentReturnHomeUrl
    ? transactionInfo.tenant.paymentReturnHomeUrl
    : transactionInfo?.tenant?.websiteUrl
      ? transactionInfo.tenant.websiteUrl
      : transactionInfo?.tenant?.domain
        ? `https://${transactionInfo.tenant.domain}`
        : '/'

  return (
    <div className="min-h-screen flex flex-col md:flex-row payment-failure-page">
      {/* Left Panel - Branding (Black) */}
      <div 
        className="md:w-[45%] lg:w-1/2 bg-black p-6 sm:p-8 md:p-12 flex flex-col min-h-[30vh] md:min-h-screen payment-left-panel"
        style={{ color: '#ffffff' }}
      >
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full" style={{ color: '#ffffff' }}>
          {/* Logo */}
          {transactionInfo?.tenant?.logoUrl ? (
            <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6">
              <Image
                src={transactionInfo.tenant.logoUrl}
                alt={transactionInfo.tenant.name || 'Company Logo'}
                fill
                className="object-contain brightness-0 invert"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          )}

          {transactionInfo?.tenant?.name && (
            <p className="text-white text-lg md:text-xl font-semibold mb-2" style={{ color: '#ffffff' }}>{transactionInfo.tenant.name}</p>
          )}

          <h1 className="text-white text-sm uppercase tracking-wider mb-8" style={{ color: '#ffffff' }}>Payment Issue</h1>

          {/* Error Details */}
          {(transactionInfo?.orderId || transactionInfo?.errorCode) && (
            <div className="space-y-4" style={{ color: '#ffffff' }}>
              {transactionInfo.orderId && (
                <div className="bg-white/10 rounded-xl p-4 border border-white/20" style={{ color: '#ffffff' }}>
                  <p className="text-white text-xs mb-1" style={{ color: '#ffffff' }}>Order ID</p>
                  <p className="text-white font-mono text-sm" style={{ color: '#ffffff' }}>{transactionInfo.orderId}</p>
                </div>
              )}
              {transactionInfo.errorCode && (
                <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30" style={{ color: '#ffffff' }}>
                  <p className="text-red-200 text-xs mb-1" style={{ color: '#ffffff' }}>Error Code</p>
                  <p className="text-red-100 font-mono text-sm" style={{ color: '#ffffff' }}>{transactionInfo.errorCode}</p>
                </div>
              )}
            </div>
          )}

          {/* Security Badge */}
          <div className="hidden md:block mt-auto pt-8 border-t border-white/20" style={{ color: '#ffffff' }}>
            <div className="flex items-center gap-2 text-white text-xs" style={{ color: '#ffffff' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span style={{ color: '#ffffff' }}>Your payment information is secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Failure Message (White) */}
      <div className="md:w-[55%] lg:w-1/2 bg-white p-6 sm:p-8 md:p-12 flex flex-col flex-1">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full text-center">
          {/* Failure Icon */}
          <div className="w-20 h-20 md:w-28 md:h-28 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
            <svg className="w-10 h-10 md:w-14 md:h-14 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Payment Failed</h2>
          <p className="text-gray-500 text-base md:text-lg mb-6 max-w-sm mx-auto">
            {transactionInfo?.errorMessage || 'We were unable to process your payment. Please try again or use a different payment method.'}
          </p>

          {/* Common reasons */}
          <div className="bg-amber-50 rounded-2xl p-5 mb-8 border border-amber-100 text-left">
            <p className="text-amber-800 font-medium text-sm mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Common reasons for payment failure:
            </p>
            <ul className="text-amber-700 text-sm space-y-1.5 ml-6">
              <li className="list-disc">Insufficient funds in your account</li>
              <li className="list-disc">Incorrect card details entered</li>
              <li className="list-disc">Card expired or blocked</li>
              <li className="list-disc">Transaction declined by your bank</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>

            <Link
              href={homeUrl}
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <FailureContent />
    </Suspense>
  )
}
