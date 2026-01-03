'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { useChatAuthStore } from '@/stores/chat-auth-store'
import { useTenantCustomization, useCustomizationStyles } from '@/hooks/useTenantCustomization'
import { DEFAULT_CUSTOMIZATION } from '@/types/tenant-customization'
import dynamic from 'next/dynamic'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

const PhoneAuthGate = dynamic(() => import('@/components/chatbot/auth/PhoneAuthGate'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Cargando...</div>,
})

const FullScreenChatbot = dynamic(() => import('@/components/chatbot/fullscreen/FullScreenChatbot'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Cargando chat...</div>,
})

const CustomizableBackground = dynamic(() => import('@/components/auth/CustomizableBackground'), {
  ssr: false,
})

const RequestAccessButton = dynamic(() => import('@/components/RequestAccessButton'), {
  ssr: false,
})

interface ChatFullPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function ChatFullPage({ params, searchParams }: ChatFullPageProps) {
  const router = useRouter()
  // Unwrap params Promise using React.use()
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  const locale = resolvedParams.locale || 'es'
  const tenantKey = resolvedSearchParams?.tenant as string | undefined

  const { status, isHydrated, sessionToken, tenantId, lastTenantId, loadSession, linkedUserId } = useChatAuthStore()
  const [resolvedTenantId, setResolvedTenantId] = useState<string | undefined>(tenantId || lastTenantId || undefined)
  const sessionLoadAttempted = useRef(false)

  // Load session on mount if we have a token but aren't authenticated yet
  useEffect(() => {
    if (isHydrated && sessionToken && !sessionLoadAttempted.current) {
      // Only call loadSession if we're unauthenticated OR if we're authenticated but missing linkedUserId (broken persistence)
      // Don't call it when status is 'loading' because loadSession sets status to 'loading', creating infinite loop
      if (status === 'unauthenticated' || (status === 'authenticated' && !linkedUserId)) {
        sessionLoadAttempted.current = true
        console.log('[Chat Full] Loading session on mount', { sessionToken: !!sessionToken, status, missingLinkedUser: !linkedUserId })
        void loadSession()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, sessionToken, status, linkedUserId]) // Removed loadSession from deps to prevent infinite loop

  // Try to resolve tenant from key if not in session
  useEffect(() => {
    if (!resolvedTenantId && tenantKey) {
      // Fetch tenant by key
      fetch(`/api/tenants/lookup?key=${encodeURIComponent(tenantKey)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.tenant?.id) {
            setResolvedTenantId(data.tenant.id)
          }
        })
        .catch(err => console.error('[Chat Full] Error fetching tenant:', err))
    }
  }, [tenantKey, resolvedTenantId])

  const { customization, loading: customizationLoading } = useTenantCustomization(resolvedTenantId)
  useCustomizationStyles(customization) // This hook sets CSS variables, doesn't return a value

  // Determine background config
  const backgroundConfig = customization?.background || DEFAULT_CUSTOMIZATION.background

  // Container styles
  const containerClass = 'relative z-10 flex min-h-screen w-full flex-col items-center justify-center'
  const containerStyle: React.CSSProperties = {}

  // Redirect to request-access if not authenticated (after hydration check)
  useEffect(() => {
    // Only redirect if:
    // 1. Store is hydrated (we know the auth state)
    // 2. Status is unauthenticated (not loading, not authenticated)
    // 3. No session token exists (user never logged in)
    if (isHydrated && status === 'unauthenticated' && !sessionToken) {
      // User is not authenticated and has no session token - redirect to request-access
      console.log('[Chat Full] User not authenticated, redirecting to /request-access')
      router.replace('/request-access')
    }
  }, [isHydrated, status, sessionToken, router])

  // Debug logging
  useEffect(() => {
    console.log('[Chat Full] Auth state:', {
      status,
      isHydrated,
      hasSessionToken: !!sessionToken,
      tenantId,
      resolvedTenantId,
    })

    // Log what will render
    if (isHydrated) {
      if (status === 'authenticated') {
        console.log('[Chat Full] Will render: FullScreenChatbot')
      } else if (status === 'profile_pending') {
        console.log('[Chat Full] Will render: Profile form (PhoneAuthGate)')
      } else if (status === 'loading' && sessionToken) {
        console.log('[Chat Full] Will render: Loading state')
      } else {
        console.log('[Chat Full] Will render: OTP form (PhoneAuthGate)')
      }
    }
  }, [status, isHydrated, sessionToken, tenantId, resolvedTenantId])

  // If not hydrated yet, show loading state
  if (!isHydrated) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <CustomizableBackground config={backgroundConfig} />
        <section className={containerClass} style={containerStyle}>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Cargando...</p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // If unauthenticated and no session token, redirect will happen via useEffect
  // Show loading state while redirecting
  if (status === 'unauthenticated' && !sessionToken) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <CustomizableBackground config={backgroundConfig} />
        <section className={containerClass} style={containerStyle}>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Redirigiendo...</p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // If authenticated or profile pending, show the full screen chat interface
  // Also check if we have a session token and are loading (session validation in progress)
  if (status === 'authenticated' || status === 'profile_pending' || (status === 'loading' && sessionToken)) {
    // If we have a session token but status is still loading, wait a bit for session validation
    if (status === 'loading' && sessionToken) {
      // Show loading state while validating session
      return (
        <main className="relative min-h-screen w-full overflow-hidden">
          <CustomizableBackground config={backgroundConfig} />
          <section className={containerClass} style={containerStyle}>
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">Cargando sesión...</p>
                <p className="text-sm text-gray-600 mt-2">Validando tu autenticación</p>
              </div>
            </div>
          </section>
        </main>
      )
    }

    // If profile is pending, show chat wrapped with PhoneAuthGate to handle profile completion
    if (status === 'profile_pending') {
      return (
        <ThemeProvider>
          <RealtimeProvider>
            <div className="relative min-h-screen w-full">
              <PhoneAuthGate
                tenantId={resolvedTenantId}
                redirectUrl={`/${locale}/chat/full${tenantKey ? `?tenant=${tenantKey}` : ''}`}
                variant="compact-embedded"
                tenantLogoUrl={null}
                customization={customization}
              />
            </div>
          </RealtimeProvider>
        </ThemeProvider>
      )
    }

    return (
      <ThemeProvider>
        <RealtimeProvider>
          <FullScreenChatbot />
        </RealtimeProvider>
      </ThemeProvider>
    )
  }

  // Show OTP login form if not authenticated
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <CustomizableBackground config={backgroundConfig} />
      <section className={containerClass} style={containerStyle}>
        <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 px-4 pb-5 pt-2 sm:px-6 sm:pb-6 sm:pt-2 md:px-7 md:pb-7 md:pt-3">
          <PhoneAuthGate
            tenantId={resolvedTenantId}
            redirectUrl={`/${locale}/chat/full${tenantKey ? `?tenant=${tenantKey}` : ''}`}
            variant="compact-embedded"
            tenantLogoUrl={null}
            customization={customization}
          />

          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 text-center text-xs sm:text-sm">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-700">¿Necesitas acceso?</p>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Solicita acceso a FlowCast y nuestro equipo revisará tu solicitud en minutos.
            </p>
            <div className="mt-2 sm:mt-3 flex justify-center">
              <RequestAccessButton
                tenantId={resolvedTenantId}
                tenantName={undefined}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

