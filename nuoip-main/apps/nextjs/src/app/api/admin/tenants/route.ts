import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  // Check if Authorization header is present
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenants API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }
  
  try {
    const response = await proxyToBackend(request, '/api/v1/admin/tenants')
    
    // If successful, check response format and normalize it
    if (response.ok) {
      // Clone response to read body without consuming it
      const clonedResponse = response.clone()
      const data = await clonedResponse.json().catch(() => null)
      if (data) {
        // Backend returns array directly, wrap it in { tenants: [...] }
        if (Array.isArray(data)) {
          console.log('[Tenants API] Backend returned array, wrapping in tenants property')
          return NextResponse.json({ tenants: data })
        }
        // If already has tenants property, return as-is
        if (data.tenants && Array.isArray(data.tenants)) {
          console.log('[Tenants API] Backend returned object with tenants property')
          return NextResponse.json(data)
        }
        console.log('[Tenants API] Unknown response format:', data)
      }
      return response
    }
    
    // Check if backend returned 404 (endpoint doesn't exist)
    if (response.status === 404) {
      // Try to get current user's tenant from auth/me endpoint as fallback
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
          process.env.BACKEND_URL || 
          'https://nuoip-production.up.railway.app'
        const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')
        
        const meResponse = await fetch(`${normalizedBackendUrl}/api/v1/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          signal: AbortSignal.timeout(5000),
        })
        
        if (meResponse.ok) {
          const currentUser = await meResponse.json()
          if (currentUser.tenantId) {
            // Return the current user's tenant as a single-item list
            return NextResponse.json({
              tenants: [{
                id: currentUser.tenantId,
                name: 'Current Tenant',
                displayName: 'Current Tenant',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }],
            })
          }
        }
      } catch (meError) {
        console.log('Could not fetch current user tenant:', meError)
      }
      
      return NextResponse.json(
        { tenants: [], message: 'Tenants endpoint not yet implemented in backend' },
        { status: 200 }
      )
    }
    return response
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/tenants:', error)
    
    // Try to get current user's tenant as fallback
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
        process.env.BACKEND_URL || 
        'https://nuoip-production.up.railway.app'
      const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')
      
      const meResponse = await fetch(`${normalizedBackendUrl}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        signal: AbortSignal.timeout(5000),
      })
      
      if (meResponse.ok) {
        const currentUser = await meResponse.json()
        if (currentUser.tenantId) {
          return NextResponse.json({
            tenants: [{
              id: currentUser.tenantId,
              name: 'Current Tenant',
              displayName: 'Current Tenant',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }],
          })
        }
      }
    } catch (meError) {
      console.log('Could not fetch current user tenant:', meError)
    }
    
    return NextResponse.json(
      { tenants: [], message: 'Tenants endpoint not yet implemented in backend' },
      { status: 200 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenants API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }
  
  try {
    const body = await request.json().catch(() => ({}))
    
    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Tenant name is required' },
        { status: 400 }
      )
    }
    
    // Transform frontend TenantPayload to backend CreateTenantDto format
    // Backend expects: { name, domain?, settings?: { features, limits, branding } }
    const backendPayload: any = {
      name: body.name.trim(),
    }
    
    // Add domain if provided or construct from subdomain
    if (body.domain?.trim()) {
      backendPayload.domain = body.domain.trim()
    } else if (body.subdomain?.trim()) {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'flowcast.chat'
      backendPayload.domain = `${body.subdomain.trim()}.${rootDomain}`
    }
    
    // Add settings if provided
    if (body.settings || body.primaryColor || body.logoUrl) {
      backendPayload.settings = {
        features: body.settings?.features || [],
        limits: {
          maxUsers: body.settings?.limits?.maxUsers ?? 10,
          maxTrademarks: body.settings?.limits?.maxTrademarks ?? 5,
        },
        branding: {
          primaryColor: body.primaryColor?.trim() || '#3b82f6',
          logoUrl: body.logoUrl || null,
        },
      }
    }
    
    console.log('[Tenants API] Original payload:', JSON.stringify(body, null, 2))
    console.log('[Tenants API] Transformed payload:', JSON.stringify(backendPayload, null, 2))
    
    try {
      const response = await proxyToBackend(request, '/api/v1/admin/tenants', {
        method: 'POST',
        body: backendPayload,
      })
      
      // Log backend response for debugging
      if (!response.ok) {
        // Clone response to read body without consuming it
        const responseClone = response.clone()
        const errorData = await responseClone.json().catch(async () => {
          const text = await responseClone.text().catch(() => 'Unknown error')
          return { message: text }
        })
        console.error('[Tenants API] Backend error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
      } else {
        console.log('[Tenants API] Success:', response.status)
      }
      
      return response
    } catch (proxyError) {
      console.error('[Tenants API] Proxy error:', proxyError)
      return NextResponse.json(
        { 
          error: 'Backend request failed', 
          message: proxyError instanceof Error ? proxyError.message : 'Unknown error' 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Tenants API] Error processing request:', error)
    return NextResponse.json(
      { error: 'Invalid request body', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}
