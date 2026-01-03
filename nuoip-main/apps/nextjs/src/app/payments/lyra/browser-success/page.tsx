'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface TransactionInfo {
  orderId?: string
  transactionId?: string
  amount?: number
  currency?: string
  orderStatus?: string
  orderDate?: string
  customerEmail?: string
  customerName?: string
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

function SuccessContent() {
  const searchParams = useSearchParams()
  const [transactionInfo, setTransactionInfo] = useState<TransactionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTransactionInfo = async () => {
      // Try to extract info from Lyra response
      // kr-answer can come as base64 string in query param or as JSON object
      const krAnswerParam = searchParams?.get('kr-answer')

      let orderId: string | undefined
      let transactionId: string | undefined
      let amount: number | undefined
      let currency: string | undefined
      let orderStatus: string | undefined
      let orderDate: string | undefined
      let customerEmail: string | undefined
      let customerName: string | undefined

      if (krAnswerParam) {
        try {
          // Try to decode base64 first
          let decoded: any
          try {
            decoded = JSON.parse(atob(krAnswerParam))
          } catch {
            // If not base64, try parsing as JSON directly
            decoded = JSON.parse(krAnswerParam)
          }

          console.log('[PaymentSuccess] Decoded kr-answer:', decoded)

          // Extract from orderDetails (primary location)
          if (decoded.orderDetails) {
            orderId = decoded.orderDetails.orderId
            amount = decoded.orderDetails.orderTotalAmount || decoded.orderDetails.orderEffectiveAmount
            currency = decoded.orderDetails.orderCurrency
          }

          // Extract from kr-answer object (if nested)
          if (decoded['kr-answer']) {
            const krAnswer = decoded['kr-answer']
            if (krAnswer.orderDetails) {
              orderId = orderId || krAnswer.orderDetails.orderId
              amount = amount || krAnswer.orderDetails.orderTotalAmount || krAnswer.orderDetails.orderEffectiveAmount
              currency = currency || krAnswer.orderDetails.orderCurrency
            }
            orderStatus = krAnswer.orderStatus
            orderDate = krAnswer.serverDate
            if (krAnswer.customer) {
              customerEmail = krAnswer.customer.email
              customerName = krAnswer.customer.reference
            }
          }

          // Extract transaction info
          if (decoded.transactions && decoded.transactions.length > 0) {
            transactionId = decoded.transactions[0].uuid
          }

          // Extract from root level if not found
          orderId = orderId || decoded.orderId
          orderStatus = orderStatus || decoded.orderStatus
          orderDate = orderDate || decoded.serverDate
          customerEmail = customerEmail || decoded.customer?.email
          customerName = customerName || decoded.customer?.reference
        } catch (e) {
          console.error('Failed to parse kr-answer:', e, 'Raw value:', krAnswerParam?.substring(0, 100))
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
        transactionId,
        amount,
        currency,
        orderStatus,
        orderDate,
        customerEmail,
        customerName,
        tenant,
      })

      setLoading(false)
    }

    void loadTransactionInfo()
  }, [searchParams])

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row payment-success-page">
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

          <h1 className="text-white text-sm uppercase tracking-wider mb-8" style={{ color: '#ffffff' }}>Payment Confirmation</h1>

          {/* Transaction Details */}
          {transactionInfo?.orderId && (
            <div className="space-y-4" style={{ color: '#ffffff' }}>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20" style={{ color: '#ffffff' }}>
                <p className="text-white text-xs mb-1" style={{ color: '#ffffff' }}>Order ID</p>
                <p className="text-white font-mono text-xs sm:text-sm break-all" style={{ color: '#ffffff' }}>{transactionInfo.orderId}</p>
              </div>
              {transactionInfo.transactionId && (
                <div className="bg-white/10 rounded-xl p-4 border border-white/20" style={{ color: '#ffffff' }}>
                  <p className="text-white text-xs mb-1" style={{ color: '#ffffff' }}>Transaction ID</p>
                  <p className="text-white font-mono text-xs sm:text-sm break-all" style={{ color: '#ffffff' }}>{transactionInfo.transactionId}</p>
                </div>
              )}
              {transactionInfo.amount && transactionInfo.currency && (
                <div className="bg-white/10 rounded-xl p-4 border border-white/20" style={{ color: '#ffffff' }}>
                  <p className="text-white text-xs mb-1" style={{ color: '#ffffff' }}>Amount</p>
                  <p className="text-white font-semibold text-lg" style={{ color: '#ffffff' }}>
                    {transactionInfo.currency} {(transactionInfo.amount / 100).toFixed(2)}
                  </p>
                </div>
              )}
              {transactionInfo.orderDate && (
                <div className="bg-white/10 rounded-xl p-4 border border-white/20" style={{ color: '#ffffff' }}>
                  <p className="text-white text-xs mb-1" style={{ color: '#ffffff' }}>Date</p>
                  <p className="text-white text-sm" style={{ color: '#ffffff' }}>
                    {new Date(transactionInfo.orderDate).toLocaleString()}
                  </p>
                </div>
              )}
              {transactionInfo.customerName && (
                <div className="bg-white/10 rounded-xl p-4 border border-white/20" style={{ color: '#ffffff' }}>
                  <p className="text-white text-xs mb-1" style={{ color: '#ffffff' }}>Customer</p>
                  <p className="text-white text-sm" style={{ color: '#ffffff' }}>{transactionInfo.customerName}</p>
                </div>
              )}
            </div>
          )}

          {/* Security Badge */}
          <div className="hidden md:block mt-auto pt-8 border-t border-white/20" style={{ color: '#ffffff' }}>
            <div className="flex items-center gap-2 text-white text-xs" style={{ color: '#ffffff' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span style={{ color: '#ffffff' }}>Secure payment processed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Success Message (White) */}
      <div className="md:w-[55%] lg:w-1/2 bg-white p-6 sm:p-8 md:p-12 flex flex-col flex-1">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 md:w-28 md:h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
            <svg className="w-10 h-10 md:w-14 md:h-14 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h2>
          <p className="text-gray-500 text-base md:text-lg mb-8 max-w-sm mx-auto">
            Thank you for your payment. Your transaction has been completed successfully.
          </p>

          {transactionInfo?.amount && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <p className="text-gray-500 text-sm mb-2">Amount Paid</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900">
                {transactionInfo.currency} {(transactionInfo.amount / 100).toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-gray-500 text-sm">
              A confirmation email has been sent to your email address.
            </p>

            <Link
              href={
                transactionInfo?.tenant?.paymentReturnHomeUrl ||
                transactionInfo?.tenant?.websiteUrl ||
                (transactionInfo?.tenant?.domain ? `https://${transactionInfo.tenant.domain}` : '/')
              }
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
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

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SuccessContent />
    </Suspense>
  )
}
