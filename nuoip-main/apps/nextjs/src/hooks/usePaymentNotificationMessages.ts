"use client"

import { useEffect, useRef } from 'react'

import { waitForServiceWorker } from '@/lib/pwa/service-worker'
import type { PaymentNotificationPayload } from '@/types/payment-notification'

function parseEventData(data: unknown): any {
  if (!data) {
    return null
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  return data
}

export function formatPaymentNotificationContent(
  payload: PaymentNotificationPayload,
  locale?: string,
): string {
  const resolvedLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US')

  const amountValue = typeof payload.amount === 'string' ? Number.parseFloat(payload.amount) : Number(payload.amount)
  const currency = payload.currency || 'USD'

  const amountFormatted = Number.isFinite(amountValue)
    ? amountValue.toLocaleString(resolvedLocale, { style: 'currency', currency })
    : [payload.amount, payload.currency].filter(Boolean).join(' ')

  const customerName = payload.customer?.name || payload.customer?.email || 'Cliente'
  const linkDescription = payload.link?.description || payload.link?.id || 'link de pago'
  const transactionId = payload.id || payload.link?.id
  const mode = payload.mode

  const timestampValue = payload.timestamp
    ? new Date(payload.timestamp)
    : new Date()

  const timestampFormatted = Number.isNaN(timestampValue.getTime())
    ? undefined
    : timestampValue.toLocaleString(resolvedLocale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })

  const lines = [
    '✅ Pago recibido',
    '',
    `${customerName} pagó ${amountFormatted}${linkDescription ? ` por ${linkDescription}` : ''}.`,
    transactionId ? `Transacción: ${transactionId}` : null,
    mode ? `Modo: ${mode}` : null,
    timestampFormatted ? `Fecha: ${timestampFormatted}` : null,
  ]

  return lines.filter(Boolean).join('\n')
}

export function usePaymentNotificationMessages(
  onNotification: (payload: PaymentNotificationPayload) => void,
) {
  const seenRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    void waitForServiceWorker().catch(() => undefined)

    const handleMessage = (event: MessageEvent) => {
      const payload = parseEventData(event.data)
      if (!payload || typeof payload !== 'object') {
        return
      }

      if ((payload as any).type !== 'PAYMENT_NOTIFICATION') {
        return
      }

      const notification = (payload as any).data as PaymentNotificationPayload | undefined
      if (!notification || typeof onNotification !== 'function') {
        return
      }

      const dedupeKey = notification.id || notification.link?.id
      if (dedupeKey) {
        const seen = seenRef.current
        if (seen.has(dedupeKey)) {
          return
        }
        seen.add(dedupeKey)
        if (seen.size > 50) {
          const iterator = seen.values()
          const first = iterator.next()
          if (!first.done) {
            seen.delete(first.value)
          }
        }
      }

      onNotification(notification)
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
