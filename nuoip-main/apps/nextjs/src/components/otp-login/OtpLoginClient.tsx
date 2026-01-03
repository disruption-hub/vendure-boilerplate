'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useTenantCustomization, useCustomizationStyles } from '@/hooks/useTenantCustomization'
import { DEFAULT_CUSTOMIZATION, type TenantCustomization } from '@/types/tenant-customization'

const PhoneAuthGate = dynamic(() => import('@/components/chatbot/auth/PhoneAuthGate'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Cargando...</div>,
})

// Customizable background component - handles all background types
const CustomizableBackground = dynamic(() => import('@/components/auth/CustomizableBackground'), {
  ssr: false,
})

const RequestAccessButton = dynamic(() => import('@/components/RequestAccessButton'), {
  ssr: false,
})

interface OtpLoginClientProps {
  tenantId?: string
  tenantName?: string
  tenantLogoUrl?: string | null
  redirectUrl: string
  initialCustomization?: TenantCustomization | null
}

export function OtpLoginClient({ tenantId, tenantName, tenantLogoUrl, redirectUrl, initialCustomization }: OtpLoginClientProps) {
  const [clientTenantLogoUrl, setClientTenantLogoUrl] = useState<string | null>(tenantLogoUrl || null)
  const [clientTenantName, setClientTenantName] = useState<string | undefined>(tenantName)

  // Always fetch client-side to get latest updates, but use initialCustomization as fallback
  // This ensures we get updates even if server-side fetch was cached
  const { customization: clientCustomization, loading } = useTenantCustomization(tenantId)

  // Prefer client-side customization (always fresh) over initial customization (may be cached)
  // But use initial customization if client-side hasn't loaded yet
  const customization = (clientCustomization && !loading) ? clientCustomization : (initialCustomization || clientCustomization)

  // Client-side fallback: If server didn't provide logo, fetch it client-side
  useEffect(() => {
    if (!clientTenantLogoUrl && tenantId) {
      console.log('[OtpLoginClient] Server did not provide logo, fetching client-side for tenant:', tenantId)
      fetch(`/api/tenants/lookup?key=${encodeURIComponent(tenantId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.tenant) {
            console.log('[OtpLoginClient] Client-side fetch successful:', {
              hasLogo: !!data.tenant.logoUrl,
              hasName: !!data.tenant.name,
            })
            if (data.tenant.logoUrl) {
              setClientTenantLogoUrl(data.tenant.logoUrl)
            }
            if (data.tenant.name && !clientTenantName) {
              setClientTenantName(data.tenant.name)
            }
          }
        })
        .catch(err => {
          console.error('[OtpLoginClient] Client-side tenant fetch failed:', err)
        })
    }
  }, [tenantId, clientTenantLogoUrl, clientTenantName])

  // Debug logging
  useEffect(() => {
    console.log('[OtpLoginClient] Props received:', {
      tenantId: tenantId || 'undefined',
      tenantName: clientTenantName || 'undefined',
      tenantLogoUrl: clientTenantLogoUrl || 'null/undefined',
      tenantLogoUrlType: typeof clientTenantLogoUrl,
      tenantLogoUrlLength: clientTenantLogoUrl?.length || 0,
      hasCustomization: !!customization,
      loading,
    })
    if (clientTenantLogoUrl) {
      console.log('[OtpLoginClient] Logo URL details:', {
        url: clientTenantLogoUrl,
        isDataUrl: clientTenantLogoUrl.startsWith('data:'),
        isHttpUrl: clientTenantLogoUrl.startsWith('http'),
        firstChars: clientTenantLogoUrl.substring(0, 50),
      })
    }
  }, [tenantId, clientTenantName, clientTenantLogoUrl, customization, loading])

  // Apply customization as CSS variables
  useCustomizationStyles(customization)

  // Determine background config:
  // - If we have customization, use it
  // - If loading and we have a tenantId (but no initial customization), show black background
  // - Otherwise use default
  const backgroundConfig = (() => {
    if (customization?.background) {
      return customization.background
    }
    // If we're still loading and have a tenantId, show black background to prevent default Vanta fog flash
    if (loading && tenantId && !initialCustomization) {
      return {
        type: 'solid' as const,
        solidColor: '#000000',
      }
    }
    // No customization - use default
    return DEFAULT_CUSTOMIZATION.background
  })()

  // Container styling based on customization
  const containerStyle = customization?.formContainer ? {
    backgroundColor: customization.formContainer.background,
    borderColor: customization.formContainer.border,
    boxShadow: customization.formContainer.shadow,
  } : undefined

  const containerClass = customization?.formContainer
    ? "relative z-10 w-full max-w-[95%] sm:max-w-md md:max-w-lg rounded-2xl sm:rounded-3xl border"
    : "relative z-10 w-full max-w-[95%] sm:max-w-md md:max-w-lg rounded-2xl sm:rounded-3xl border border-white/20 bg-white shadow-[0_20px_52px_-28px_rgba(0,0,0,0.3)]"

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-12">
      {/* Show background - black while loading, then customized or default */}
      <CustomizableBackground config={backgroundConfig} />
      <section className={containerClass} style={containerStyle}>
        <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 px-4 pb-5 pt-2 sm:px-6 sm:pb-6 sm:pt-2 md:px-7 md:pb-7 md:pt-3">
          <PhoneAuthGate
            tenantId={tenantId ?? undefined}
            redirectUrl={redirectUrl}
            variant="compact-embedded"
            tenantLogoUrl={clientTenantLogoUrl ?? null}
            customization={customization}
          />

          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 text-center text-xs sm:text-sm">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-700">¿Necesitas acceso?</p>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Solicita acceso a FlowCast y nuestro equipo revisará tu solicitud en minutos.
            </p>
            <div className="mt-2 sm:mt-3 flex justify-center">
              <RequestAccessButton
                tenantId={tenantId ?? undefined}
                tenantName={clientTenantName ?? undefined}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

