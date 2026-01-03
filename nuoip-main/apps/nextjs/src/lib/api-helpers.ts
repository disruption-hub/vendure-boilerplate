import { NextRequest, NextResponse } from 'next/server'

// Normalize backend URL (remove trailing slash)
const getBackendUrl = () => {
  // If explicitly set via environment variables, use those (for production/deployment)
  if (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL) {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || ''
    return url.replace(/\/+$/, '') // Remove trailing slashes
  }

  // For localhost: VERCEL_URL, VERCEL, and VERCEL_ENV are only set on Vercel
  // If none of these are set, we're running locally
  // This is safe because Vercel ALWAYS sets at least one of these
  const hasVercelEnv = !!(process.env.VERCEL || process.env.VERCEL_URL || process.env.VERCEL_ENV)
  const hasRailwayEnv = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_ENVIRONMENT_NAME)
  const isDeployed = hasVercelEnv || hasRailwayEnv

  if (!isDeployed) {
    // We're running locally - use localhost backend
    return 'http://localhost:3001'
  }

  // Fallback to production URL (only if on Vercel and no env vars set)
  return 'https://nuoip-production.up.railway.app'
}

// Don't evaluate at module load - evaluate at runtime for each request
// This ensures environment variables are read correctly
const getBackendUrlRuntime = () => getBackendUrl()
const BACKEND_URL = getBackendUrlRuntime() // Still initialize for backward compatibility, but will be overridden

export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
  } = {}
) {
  try {
    // Get backend URL at runtime to ensure env vars are read correctly
    const runtimeBackendUrl = getBackendUrlRuntime()
    const authHeader = request.headers.get('Authorization')

    // Log for debugging
    console.log(`[API Proxy] ${options.method || request.method} ${backendPath}`, {
      hasAuth: !!authHeader,
      authPrefix: authHeader?.substring(0, 10),
      backendUrl: runtimeBackendUrl,
      fullUrl: `${runtimeBackendUrl}${backendPath}`,
    })

    const apiUrl = `${runtimeBackendUrl}${backendPath}`

    const fetchOptions: RequestInit = {
      method: options.method || request.method,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
        ...options.headers,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    }

    if (options.body) {
      // If body is already a string, send it as-is (essential for preserving raw payloads and signatures)
      fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
    } else if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        fetchOptions.body = await request.text()
      } catch {
        // No body
      }
    }

    const response = await fetch(apiUrl, fetchOptions)

    if (!response.ok) {
      // Try to parse as JSON first, fallback to text
      let errorData: any = null
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        try {
          errorData = await response.json()
        } catch {
          // If JSON parsing fails, try text
          const errorText = await response.text().catch(() => 'Unknown error')
          errorData = { error: errorText, message: errorText }
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        errorData = { error: errorText, message: errorText }
      }

      console.error(`Backend error [${backendPath}]:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: apiUrl,
      })

      // For 404 errors, return empty data instead of error for some endpoints
      if (response.status === 404) {
        // Return appropriate empty response based on endpoint
        if (backendPath.includes('/sessions')) {
          return NextResponse.json({ sessions: [] }, { status: 200 })
        }
        if (backendPath.includes('/messages')) {
          return NextResponse.json({ messages: [] }, { status: 200 })
        }
        if (backendPath.includes('/contacts')) {
          return NextResponse.json({ contacts: [] }, { status: 200 })
        }
        if (backendPath.includes('/analytics')) {
          return NextResponse.json({ success: false, totalMessages: 0 }, { status: 200 })
        }
        if (backendPath.includes('/config')) {
          return NextResponse.json({ config: null }, { status: 200 })
        }
        if (backendPath.includes('/connect')) {
          return NextResponse.json({ success: false, message: 'Endpoint not yet implemented' }, { status: 200 })
        }
        if (backendPath.includes('/disconnect')) {
          return NextResponse.json({ success: false, message: 'Endpoint not yet implemented' }, { status: 200 })
        }
        if (backendPath.includes('/status')) {
          return NextResponse.json({ status: 'DISCONNECTED' }, { status: 200 })
        }
      }

      // For 401 errors, log more details for debugging
      if (response.status === 401) {
        console.error(`[API Proxy] 401 Unauthorized for ${backendPath}`, {
          hasAuthHeader: !!authHeader,
          authHeaderPrefix: authHeader?.substring(0, 20),
          url: apiUrl,
        })
      }

      // Preserve error structure from backend (including code field)
      return NextResponse.json(
        errorData || { error: `Request failed: ${response.status}`, message: 'Unknown error' },
        { status: response.status }
      )
    }

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`API proxy error [${backendPath}]:`, error)
    return NextResponse.json(
      { error: error.message || 'Request failed' },
      { status: 500 }
    )
  }
}

/**
 * Proxy streaming (SSE) requests to the backend
 * This preserves the Server-Sent Events format instead of converting to JSON
 */
export async function proxyStreamToBackend(
  request: NextRequest,
  backendPath: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
  } = {}
) {
  try {
    const authHeader = request.headers.get('Authorization')

    // Get backend URL at runtime
    const runtimeBackendUrl = getBackendUrlRuntime()
    console.log(`[Stream Proxy] ${options.method || request.method} ${backendPath}`, {
      hasAuth: !!authHeader,
      backendUrl: runtimeBackendUrl,
    })

    const apiUrl = `${runtimeBackendUrl}${backendPath}`

    const fetchOptions: RequestInit = {
      method: options.method || request.method,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
        ...options.headers,
      },
    }

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body)
    }

    const response = await fetch(apiUrl, fetchOptions)

    if (!response.ok) {
      console.error(`[Stream Proxy] Backend error [${backendPath}]:`, {
        status: response.status,
        statusText: response.statusText,
      })

      // Return error as SSE format
      const errorEvent = `data: ${JSON.stringify({
        type: 'error',
        error: `Backend error: ${response.status} ${response.statusText}`
      })}\n\n`

      return new Response(errorEvent, {
        status: 200, // SSE should always return 200
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Forward the SSE stream directly
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error(`[Stream Proxy] Error [${backendPath}]:`, error)

    // Return error as SSE format
    const errorEvent = `data: ${JSON.stringify({
      type: 'error',
      error: error.message || 'Stream proxy failed'
    })}\n\n`

    return new Response(errorEvent, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }
}

export function handleCORS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

