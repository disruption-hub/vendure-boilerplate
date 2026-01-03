import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenants API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const { id: tenantId } = await params
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant ID' },
        { status: 400 }
      )
    }

    console.log('[Tenants API] Get - Fetching tenant:', { tenantId })

    const response = await proxyToBackend(request, `/api/v1/admin/tenants/${tenantId}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const responseClone = response.clone()
      const errorData = await responseClone.json().catch(async () => {
        const text = await responseClone.text().catch(() => 'Unknown error')
        return { message: text }
      })
      console.error('[Tenants API] Get - Backend error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        tenantId,
      })
    } else {
      console.log('[Tenants API] Get - Success:', { tenantId, status: response.status })
    }

    return response
  } catch (error) {
    console.error('[Tenants API] Get - Error:', error)
    return NextResponse.json(
      { error: 'Backend request failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenants API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const { id: tenantId } = await params
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant ID' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    
    // Transform frontend TenantPayload to backend UpdateTenantDto format
    const backendPayload: any = {}

    if (body.name !== undefined) {
      backendPayload.name = body.name.trim()
    }
    if (body.domain !== undefined) {
      backendPayload.domain = body.domain?.trim() || null
    } else if (body.subdomain !== undefined) {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'flowcast.chat'
      backendPayload.domain = body.subdomain?.trim() ? `${body.subdomain.trim()}.${rootDomain}` : null
    }
    if (body.settings !== undefined || body.primaryColor !== undefined || body.logoUrl !== undefined) {
      // Only include logoUrl if it's a valid URL string (data URLs are valid)
      const logoUrl = body.logoUrl && typeof body.logoUrl === 'string' && body.logoUrl.trim()
        ? body.logoUrl.trim()
        : undefined
      
      // Validate URL format if provided
      let validLogoUrl: string | undefined = undefined
      if (logoUrl) {
        // Check if it's a data URL or regular URL
        if (logoUrl.startsWith('data:') || logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
          validLogoUrl = logoUrl
        }
      }
      
      // Ensure primaryColor is always a valid string (required by backend)
      const primaryColor = body.primaryColor?.trim() || body.settings?.branding?.primaryColor?.trim() || '#3b82f6'
      
      const branding: any = {
        primaryColor: primaryColor,
      }
      
      // Only include logoUrl if it's valid (optional field)
      if (validLogoUrl) {
        branding.logoUrl = validLogoUrl
      } else if (logoUrl === null || logoUrl === '') {
        // Explicitly set to null if it was cleared
        branding.logoUrl = null
      }
      
      // Build the settings object with all necessary fields
      // The backend will merge this with existing settings from the database
      const requestSettings = body.settings || {}
      
      const mergedSettings: any = {
        ...requestSettings, // Include all settings from the request
        features: Array.isArray(requestSettings.features) ? requestSettings.features : (requestSettings.features || []),
        limits: {
          maxUsers: typeof requestSettings.limits?.maxUsers === 'number' ? requestSettings.limits.maxUsers : (requestSettings.limits?.maxUsers || 10),
          maxTrademarks: typeof requestSettings.limits?.maxTrademarks === 'number' ? requestSettings.limits.maxTrademarks : (requestSettings.limits?.maxTrademarks || 5),
        },
        branding,
      }
      
      // CRITICAL: Ensure lyraConfig from request is included completely
      // The backend will merge this with existing lyraConfig to preserve testMode/productionMode credentials
      if (requestSettings.lyraConfig) {
        mergedSettings.lyraConfig = requestSettings.lyraConfig
        console.log('[Tenants API] Update - Sending lyraConfig to backend:', {
          hasLyraConfig: !!requestSettings.lyraConfig,
          activeMode: requestSettings.lyraConfig.activeMode,
          testModeEnabled: requestSettings.lyraConfig.testMode?.enabled,
          productionModeEnabled: requestSettings.lyraConfig.productionMode?.enabled,
          hasTestMode: !!requestSettings.lyraConfig.testMode,
          hasProductionMode: !!requestSettings.lyraConfig.productionMode,
        })
      }
      
      // Preserve customization if present
      if (requestSettings.customization) {
        mergedSettings.customization = requestSettings.customization
      }
      
      backendPayload.settings = mergedSettings
    }
    if (body.isActive !== undefined) {
      backendPayload.isActive = body.isActive
    }
    if (body.paymentReturnHomeUrl !== undefined) {
      backendPayload.paymentReturnHomeUrl = body.paymentReturnHomeUrl?.trim() || null
    }
    // Include all other tenant fields that might be sent
    const otherFields = [
      'displayName', 'legalName', 'tagline', 'contactEmail', 'contactPhone',
      'websiteUrl', 'industry', 'addressLine1', 'addressLine2', 'city',
      'state', 'postalCode', 'country', 'subdomain'
    ]
    for (const field of otherFields) {
      if (body[field] !== undefined) {
        backendPayload[field] = typeof body[field] === 'string' ? body[field].trim() || null : body[field]
      }
    }

    console.log('[Tenants API] Update - Original payload:', JSON.stringify(body, null, 2))
    console.log('[Tenants API] Update - Transformed payload:', JSON.stringify(backendPayload, null, 2))

    const response = await proxyToBackend(request, `/api/v1/admin/tenants/${tenantId}`, {
      method: 'PUT',
      body: backendPayload,
    })

    if (!response.ok) {
      const responseClone = response.clone()
      const errorData = await responseClone.json().catch(async () => {
        const text = await responseClone.text().catch(() => 'Unknown error')
        return { message: text }
      })
      console.error('[Tenants API] Update - Backend error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        tenantId,
        payload: backendPayload,
      })
      
      // Return a more detailed error response
      return NextResponse.json(
        {
          error: 'Backend validation failed',
          message: errorData.message || errorData.error || 'Validation error',
          details: errorData,
        },
        { status: response.status }
      )
    } else {
      console.log('[Tenants API] Update - Success:', response.status)
    }

    return response
  } catch (error) {
    console.error('[Tenants API] Update - Error processing request:', error)
    return NextResponse.json(
      { error: 'Invalid request body', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenants API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const { id: tenantId } = await params
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant ID' },
        { status: 400 }
      )
    }

    const response = await proxyToBackend(request, `/api/v1/admin/tenants/${tenantId}`, {
      method: 'DELETE',
    })

    return response
  } catch (error) {
    console.error('[Tenants API] Delete - Error:', error)
    return NextResponse.json(
      { error: 'Backend request failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenants API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const { id: tenantId } = await params
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant ID' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  } catch (error) {
    console.error('[Tenants API] POST - Error:', error)
    return NextResponse.json(
      { error: 'Backend request failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
