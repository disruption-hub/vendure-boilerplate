'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { roundedCurrency } from '@/lib/utils/currency'
import { initializeLyraSmartForm, type LyraTheme } from '@/lib/payments/lyra-smart-form'
import { authenticatedFetch } from '@/features/admin/api/admin-api'

interface LyraTestFormClientProps {
  availableModes: Array<'test' | 'production'>
  initialMode: 'test' | 'production'
  defaultAmountCents: number
  defaultCurrency: string
}

interface FormTokenResponse {
  formToken: string
  mode: 'test' | 'production'
  amountCents: number
  currency: string
  publicKey: string
  scriptBaseUrl: string
  language: string
  theme: LyraTheme
  successUrl: string
  failureUrl: string
  paymentMethods: string[]
}

function parseAmountToCents(value: string): number | null {
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null
  }
  return Math.round(numeric * 100)
}

export function LyraTestFormClient(props: LyraTestFormClientProps) {
  const { availableModes, initialMode, defaultAmountCents, defaultCurrency } = props

  const [mode, setMode] = useState<'test' | 'production'>(initialMode)
  const [amountInput, setAmountInput] = useState(() => (defaultAmountCents / 100).toFixed(2))
  const [currency, setCurrency] = useState(defaultCurrency)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormTokenResponse | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const reactId = useId()
  const formId = useMemo(() => `lyra-smart-form-${reactId.replace(/[:]/g, '')}`, [reactId])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lyraInstanceRef = useRef<{ removeForms: () => Promise<void> } | null>(null)

  const amountDisplay = useMemo(() => {
    if (!formData) {
      const cents = parseAmountToCents(amountInput)
      return cents ? roundedCurrency(cents) : amountInput
    }
    return roundedCurrency(formData.amountCents)
  }, [amountInput, formData])

  const activePaymentMethods = formData?.paymentMethods ?? []

  const handleGenerate = async () => {
    const cents = parseAmountToCents(amountInput)
    if (cents === null) {
      setError('Enter a valid amount greater than zero (e.g. 10.00)')
      return
    }

    const payload = {
      mode,
      amountCents: cents,
      currency,
    }

    try {
      setLoading(true)
      setError(null)
      setStatusMessage(null)

      if (lyraInstanceRef.current) {
        await lyraInstanceRef.current.removeForms().catch(() => undefined)
        lyraInstanceRef.current = null
      }

      const response = await authenticatedFetch('/api/admin/system/lyra/test-form', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok || !data?.success) {
        const detail = typeof data?.details === 'string' && data.details.length ? `: ${data.details}` : ''
        throw new Error((data?.error || 'Failed to initialize Lyra smart form') + detail)
      }

      const nextFormData: FormTokenResponse = {
        formToken: data.formToken,
        mode: data.mode,
        amountCents: data.amountCents,
        currency: data.currency,
        publicKey: data.publicKey,
        scriptBaseUrl: data.scriptBaseUrl,
        language: data.language,
        theme: data.theme as LyraTheme,
        successUrl: data.successUrl,
        failureUrl: data.failureUrl,
        paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
      }

      setFormData(nextFormData)

      if (!containerRef.current) {
        throw new Error('Lyra smart form container is not available')
      }

      const formHandle = await initializeLyraSmartForm({
        container: containerRef.current,
        formSelector: `#${formId}`,
        scriptBaseUrl: nextFormData.scriptBaseUrl,
        publicKey: nextFormData.publicKey,
        formToken: nextFormData.formToken,
        theme: nextFormData.theme,
        language: nextFormData.language,
        successUrl: nextFormData.successUrl,
        failureUrl: nextFormData.failureUrl,
      })

      lyraInstanceRef.current = formHandle
      setStatusMessage('Smart form initialized. Complete the embedded form to validate the integration.')
    } catch (err) {
      setFormData(null)
      setError(err instanceof Error ? err.message : 'Failed to initialize Lyra smart form')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (lyraInstanceRef.current) {
        void lyraInstanceRef.current.removeForms().catch(() => undefined)
      }
    }
  }, [])

  return (
    <div className="admin-theme flex min-h-screen items-center justify-center bg-[var(--admin-content-background)] px-4 py-8">
      <div className="admin-card w-full max-w-4xl space-y-6 p-6 sm:p-10">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[var(--admin-card-header-text)] sm:text-3xl">
            Lyra Smart Form Integration Test
          </h1>
          <p className="text-sm text-[var(--admin-card-muted-text)]">
            Validate your Lyra configuration by launching the hosted smart form with sandbox credentials.
          </p>
        </header>

        <section className="grid gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="lyra-mode" className="text-[var(--admin-content-muted-text)]">
              Environment
            </Label>
            {availableModes.length > 1 ? (
              <select
                id="lyra-mode"
                value={mode}
                onChange={event => setMode(event.target.value === 'production' ? 'production' : 'test')}
                className="h-10 w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card-background)] px-3 text-sm text-[var(--admin-card-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--admin-card-background)]"
                disabled={loading}
              >
                {availableModes.map(option => (
                  <option key={option} value={option}>
                    {option === 'production' ? 'Production (Live)' : 'Test / Sandbox'}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-md border border-dashed border-[var(--admin-border-muted)] bg-[var(--admin-card-background)] px-3 py-2 text-sm text-[var(--admin-card-muted-text)]">
                {mode === 'production' ? 'Production (Live)' : 'Test / Sandbox'}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="lyra-amount" className="text-[var(--admin-content-muted-text)]">
              Amount (in {currency})
            </Label>
            <Input
              id="lyra-amount"
              type="number"
              step="0.01"
              min="0"
              value={amountInput}
              onChange={event => setAmountInput(event.target.value)}
              disabled={loading}
              className="border-[var(--admin-border)] bg-[var(--admin-card-background)] text-[var(--admin-card-text)]"
            />
            <p className="text-xs text-[var(--admin-card-muted-text)]">Minimum suggested: 1.00</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="lyra-currency" className="text-[var(--admin-content-muted-text)]">
              Currency
            </Label>
            <Input
              id="lyra-currency"
              value={currency}
              onChange={event => setCurrency(event.target.value.toUpperCase())}
              disabled={loading}
              className="border-[var(--admin-border)] bg-[var(--admin-card-background)] text-[var(--admin-card-text)]"
            />
            <p className="text-xs text-[var(--admin-card-muted-text)]">Use ISO currency codes (e.g. PEN, USD, MXN).</p>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Initializing…' : 'Launch Smart Form'}
          </Button>
          {statusMessage && <p className="text-sm text-[var(--admin-card-muted-text)]">{statusMessage}</p>}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {formData && (
          <section className="space-y-4">
            <div className="grid gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--admin-card-muted-text)]">Environment</p>
                <p className="text-sm font-medium text-[var(--admin-card-text)]">
                  {formData.mode === 'production' ? 'Production (Live)' : 'Test / Sandbox'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--admin-card-muted-text)]">Charge Amount</p>
                <p className="text-sm font-medium text-[var(--admin-card-text)]">
                  {formData.currency} {amountDisplay}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--admin-card-muted-text)]">Payment Methods</p>
                <p className="text-sm text-[var(--admin-card-text)]">
                  {activePaymentMethods.length ? activePaymentMethods.join(', ') : 'Default (CARDS)'}
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-background)] p-4">
          <div ref={containerRef}>
            <div id={formId} className="kr-smart-form" data-kr-card-form-expanded="true"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
