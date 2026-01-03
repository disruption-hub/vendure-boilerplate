import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenant Preferences API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      )
    }

    const response = await proxyToBackend(request, `/api/v1/admin/tenant/preferences?tenantId=${encodeURIComponent(tenantId)}`)
    
    // If backend returns 404, return empty personalization
    if (response.status === 404) {
      return NextResponse.json({
        personalization: null,
      })
    }

    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      // Normalize response format
      if (data.personalization !== undefined) {
        return NextResponse.json(data)
      }
      // If backend returns different format, wrap it
      return NextResponse.json({
        personalization: data,
      })
    }

    return response
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/tenant/preferences:', error)
    // Return empty personalization on error
    return NextResponse.json({
      personalization: null,
    })
  }
}

export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenant Preferences API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    
    if (!body.tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId in request body' },
        { status: 400 }
      )
    }

    const response = await proxyToBackend(request, '/api/v1/admin/tenant/preferences', {
      method: 'PUT',
      body,
    })

    // If backend returns 404, return success with the provided data
    if (response.status === 404) {
      return NextResponse.json({
        personalization: body.personalization || null,
      })
    }

    return response
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/tenant/preferences:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The tenant preferences endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

