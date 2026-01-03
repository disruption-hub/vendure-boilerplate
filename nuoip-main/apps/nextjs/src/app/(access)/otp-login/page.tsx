import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { OtpLoginClient } from '@/components/otp-login/OtpLoginClient'
import { extractSubdomainFromHost } from '@/lib/utils/subdomain'
import { getRootDomainConfig, getTenantBySubdomain, getTenantCustomization } from '@/lib/services/admin'
import { mergeCustomization } from '@/types/tenant-customization'

// Force dynamic rendering to prevent caching of customization
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Ingreso OTP | FlowCast',
  description: 'Inicia sesión en FlowCast utilizando verificación OTP segura.',
  robots: {
    index: false,
    follow: false,
  },
}

interface OtpLoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function OtpLoginPage({ searchParams }: OtpLoginPageProps) {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? ''
  const rootDomain = await getRootDomainConfig().catch(() => process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'flowcast.chat')

  const resolvedSearchParams = await (searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}))
  const tenantParam = resolvedSearchParams?.tenant
  const tenantIdFromQuery = Array.isArray(tenantParam) ? tenantParam[0] : tenantParam
  const derivedSubdomain = extractSubdomainFromHost(host, rootDomain) ?? undefined
  const tenantKey = tenantIdFromQuery ?? derivedSubdomain ?? undefined

  // Fetch tenant - try Prisma first, fallback to API endpoint
  let tenant = null
  if (tenantKey) {
    try {
      tenant = await getTenantBySubdomain(tenantKey)
    } catch (error) {
      console.error('[OTP Login] Error fetching tenant via Prisma:', error)
      // Fallback: Use our API endpoint which uses backend API
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
          `https://${host}` ||
          'https://nextjs-one-pink-79.vercel.app'
        const apiUrl = `${baseUrl}/api/tenants/lookup?key=${encodeURIComponent(tenantKey)}`
        const response = await fetch(apiUrl, {
          cache: 'no-store',
          headers: {
            'User-Agent': 'Next.js-Server',
          },
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.tenant) {
            tenant = data.tenant
          }
        }
      } catch (apiError) {
        console.error('[OTP Login] Error fetching tenant via API:', apiError)
      }
    }
  }

  // Fetch customization server-side if tenant exists
  // Use no-store to ensure we always get the latest customization
  let initialCustomization = null
  if (tenant?.id) {
    try {
      // Force fresh fetch by using a timestamp query parameter
      // This ensures we get the latest customization even if there's caching
      const customizationData = await getTenantCustomization(tenant.id)
      if (customizationData?.customization) {
        initialCustomization = mergeCustomization(customizationData.customization)
        console.log('[OTP Login] Loaded customization server-side:', {
          hasBackground: !!initialCustomization?.background,
          backgroundType: initialCustomization?.background?.type,
          timestamp: new Date().toISOString(),
        })
      } else {
        console.log('[OTP Login] No customization found for tenant:', tenant.id)
      }
    } catch (error) {
      console.error('[OTP Login] Error fetching customization:', error)
    }
  }

  // Debug logging
  if (tenantKey) {
    console.log('[OTP Login] Tenant lookup:', {
      tenantKey,
      tenantFound: !!tenant,
      tenantId: tenant?.id,
      tenantName: tenant?.name,
      logoUrl: tenant?.logoUrl ? `${tenant.logoUrl.substring(0, 50)}...` : 'NULL',
      logoUrlLength: tenant?.logoUrl?.length || 0,
      hasCustomization: !!initialCustomization,
    })
  }

  const redirectParamRaw = resolvedSearchParams?.redirect
  const redirectParam = Array.isArray(redirectParamRaw) ? redirectParamRaw[0] : redirectParamRaw

  // Detect locale from browser Accept-Language header
  const acceptLanguage = headerList.get('accept-language') || ''
  const preferredLocale = acceptLanguage.toLowerCase().includes('en') ? 'en' : 'es'

  // Use the existing chat interface - redirect to the chat page
  const redirectUrl =
    typeof redirectParam === 'string' && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : `/${preferredLocale}/chat/full`

  return (
    <OtpLoginClient
      tenantId={tenant?.id ?? tenantKey ?? undefined}
      tenantName={tenant?.name ?? undefined}
      tenantLogoUrl={tenant?.logoUrl ?? null}
      redirectUrl={redirectUrl}
      initialCustomization={initialCustomization}
    />
  )
}

