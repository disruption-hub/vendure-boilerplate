'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { LyraTestFormClient } from '@/features/admin/components/LyraTestFormClient'
import { getLyraSettings, type LyraSettings } from '@/features/admin/api/admin-api'

function LyraTestPageContent() {
  const searchParams = useSearchParams()
  const mode = (searchParams?.get('mode') || 'test') as 'test' | 'production'
  const [settings, setSettings] = useState<LyraSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getLyraSettings()
        if (response.config) {
          setSettings(response.config)
        } else {
          setError('Lyra settings not configured')
        }
      } catch (err) {
        console.error('Failed to load Lyra settings', err)
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    void loadSettings()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-black mx-auto mb-4" />
          <p className="text-black">Loading Lyra settings...</p>
        </div>
      </div>
    )
  }

  if (error || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black mb-2">Unable to Load Settings</h1>
          <p className="text-black">{error || 'Lyra settings are not configured. Please configure them in the admin panel first.'}</p>
        </div>
      </div>
    )
  }

  const availableModes: Array<'test' | 'production'> = []
  if (settings.testMode.enabled && settings.testMode.credentials) {
    availableModes.push('test')
  }
  if (settings.productionMode.enabled && settings.productionMode.credentials) {
    availableModes.push('production')
  }

  if (availableModes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black mb-2">No Enabled Modes</h1>
          <p className="text-black">Please enable and configure at least one mode (test or production) in the admin panel.</p>
        </div>
      </div>
    )
  }

  const initialMode = availableModes.includes(mode) ? mode : availableModes[0]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black mb-2">Lyra Payment Form Test</h1>
          <p className="text-black">Test the Lyra payment smart form integration</p>
        </div>
        <LyraTestFormClient
          availableModes={availableModes}
          initialMode={initialMode}
          defaultAmountCents={10000}
          defaultCurrency="USD"
        />
      </div>
    </div>
  )
}

export default function LyraTestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-black mx-auto mb-4" />
            <p className="text-black">Loading...</p>
          </div>
        </div>
      }
    >
      <LyraTestPageContent />
    </Suspense>
  )
}

