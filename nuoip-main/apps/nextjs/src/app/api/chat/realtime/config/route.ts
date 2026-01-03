import { NextRequest, NextResponse } from 'next/server'
import { getPublicRealtimeConfig } from '@/lib/realtime/soketi'
import { handleCORS, proxyToBackend } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
    // First try to get config from database via backend (only if we have auth)
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
          process.env.BACKEND_URL ||
          'https://nuoip-production.up.railway.app'
        const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')

        const response = await fetch(`${normalizedBackendUrl}/api/v1/admin/system/realtime`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          const backendData = await response.json()

          if (backendData.exists && backendData.config && backendData.config.enabled) {
            const config = {
              key: backendData.config.key,
              host: (backendData.config.publicHost || '').trim(),
              port: backendData.config.publicPort,
              useTLS: backendData.config.useTLS,
              appId: backendData.config.appId,
              cluster: 'mt1',
            }

            return NextResponse.json({
              success: true,
              config,
            })
          }
        }
      } catch (backendError) {
        console.log('Backend config fetch failed, trying fallback:', backendError)
      }
    }

    // Fallback to getPublicRealtimeConfig (which uses env vars)
    try {
      // Log env vars availability for debugging
      console.log('[realtime/config] Checking env vars:', {
        hasAppId: !!process.env.SOKETI_DEFAULT_APP_ID,
        hasKey: !!process.env.SOKETI_DEFAULT_APP_KEY,
        hasSecret: !!process.env.SOKETI_DEFAULT_APP_SECRET,
        hasPublicHost: !!process.env.SOKETI_PUBLIC_HOST,
        publicHost: process.env.SOKETI_PUBLIC_HOST,
        publicPort: process.env.SOKETI_PUBLIC_PORT,
      })

      const config = await getPublicRealtimeConfig()

      if (!config) {
        // Return a disabled config instead of null to prevent errors
        // Realtime is optional for development, so we use console.log instead of warn
        console.log('[realtime/config] No config available - realtime features disabled (optional for development)')
        return NextResponse.json({
          success: false,
          hasConfig: false,
          message: 'Realtime features are disabled. This is optional for development.',
          config: null,
        })
      }

      console.log('[realtime/config] Returning config from env vars:', {
        host: config.host,
        port: config.port,
        appId: config.appId,
        useTLS: config.useTLS,
      })

      return NextResponse.json({
        success: true,
        config,
      })
    } catch (fallbackError) {
      console.error('[realtime/config] Error in getPublicRealtimeConfig fallback:', fallbackError)
      return NextResponse.json({
        success: false,
        message: 'Realtime configuration error',
        config: null,
      })
    }
  } catch (error) {
    console.error('Error fetching realtime config:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch realtime configuration',
        config: null,
      },
      { status: 500 }
    )
  }
}

