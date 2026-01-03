import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId')
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      )
    }

    // Extract token from Authorization header
    const token = authHeader.replace(/^Bearer\s+/i, '')

    // If tenantId is not provided, try to get it from the session token
    let resolvedTenantId = tenantId
    if (!resolvedTenantId) {
      try {
        // Try to get tenantId from profile using session token
        // Use same localhost detection as api-helpers
        let backendUrl: string = process.env.NEXT_PUBLIC_BACKEND_URL || 
                                  process.env.BACKEND_URL || 
                                  ''
        if (!backendUrl) {
          const hasVercelEnv = !!(process.env.VERCEL || process.env.VERCEL_URL || process.env.VERCEL_ENV)
          const hasRailwayEnv = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_ENVIRONMENT_NAME)
          const isDeployed = hasVercelEnv || hasRailwayEnv
          backendUrl = !isDeployed ? 'http://localhost:3001' : 'https://nuoip-production.up.railway.app'
        }
        const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')

        const profileResponse = await fetch(`${normalizedBackendUrl}/api/v1/auth/phone/profile?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          signal: AbortSignal.timeout(5000),
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.success && profileData.profile?.tenantId) {
            resolvedTenantId = profileData.profile.tenantId
          }
        }
      } catch (profileError) {
        console.warn('[Chat Contacts API] Failed to get tenantId from profile:', profileError)
      }
    }

    if (!resolvedTenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId. Provide it as a query parameter or ensure your session has a tenantId.' },
        { status: 400 }
      )
    }

    // Use the chat auth contacts endpoint which accepts session tokens
    // Include tenantId in the query string as a fallback (backend will also get it from session)
    const backendUrl = `/api/v1/auth/phone/contacts?token=${encodeURIComponent(token)}&tenantId=${encodeURIComponent(resolvedTenantId)}`
    
    console.log('[Chat Contacts API] Calling backend endpoint', {
      tenantId: resolvedTenantId,
      hasToken: !!token,
      tokenLength: token?.length,
      backendUrl,
    })

    const response = await proxyToBackend(request, backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[Chat Contacts API] Backend returned error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200),
      })
      return NextResponse.json(
        { error: 'Backend error', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json().catch(() => null)
    console.log('[Chat Contacts API] Backend response', {
      hasData: !!data,
      hasSuccess: !!data?.success,
      contactsCount: data?.contacts?.length || 0,
    })

    // Return the parsed data as a fresh NextResponse
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[Chat Contacts API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load contacts', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

